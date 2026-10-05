# -*- coding: utf-8 -*-
"""Simula a un atacante que ya ejecuta SQL con las credenciales de la API.

La pregunta que responde: ¿puede leer las filas de otro usuario? Antes sí, solo
tenía que escribir el id ajeno en el GUC. Ahora el id tiene que ir firmado.
"""
import hashlib
import hmac
import json
import os
from pathlib import Path

import psycopg2

AQUI = Path(__file__).parent
# Credenciales por variables de entorno; nunca en el repositorio.
#   ADMIN_DATABASE_URL  superusuario, solo para preparar y limpiar los datos
#   APP_DB_PASSWORD     contraseña del rol app_user
#   RLS_CONTEXT_SECRET  el mismo secreto que usa el backend
pg = {'DATABASE_PUBLIC_URL': os.environ['ADMIN_DATABASE_URL']}
cred = {'app_user': os.environ['APP_DB_PASSWORD'],
        'rls_secret': os.environ['RLS_CONTEXT_SECRET']}
host_base = pg['DATABASE_PUBLIC_URL'].split('@')[-1]
host, resto = host_base.split('/')
hostname, puerto = host.split(':')
base = resto.split('?')[0]


def firma(uid: int) -> str:
    return hmac.new(cred['rls_secret'].encode(), str(uid).encode(), hashlib.sha256).hexdigest()


admin = psycopg2.connect(pg['DATABASE_PUBLIC_URL'], sslmode='require', connect_timeout=20)
admin.autocommit = True
ca = admin.cursor()
app = psycopg2.connect(host=hostname, port=puerto, dbname=base, user='app_user',
                       password=cred['app_user'], sslmode='require', connect_timeout=20)

resultados = []


def check(nombre, ok, detalle=''):
    resultados.append(ok)
    print(f"  {'OK ' if ok else 'MAL'} {nombre}{(' -> ' + detalle) if detalle else ''}")


ca.execute("DELETE FROM users WHERE username IN ('sup_ana', 'sup_jefe')")
ids = {}
for u, es_admin in (('sup_ana', False), ('sup_jefe', True)):
    ca.execute("INSERT INTO users (username, email, hashed_password, is_admin) "
               "VALUES (%s, %s, 'x', %s) RETURNING id", (u, f'{u}@prueba.test', es_admin))
    ids[u] = ca.fetchone()[0]
print(f"usuarios de prueba: ana={ids['sup_ana']}, jefe(admin)={ids['sup_jefe']}\n")

print('1. La aplicación legítima, con firma')
c = app.cursor()
c.execute('SELECT app_set_rls_context(%s, %s)', (ids['sup_ana'], firma(ids['sup_ana'])))
c.execute('SELECT COUNT(*) FROM users')
check('Ana ve su propia fila', c.fetchone()[0] == 1)
app.rollback()

print('\n2. Atacante escribe el id ajeno directamente en el GUC')
c = app.cursor()
c.execute("SELECT set_config('app.current_user_id', %s, true)", (str(ids['sup_jefe']),))
c.execute('SELECT COUNT(*) FROM users')
vistas = c.fetchone()[0]
check('no ve ninguna fila sin firma', vistas == 0, f'{vistas} filas')
app.rollback()

print('\n3. Atacante intenta firmar a ojo')
c = app.cursor()
try:
    c.execute('SELECT app_set_rls_context(%s, %s)', (ids['sup_jefe'], 'firma_inventada'))
    check('la base rechaza la firma falsa', False, 'la aceptó')
except Exception as e:
    check('la base rechaza la firma falsa', 'inválida' in str(e) or 'invalid' in str(e).lower(),
          type(e).__name__)
app.rollback()

print('\n4. Atacante reutiliza su propia firma con otro id')
c = app.cursor()
c.execute("SELECT set_config('app.current_user_id', %s, true)", (str(ids['sup_jefe']),))
c.execute("SELECT set_config('app.ctx_sig', %s, true)", (firma(ids['sup_ana']),))
c.execute('SELECT COUNT(*) FROM users')
vistas = c.fetchone()[0]
check('la firma de Ana no sirve para el id del jefe', vistas == 0, f'{vistas} filas')
app.rollback()

print('\n5. Atacante busca el secreto en la base')
c = app.cursor()
try:
    c.execute('SELECT secret FROM app_context_secret')
    check('no puede leer el secreto', False, 'lo leyó')
except Exception as e:
    check('no puede leer el secreto', 'InsufficientPrivilege' in type(e).__name__, type(e).__name__)
app.rollback()

print('\n6. El admin legítimo sí ve todo')
c = app.cursor()
c.execute('SELECT app_set_rls_context(%s, %s)', (ids['sup_jefe'], firma(ids['sup_jefe'])))
c.execute('SELECT COUNT(*) FROM users')
total = c.fetchone()[0]
check('el admin con firma ve más de una fila', total >= 2, f'{total} filas')
app.rollback()

print('\n7. Login sigue funcionando')
c = app.cursor()
c.execute("SELECT username FROM auth_user_for_login('sup_ana')")
r = c.fetchall()
check('auth_user_for_login responde', len(r) == 1 and r[0][0] == 'sup_ana')
app.rollback()

ca.execute("DELETE FROM users WHERE username IN ('sup_ana', 'sup_jefe')")
ok = sum(resultados)
print(f'\nRESULTADO: {ok}/{len(resultados)} comprobaciones correctas')
app.close(); admin.close()
raise SystemExit(0 if ok == len(resultados) else 1)

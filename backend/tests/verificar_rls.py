# -*- coding: utf-8 -*-
"""Comprueba contra la base real que el aislamiento por fila funciona.

Se conecta como app_user, que es el rol de la API, y verifica que sin contexto
no vea nada, que con contexto vea solo lo suyo, y que no pueda leer lo ajeno.
"""
import json
import os
from pathlib import Path

import hashlib
import hmac

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
base = resto.split('?')[0]
hostname, puerto = host.split(':')

admin = psycopg2.connect(pg['DATABASE_PUBLIC_URL'], sslmode='require', connect_timeout=20)
admin.autocommit = True
ca = admin.cursor()

app = psycopg2.connect(host=hostname, port=puerto, dbname=base, user='app_user',
                       password=cred['app_user'], sslmode='require', connect_timeout=20)
app.autocommit = False

def firma(uid):
    return hmac.new(cred['rls_secret'].encode(), str(uid).encode(), hashlib.sha256).hexdigest()


resultados = []


def check(nombre, condicion, detalle=''):
    resultados.append((nombre, condicion))
    print(f"  {'OK ' if condicion else 'MAL'} {nombre}{(' -> ' + detalle) if detalle else ''}")


print('1. Estado de RLS por tabla')
ca.execute("""
    SELECT relname, relrowsecurity, relforcerowsecurity
    FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
    ORDER BY relname
""")
tablas = ca.fetchall()
protegidas = {'users', 'user_techniques', 'user_boss_challenges', 'refresh_tokens', 'audit_log'}
for nombre, activo, forzado in tablas:
    if nombre in protegidas:
        check(f'{nombre}: RLS activo y forzado', activo and forzado, f'activo={activo} forzado={forzado}')

ca.execute("SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'")
n_pol = ca.fetchone()[0]
check(f'políticas creadas ({n_pol})', n_pol >= 10)

print('\n2. Dos usuarios de prueba')
ca.execute("SET app.is_admin = 'true'")
ca.execute("DELETE FROM users WHERE username IN ('rls_ana', 'rls_beto')")
ids = {}
for u in ('rls_ana', 'rls_beto'):
    ca.execute("INSERT INTO users (username, email, hashed_password, is_admin) "
               "VALUES (%s, %s, 'x', false) RETURNING id", (u, f'{u}@prueba.test'))
    ids[u] = ca.fetchone()[0]
print('  creados:', ids)

print('\n3. app_user sin contexto')
c = app.cursor()
c.execute('SELECT COUNT(*) FROM users')
sin_contexto = c.fetchone()[0]
check('no ve ninguna fila sin identificarse', sin_contexto == 0, f'{sin_contexto} filas')
app.rollback()

print('\n4. app_user identificado como Ana')
c = app.cursor()
c.execute('SELECT app_set_rls_context(%s, %s)', (ids['rls_ana'], firma(ids['rls_ana'])))
c.execute('SELECT id, username FROM users')
filas = c.fetchall()
check('ve exactamente una fila', len(filas) == 1, f'{len(filas)} filas')
check('y es la suya', len(filas) == 1 and filas[0][0] == ids['rls_ana'],
      filas[0][1] if filas else 'ninguna')

c.execute('SELECT COUNT(*) FROM users WHERE id = %s', (ids['rls_beto'],))
ajeno = c.fetchone()[0]
check('no puede leer la fila de Beto ni pidiéndola por id', ajeno == 0, f'{ajeno} filas')
app.rollback()

print('\n5. app_user no puede escalar a admin por su cuenta')
c = app.cursor()
try:
    c.execute("SET app.is_admin = 'true'")
    c.execute("SELECT COUNT(*) FROM users")
    total = c.fetchone()[0]
    check('marcarse admin a sí mismo NO debería darle acceso total', total <= 1,
          f'vio {total} filas tras auto-declararse admin')
except Exception as e:
    check('la base rechaza que se declare admin', True, type(e).__name__)
app.rollback()

print('\n6. Función de login acotada')
c = app.cursor()
c.execute("SELECT id, username FROM auth_user_for_login('rls_ana')")
r = c.fetchall()
check('auth_user_for_login devuelve el usuario pedido', len(r) == 1 and r[0][1] == 'rls_ana')
c.execute("SELECT id FROM auth_user_for_login('no_existe')")
check('y nada para un usuario inexistente', len(c.fetchall()) == 0)
app.rollback()

print('\n7. Limpieza')
ca.execute("DELETE FROM users WHERE username IN ('rls_ana', 'rls_beto')")
print('  usuarios de prueba borrados')

ok = sum(1 for _, v in resultados if v)
print(f'\nRESULTADO: {ok}/{len(resultados)} comprobaciones correctas')
app.close(); admin.close()
raise SystemExit(0 if ok == len(resultados) else 1)

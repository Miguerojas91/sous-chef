# Seguridad del backend Sous Chef

## 1. Row-Level Security (RLS)

### Cómo funciona

Las políticas RLS (migraciones `002_enable_rls.py` y `003_refresh_tokens_audit.py`)
leen dos GUCs transaccionales:

```sql
SELECT set_config('app.current_user_id', '<id>', true);
SELECT set_config('app.is_admin',        'true|false', true);
```

Sin ellos las tablas con RLS fallan cerradas (0 filas, INSERT rechazado).
Quién los fija, según el momento del request:

| Momento | Dónde | Contexto RLS |
| ------- | ----- | ------------ |
| Antes de autenticar: login, registro, refresh | `app/core/auth_store.py`, `app/core/tokens.py::rotate_refresh_token` | Ninguno. Usan funciones `SECURITY DEFINER` acotadas (migración 004). |
| Credenciales / refresh token ya verificados | `app/api/auth.py::_load_authenticated_user` | `current_user_id` = ese usuario (nunca `is_admin`). |
| Request con JWT | `app/core/security.py::get_current_user` | `current_user_id` = `sub` del JWT verificado, en la sesión `get_db` del request. |
| Endpoints de datos | `app/core/security.py::get_user_db` | `current_user_id` + `is_admin` leído de la DB. |
| Audit log | `app/core/audit.py::log_event` | Función `audit_log_append` (INSERT sin RETURNING). |
| Scripts de operador (`create_user.py`, `seed_users.py`) | `set_rls_context(is_admin=True)` | Admin, explícito. |

`get_db` **no** es una sesión "sin RLS": es el mismo rol `app_user` sin contexto.
Solo sirve directamente para tablas de catálogo o combinada con `get_current_user`.

Resultado: **aunque un endpoint de datos olvide filtrar por `user_id`, Postgres
no devolverá filas de otros usuarios**.

### Funciones SECURITY DEFINER (migración 004)

| Función | Qué hace | Qué NO puede hacer |
| ------- | -------- | ------------------ |
| `auth_user_for_login(username)` | Devuelve `id, username, hashed_password, is_admin` de un username exacto. | Listar usuarios ni leer email/perfil. |
| `auth_register_user(username, email, hash, allergies, dislikes)` | Crea usuario; `NULL` si username/email existen. | Crear admins (`is_admin` fijo en `false`). |
| `auth_rotate_refresh_token(hash, new_hash, expires, ua, ip)` | Busca por hash con `FOR UPDATE`; `not_found` / `expired` / `reuse_detected` (revoca toda la cadena del usuario) / `ok` (inserta el nuevo y marca `revoked_at` + `replaced_by_id` en el viejo). | Leer tokens sin conocer el token en claro. |
| `audit_log_append(...)` | Inserta una fila en `audit_log`. | Leer, modificar o borrar el log. |

Todas tienen `SET search_path = pg_catalog, public, pg_temp`, tablas calificadas
con `public.`, `REVOKE ALL ... FROM PUBLIC` y `GRANT EXECUTE` solo a `APP_DB_ROLE`
(default `app_user`). Las de auth llevan `SET app.is_admin = 'true'` como
cláusula de la función: Postgres lo aplica solo mientras la función corre y
restaura el valor al salir, así que no se filtra a la transacción del llamador.
Es necesario porque `FORCE ROW LEVEL SECURITY` también aplica al owner.

En SQLite (dev) no hay RLS ni funciones: el mismo código cae a queries ORM
equivalentes según el dialecto de la sesión.

### Tablas con RLS

| Tabla                  | Política                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| `users`                | Solo veo/edito mi fila. Admin ve todas.                          |
| `user_techniques`      | Solo filas con `user_id = yo`. Admin ve todas.                   |
| `user_boss_challenges` | Solo filas con `user_id = yo`. Admin ve todas.                   |
| `refresh_tokens`       | Solo filas con `user_id = yo`. Admin ve todas.                   |
| `audit_log`            | Leo solo mis eventos (admin todos). Escritura vía `audit_log_append`. |

Las tablas de catálogo (`recipes`, `techniques`, `pages`, ...) NO tienen RLS:
son globales. La autorización para escribir en ellas es a nivel de aplicación
(usar `Depends(require_admin)`).

### Límite del modelo

Los GUCs los fija la propia aplicación, así que RLS protege contra **errores de
queries** en la app (un `WHERE` olvidado, un join de más), no contra alguien que
ya ejecuta SQL arbitrario con `app_user`: ese podría llamar a `set_config`. Las
credenciales de `app_user` siguen siendo secretas y las queries siempre deben ir
parametrizadas.

### ⚠️ Requisito crítico: dos roles, ninguno superusuario en la app

RLS **no aplica** a:
- Roles superusuarios (`postgres`, `rds_superuser`).
- Roles con atributo `BYPASSRLS`.

Y el dueño de una tabla puede desactivar RLS con `ALTER TABLE`. Por eso:

- `sous_owner`: dueño del esquema; solo corre migraciones (`MIGRATION_DATABASE_URL`).
- `app_user`: la API (`DATABASE_URL`). Sin `BYPASSRLS`, sin ser dueño de nada.

```sql
-- Como superusuario, una vez en tu DB:
CREATE ROLE sous_owner WITH LOGIN PASSWORD 'genera-uno-fuerte';
CREATE ROLE app_user   WITH LOGIN PASSWORD 'genera-otro-fuerte' NOBYPASSRLS;
GRANT CONNECT ON DATABASE sous_prod TO sous_owner, app_user;
GRANT USAGE, CREATE ON SCHEMA public TO sous_owner;
GRANT USAGE ON SCHEMA public TO app_user;

-- Privilegios de app_user sobre lo que cree sous_owner (tablas y secuencias).
ALTER DEFAULT PRIVILEGES FOR ROLE sous_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE sous_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

Crea `app_user` **antes** de migrar: la migración 004 le concede `EXECUTE` sobre
las funciones. Si no existía, la migración emite un NOTICE y hay que ejecutar
(como `sous_owner`):

```sql
GRANT EXECUTE ON FUNCTION
  public.auth_user_for_login(text),
  public.auth_register_user(text, text, text, text, text),
  public.auth_rotate_refresh_token(text, text, timestamptz, text, text),
  public.audit_log_append(integer, text, text, text, text, text, boolean)
TO app_user;
```

Endurecimiento opcional (el log pasa a ser append-only de verdad para la app):

```sql
REVOKE INSERT, UPDATE, DELETE ON audit_log FROM app_user;
```

### Migrar de SQLite (dev) a Postgres (prod)

```bash
# 1. Crea la DB de prod y los roles sous_owner y app_user (ver arriba).
export MIGRATION_DATABASE_URL="postgresql+asyncpg://sous_owner:PASS@host:5432/sous_prod"
export APP_DB_ROLE=app_user

# 2. Aplica todas las migraciones como owner
alembic upgrade head

# 3. La API usa app_user
export DATABASE_URL="postgresql+asyncpg://app_user:PASS@host:5432/sous_prod"

# 4. (Opcional) seed de catálogo y admin inicial (scripts de operador)
python seed.py
ADMIN_USERNAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... python create_user.py
```

Si la base ya estaba en `003` y las tablas pertenecen a `app_user`, transfiérelas
antes (`ALTER TABLE ... OWNER TO sous_owner;` por tabla y secuencia) y luego
aplica la 004 con `MIGRATION_DATABASE_URL`.

`create_user.py` y `seed_users.py` abren su transacción con `app.is_admin=true`
porque crean cuentas admin, cosa que la función pública de registro no permite.
Son herramientas de operador: ejecútalas solo desde un entorno de confianza.

### Probar que RLS funciona

```sql
-- Conectado como app_user:
\c sous_prod app_user

-- Sin GUC seteado → política falla cerrada
SELECT * FROM users;  -- 0 filas

-- Las funciones de auth sí responden, solo con lo mínimo
SELECT * FROM auth_user_for_login('admin');  -- 1 fila: id, username, hash, is_admin
SELECT current_setting('app.is_admin', true); -- NULL/vacío: la función no lo filtró

-- Con GUC seteado al usuario 1
BEGIN;
SET LOCAL app.current_user_id = '1';
SET LOCAL app.is_admin = 'false';
SELECT * FROM users;            -- solo la fila id=1
SELECT * FROM user_techniques;  -- solo filas con user_id=1
COMMIT;
```

## 2. JWT

Ver `app/core/security.py`. Variables de entorno:

| Variable             | Default | Notas                                              |
| -------------------- | ------- | -------------------------------------------------- |
| `JWT_SECRET`         | (efímero en dev) | **REQUERIDA en prod.** Genera 64 chars random. |
| `JWT_ALGORITHM`      | `HS256` |                                                    |
| `JWT_EXPIRE_MINUTES` | `1440`  | 24 h                                               |

Genera un secret fuerte:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 3. Variables de entorno requeridas en producción

```bash
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://app_user:...@host/sous_prod
JWT_SECRET=<48+ chars random>
ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```

Sin alguna de estas, la app debe fallar al arrancar (ver `main.py` y
`app/core/security.py`).

## 4. Próximos pasos sugeridos

- [ ] Refresh tokens (rotación + revocación con tabla `revoked_tokens`).
- [ ] Hash del refresh token + lookup por user_id (no almacenar tokens en claro).
- [ ] Auditoría: tabla `audit_log` con `user_id`, `action`, `ip`, `ts`.
- [ ] Rate limiting en `/auth/login` (slowapi/fastapi-limiter) para frenar brute force.
- [ ] CSP headers + HSTS via middleware.
- [ ] Connection pool con `app_user` validado al iniciar (PRE-PING + verificar `pg_has_role`).

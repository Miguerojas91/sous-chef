# Seguridad del backend Sous Chef

## 1. Row-Level Security (RLS)

### Cómo funciona

La aplicación setea dos GUCs por transacción al iniciar cada request autenticado
(ver `app/core/security.py::get_user_db`):

```sql
SELECT set_config('app.current_user_id', '<id>', true);
SELECT set_config('app.is_admin',        'true|false', true);
```

Las políticas RLS definidas en la migración `002_enable_rls.py` filtran las
filas según estos valores. Resultado: **aunque un endpoint olvide filtrar por
`user_id`, Postgres no devolverá filas de otros usuarios**.

### Tablas con RLS

| Tabla                  | Política                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| `users`                | Solo veo/edito mi fila. Admin ve todas.                          |
| `user_techniques`      | Solo filas con `user_id = yo`. Admin ve todas.                   |
| `user_boss_challenges` | Solo filas con `user_id = yo`. Admin ve todas.                   |

Las tablas de catálogo (`recipes`, `techniques`, `pages`, ...) NO tienen RLS:
son globales. La autorización para escribir en ellas es a nivel de aplicación
(usar `Depends(require_admin)`).

### ⚠️ Requisito crítico: rol no-superusuario

RLS **no aplica** a:
- Roles superusuarios (`postgres`, `rds_superuser`).
- Roles con atributo `BYPASSRLS`.

En **producción** crea un rol dedicado y úsalo en `DATABASE_URL`:

```sql
-- Como superusuario, una vez en tu DB:
CREATE ROLE app_user WITH LOGIN PASSWORD 'genera-uno-fuerte';
GRANT CONNECT ON DATABASE sous_prod TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- IMPORTANTE: confirma que NO tiene BYPASSRLS
ALTER ROLE app_user NOBYPASSRLS;
```

Luego setea `DATABASE_URL=postgresql+asyncpg://app_user:...@host/db`.

`FORCE ROW LEVEL SECURITY` (que activa la migración 002) hace que RLS también
aplique al OWNER de la tabla, así que no puedes saltártelo accidentalmente.

### Migrar de SQLite (dev) a Postgres (prod)

```bash
# 1. Crea la DB de prod y el rol app_user (ver arriba).
export DATABASE_URL="postgresql+asyncpg://app_user:PASS@host:5432/sous_prod"

# 2. Aplica todas las migraciones
alembic upgrade head

# 3. (Opcional) seed de datos de catálogo (recipes, techniques)
python seed.py
```

### Probar que RLS funciona

```sql
-- Conectado como app_user:
\c sous_prod app_user

-- Sin GUC seteado → política falla cerrada
SELECT * FROM users;  -- 0 filas

-- Con GUC seteado al usuario 1
SET LOCAL app.current_user_id = '1';
SET LOCAL app.is_admin = 'false';
SELECT * FROM users;            -- solo la fila id=1
SELECT * FROM user_techniques;  -- solo filas con user_id=1
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

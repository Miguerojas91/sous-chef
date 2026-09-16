"""auth SECURITY DEFINER functions (Postgres only)

Revision ID: 004_auth_definer_functions
Revises: 003_refresh_tokens_audit
Create Date: 2026-09-16

Las políticas de 002/003 exigen `app.current_user_id` / `app.is_admin`, pero
login, registro y refresh ocurren ANTES de saber quién es el usuario. Con el
rol `app_user` (sin BYPASSRLS) esas operaciones no veían ni podían insertar
filas. Esta migración crea funciones acotadas para ese tramo:

- auth_user_for_login(username)            → id, username, hashed_password, is_admin
- auth_register_user(...)                  → id nuevo (siempre is_admin=false) o NULL si duplicado
- auth_rotate_refresh_token(hash, ...)     → rota / detecta reuso y revoca la cadena
- audit_log_append(...)                    → INSERT sin RETURNING (append-only)

Detalles de seguridad:
- SECURITY DEFINER + `SET search_path` fijo y tablas calificadas con `public.`.
- `SET app.is_admin = 'true'` como cláusula de la función: vale solo mientras
  corre la función y Postgres restaura el valor anterior al salir, así que no
  se filtra a la transacción del llamador. Hace falta porque FORCE RLS también
  aplica al owner de las tablas.
- `REVOKE ALL ... FROM PUBLIC` y `GRANT EXECUTE` solo al rol de la app
  (`APP_DB_ROLE`, default `app_user`). Si el rol no existe todavía se omite el
  GRANT con un NOTICE; hay que concederlo a mano (ver SECURITY.md).

En SQLite esta migración es un no-op (la app usa queries ORM equivalentes).
"""
import os
import re

from alembic import op


revision = "004_auth_definer_functions"
down_revision = "003_refresh_tokens_audit"
branch_labels = None
depends_on = None


FUNCTION_SIGNATURES = [
    "public.auth_user_for_login(text)",
    "public.auth_register_user(text, text, text, text, text)",
    "public.auth_rotate_refresh_token(text, text, timestamptz, text, text)",
    "public.audit_log_append(integer, text, text, text, text, text, boolean)",
]

_COMMON = """
    SECURITY DEFINER
    SET search_path = pg_catalog, public, pg_temp
"""


def _is_postgres() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _app_role() -> str:
    role = os.getenv("APP_DB_ROLE", "app_user")
    # Se interpola en SQL: solo identificadores simples.
    if not re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", role):
        raise RuntimeError(f"APP_DB_ROLE inválido: {role!r}")
    return role


def upgrade() -> None:
    if not _is_postgres():
        return

    op.execute(f"""
        CREATE OR REPLACE FUNCTION public.auth_user_for_login(p_username text)
        RETURNS TABLE (id integer, username text, hashed_password text, is_admin boolean)
        LANGUAGE sql STABLE
        {_COMMON}
        SET app.is_admin = 'true'
        AS $fn$
            SELECT u.id, u.username::text, u.hashed_password::text, u.is_admin
            FROM public.users u
            WHERE u.username = p_username
            LIMIT 1
        $fn$;
    """)

    op.execute(f"""
        CREATE OR REPLACE FUNCTION public.auth_register_user(
            p_username text, p_email text, p_hashed_password text,
            p_allergies text, p_dislikes text
        )
        RETURNS integer
        LANGUAGE plpgsql VOLATILE
        {_COMMON}
        SET app.is_admin = 'true'
        AS $fn$
        DECLARE
            v_id integer;
        BEGIN
            IF EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.username = p_username OR u.email = p_email
            ) THEN
                RETURN NULL;
            END IF;

            -- is_admin fijo en false: esta función nunca debe poder crear admins.
            INSERT INTO public.users (username, email, hashed_password, is_admin, xp, allergies, dislikes)
            VALUES (p_username, p_email, p_hashed_password, false, 0,
                    COALESCE(p_allergies, '[]'), COALESCE(p_dislikes, '[]'))
            RETURNING users.id INTO v_id;
            RETURN v_id;
        EXCEPTION
            -- Carrera entre dos registros simultáneos: se trata como duplicado.
            WHEN unique_violation THEN
                RETURN NULL;
        END
        $fn$;
    """)

    # Columnas de salida con nombres distintos a los de la tabla para evitar
    # ambigüedades de plpgsql (p.ej. `user_id`).
    op.execute(f"""
        CREATE OR REPLACE FUNCTION public.auth_rotate_refresh_token(
            p_token_hash text, p_new_token_hash text, p_new_expires_at timestamptz,
            p_user_agent text, p_ip text
        )
        RETURNS TABLE (result text, owner_id integer, revoked integer)
        LANGUAGE plpgsql VOLATILE
        {_COMMON}
        SET app.is_admin = 'true'
        AS $fn$
        DECLARE
            v_id integer;
            v_user_id integer;
            v_expires_at timestamptz;
            v_revoked_at timestamptz;
            v_new_id integer;
            v_count integer;
        BEGIN
            -- FOR UPDATE serializa refresh concurrentes del mismo token: el
            -- segundo ve el token ya revocado y cae en detección de reuso.
            SELECT t.id, t.user_id, t.expires_at, t.revoked_at
              INTO v_id, v_user_id, v_expires_at, v_revoked_at
              FROM public.refresh_tokens t
             WHERE t.token_hash = p_token_hash
             FOR UPDATE;

            IF NOT FOUND THEN
                RETURN QUERY SELECT 'not_found'::text, NULL::integer, 0;
                RETURN;
            END IF;

            IF v_revoked_at IS NOT NULL THEN
                UPDATE public.refresh_tokens t
                   SET revoked_at = now()
                 WHERE t.user_id = v_user_id AND t.revoked_at IS NULL;
                GET DIAGNOSTICS v_count = ROW_COUNT;
                RETURN QUERY SELECT 'reuse_detected'::text, v_user_id, v_count;
                RETURN;
            END IF;

            IF v_expires_at < now() THEN
                RETURN QUERY SELECT 'expired'::text, v_user_id, 0;
                RETURN;
            END IF;

            INSERT INTO public.refresh_tokens AS t (user_id, token_hash, expires_at, user_agent, ip)
            VALUES (v_user_id, p_new_token_hash, p_new_expires_at,
                    left(p_user_agent, 512), left(p_ip, 64))
            RETURNING t.id INTO v_new_id;

            UPDATE public.refresh_tokens t
               SET revoked_at = now(), replaced_by_id = v_new_id
             WHERE t.id = v_id;

            RETURN QUERY SELECT 'ok'::text, v_user_id, 0;
        END
        $fn$;
    """)

    # Sin `app.is_admin`: el INSERT ya lo permite la política de 003 y no
    # necesita leer filas. DEFINER permite quitar el INSERT directo a app_user.
    op.execute(f"""
        CREATE OR REPLACE FUNCTION public.audit_log_append(
            p_user_id integer, p_action text, p_target text, p_ip text,
            p_user_agent text, p_metadata text, p_ok boolean
        )
        RETURNS void
        LANGUAGE sql VOLATILE
        {_COMMON}
        AS $fn$
            INSERT INTO public.audit_log (user_id, action, target, ip, user_agent, metadata, ok)
            VALUES (p_user_id, left(p_action, 64), left(p_target, 255), left(p_ip, 64),
                    left(p_user_agent, 512), p_metadata, COALESCE(p_ok, true))
        $fn$;
    """)

    role = _app_role()
    for sig in FUNCTION_SIGNATURES:
        op.execute(f"REVOKE ALL ON FUNCTION {sig} FROM PUBLIC")
    grants = "\n".join(
        f"            EXECUTE format('GRANT EXECUTE ON FUNCTION {sig} TO %I', '{role}');"
        for sig in FUNCTION_SIGNATURES
    )
    op.execute(f"""
        DO $do$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '{role}') THEN
{grants}
            ELSE
                RAISE NOTICE 'Rol % no existe: concede EXECUTE sobre las funciones auth_* y audit_log_append manualmente.', '{role}';
            END IF;
        END
        $do$;
    """)


def downgrade() -> None:
    if not _is_postgres():
        return
    for sig in reversed(FUNCTION_SIGNATURES):
        op.execute(f"DROP FUNCTION IF EXISTS {sig}")

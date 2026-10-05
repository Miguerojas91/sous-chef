"""La base decide quién es admin, no el cliente

Hasta aquí, el rol de la API fijaba `app.is_admin` él mismo con `set_config`.
Quien lograra ejecutar SQL arbitrario con esas credenciales podía declararse
admin y leer todas las filas: comprobado contra Postgres 18 el 2026-10-05.

Esta migración mueve esa decisión dentro de la base. `app_set_rls_context`
recibe solo el id del usuario, consulta en `users` si ese usuario es admin, y
fija los dos GUCs en consecuencia. El rol de la API pierde el permiso de fijar
`app.is_admin` directamente (eso se revoca fuera de la migración, con el
superusuario, igual que la creación de roles).

La función pertenece a `sous_definer`, un rol sin login y con BYPASSRLS, porque
necesita leer `users` y esa tabla tiene FORCE ROW LEVEL SECURITY, que aplica
incluso a su dueño. Sin ese rol la migración se salta el cambio de dueño y deja
la función en manos de quien migra, que no podría leer la tabla.

Revision ID: 005_admin_context
Revises: 004_auth_definer_functions
"""
import os
import re

import sqlalchemy as sa
from alembic import op

revision = "005_admin_context"
down_revision = "004_auth_definer_functions"
branch_labels = None
depends_on = None

DEFINER_ROLE = "sous_definer"


def _is_postgres() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _app_role() -> str:
    role = os.getenv("APP_DB_ROLE", "app_user")
    if not re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", role):
        raise RuntimeError(f"APP_DB_ROLE inválido: {role!r}")
    return role


def _role_exists(nombre: str) -> bool:
    # `text()` y no `exec_driver_sql`: el driver async usa $1, no %(name)s.
    return bool(op.get_bind().execute(
        sa.text("SELECT 1 FROM pg_roles WHERE rolname = :r"), {"r": nombre}
    ).scalar())


def upgrade() -> None:
    if not _is_postgres():
        return

    app_role = _app_role()

    op.execute("""
        CREATE OR REPLACE FUNCTION public.app_set_rls_context(p_user_id integer)
        RETURNS void
        LANGUAGE sql VOLATILE
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        AS $fn$
            SELECT set_config(
                       'app.current_user_id',
                       CASE WHEN p_user_id IS NULL THEN '' ELSE p_user_id::text END,
                       true),
                   set_config(
                       'app.is_admin',
                       COALESCE((SELECT u.is_admin FROM public.users u
                                 WHERE u.id = p_user_id), false)::text,
                       true);
        $fn$;
    """)

    # Sin BYPASSRLS la función no puede leer `users`: el SELECT del admin
    # devolvería NULL y todo el mundo quedaría como no-admin.
    if _role_exists(DEFINER_ROLE):
        op.execute(f"ALTER FUNCTION public.app_set_rls_context(integer) OWNER TO {DEFINER_ROLE}")

    op.execute("REVOKE ALL ON FUNCTION public.app_set_rls_context(integer) FROM PUBLIC")
    if _role_exists(app_role):
        op.execute(
            f"GRANT EXECUTE ON FUNCTION public.app_set_rls_context(integer) TO {app_role}"
        )


def downgrade() -> None:
    if not _is_postgres():
        return
    op.execute("DROP FUNCTION IF EXISTS public.app_set_rls_context(integer)")

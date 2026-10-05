"""Las políticas dejan de creerle a `app.is_admin`

La migración 005 movió la decisión a la base, pero las políticas seguían
leyendo el GUC `app.is_admin`, y Postgres deja fijar los parámetros con prefijo
propio a cualquier rol: revocar el permiso no sirve, se comprobó contra
Postgres 18 el 2026-10-05. Cualquiera con capacidad de ejecutar SQL como el rol
de la API podía declararse admin y leer todas las filas.

Ahora las políticas llaman a `public.is_admin_now()`, que resuelve la pregunta
contra la tabla `users` a partir de `app.current_user_id`. La función pertenece
a `sous_definer`, con BYPASSRLS, para poder leer `users` sin disparar otra vez
las políticas y sin recursión.

Queda un límite que conviene tener escrito: quien ejecute SQL arbitrario con el
rol de la API todavía puede fijar `app.current_user_id` y hacerse pasar por
otro usuario. Cerrar eso exige un rol de base por usuario, que no es viable
aquí. RLS sigue siendo la red contra errores de lógica, no contra inyección.

Revision ID: 006_admin_from_table
Revises: 005_admin_context
"""
import sqlalchemy as sa
from alembic import op

revision = "006_admin_from_table"
down_revision = "005_admin_context"
branch_labels = None
depends_on = None

DEFINER_ROLE = "sous_definer"

MIO = "user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer"
ADMIN = "public.is_admin_now()"

# Tablas con la política dueño-o-admin, idéntica salvo el nombre.
TABLAS_DUENO = ("user_techniques", "user_boss_challenges", "refresh_tokens")


def _is_postgres() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def _role_exists(nombre: str) -> bool:
    return bool(op.get_bind().execute(
        sa.text("SELECT 1 FROM pg_roles WHERE rolname = :r"), {"r": nombre}
    ).scalar())


def upgrade() -> None:
    if not _is_postgres():
        return

    op.execute("""
        CREATE OR REPLACE FUNCTION public.is_admin_now()
        RETURNS boolean
        LANGUAGE sql STABLE
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        AS $fn$
            SELECT COALESCE((
                SELECT u.is_admin FROM public.users u
                WHERE u.id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            ), false)
        $fn$;
    """)
    if _role_exists(DEFINER_ROLE):
        op.execute(f"ALTER FUNCTION public.is_admin_now() OWNER TO {DEFINER_ROLE}")
        # BYPASSRLS evita las políticas, pero el permiso de tabla sigue haciendo
        # falta: sin este GRANT la función falla con "permission denied".
        op.execute(f"GRANT SELECT ON public.users TO {DEFINER_ROLE}")
    op.execute("REVOKE ALL ON FUNCTION public.is_admin_now() FROM PUBLIC")
    op.execute("GRANT EXECUTE ON FUNCTION public.is_admin_now() TO PUBLIC")

    # Las funciones de autenticación de la 004 se apoyaban en el GUC para poder
    # leer `users` antes de saber quién eres. Ya no sirve: pasan al mismo rol
    # con BYPASSRLS, única vía legítima de saltarse las políticas.
    if _role_exists(DEFINER_ROLE):
        for firma in (
            "public.auth_user_for_login(text)",
            "public.auth_register_user(text, text, text, text, text)",
            "public.auth_rotate_refresh_token(text, text, timestamptz, text, text)",
            "public.audit_log_append(integer, text, text, text, text, text)",
        ):
            op.execute(
                "DO $do$ BEGIN "
                f"  IF to_regprocedure('{firma}') IS NOT NULL THEN "
                f"    EXECUTE 'ALTER FUNCTION {firma} OWNER TO {DEFINER_ROLE}'; "
                "  END IF; "
                "END $do$;"
            )
        op.execute(f"GRANT SELECT, INSERT, UPDATE ON public.users TO {DEFINER_ROLE}")
        op.execute(f"GRANT SELECT, INSERT, UPDATE ON public.refresh_tokens TO {DEFINER_ROLE}")
        op.execute(f"GRANT INSERT ON public.audit_log TO {DEFINER_ROLE}")
        op.execute(f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {DEFINER_ROLE}")

    # users: el admin ve todo, cada quien ve lo suyo (esa parte no cambia).
    op.execute("DROP POLICY IF EXISTS users_admin_all ON users")
    op.execute(f"""
        CREATE POLICY users_admin_all ON users
        FOR ALL USING ({ADMIN}) WITH CHECK ({ADMIN})
    """)

    for tabla in TABLAS_DUENO:
        op.execute(f"DROP POLICY IF EXISTS {tabla}_owner_all ON {tabla}")
        op.execute(f"""
            CREATE POLICY {tabla}_owner_all ON {tabla}
            FOR ALL USING ({MIO} OR {ADMIN}) WITH CHECK ({MIO} OR {ADMIN})
        """)

    op.execute("DROP POLICY IF EXISTS audit_log_self_select ON audit_log")
    op.execute(f"""
        CREATE POLICY audit_log_self_select ON audit_log
        FOR SELECT USING ({MIO} OR {ADMIN})
    """)
    op.execute("DROP POLICY IF EXISTS audit_log_admin_modify ON audit_log")
    op.execute(f"""
        CREATE POLICY audit_log_admin_modify ON audit_log
        FOR UPDATE USING ({ADMIN}) WITH CHECK ({ADMIN})
    """)
    op.execute("DROP POLICY IF EXISTS audit_log_admin_delete ON audit_log")
    op.execute(f"CREATE POLICY audit_log_admin_delete ON audit_log FOR DELETE USING ({ADMIN})")


def downgrade() -> None:
    if not _is_postgres():
        return

    viejo_admin = "current_setting('app.is_admin', true) = 'true'"

    op.execute("DROP POLICY IF EXISTS users_admin_all ON users")
    op.execute(f"CREATE POLICY users_admin_all ON users FOR ALL "
               f"USING ({viejo_admin}) WITH CHECK ({viejo_admin})")

    for tabla in TABLAS_DUENO:
        op.execute(f"DROP POLICY IF EXISTS {tabla}_owner_all ON {tabla}")
        op.execute(f"""
            CREATE POLICY {tabla}_owner_all ON {tabla}
            FOR ALL USING ({MIO} OR {viejo_admin}) WITH CHECK ({MIO} OR {viejo_admin})
        """)

    op.execute("DROP POLICY IF EXISTS audit_log_self_select ON audit_log")
    op.execute(f"CREATE POLICY audit_log_self_select ON audit_log "
               f"FOR SELECT USING ({MIO} OR {viejo_admin})")
    op.execute("DROP POLICY IF EXISTS audit_log_admin_modify ON audit_log")
    op.execute(f"CREATE POLICY audit_log_admin_modify ON audit_log FOR UPDATE "
               f"USING ({viejo_admin}) WITH CHECK ({viejo_admin})")
    op.execute("DROP POLICY IF EXISTS audit_log_admin_delete ON audit_log")
    op.execute(f"CREATE POLICY audit_log_admin_delete ON audit_log "
               f"FOR DELETE USING ({viejo_admin})")

    op.execute("DROP FUNCTION IF EXISTS public.is_admin_now()")

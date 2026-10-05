"""El id de usuario del contexto va firmado

Las políticas leían `app.current_user_id` y Postgres deja fijar los parámetros
con prefijo propio a cualquier rol. Quien ejecutara SQL arbitrario con las
credenciales de la API podía escribir ahí el id de otro y leer sus filas.

Ahora el contexto viaja firmado. La aplicación calcula HMAC-SHA256 del id con
un secreto compartido y lo pasa junto al id; `app_set_rls_context` lo verifica
contra el secreto guardado en `app_context_secret`, y las políticas ya no leen
el GUC directamente sino `rls_user_id()`, que devuelve el id solo si la firma
cuadra.

El secreto vive en una tabla que el rol de la API no puede leer, y en la
variable de entorno `RLS_CONTEXT_SECRET` del backend. Un atacante con SQL puede
seguir escribiendo en el GUC, pero sin el secreto no puede firmar, así que
`rls_user_id()` devuelve NULL y no ve ninguna fila.

Requisitos de operador, fuera de la migración: extensión `pgcrypto`, la tabla
`app_context_secret` con su fila, y `sous_owner` con BYPASSRLS para que las
migraciones y los scripts de administración sigan funcionando sin firma.

Revision ID: 007_signed_context
Revises: 006_admin_from_table
"""
import sqlalchemy as sa
from alembic import op

revision = "007_signed_context"
down_revision = "006_admin_from_table"
branch_labels = None
depends_on = None

DEFINER_ROLE = "sous_definer"

MIO = "user_id = public.rls_user_id()"
ADMIN = "public.is_admin_now()"
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

    # Id del contexto, válido solo si la firma cuadra con el secreto.
    op.execute("""
        CREATE OR REPLACE FUNCTION public.rls_user_id()
        RETURNS integer
        LANGUAGE sql STABLE
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        AS $fn$
            SELECT CASE
                WHEN NULLIF(current_setting('app.current_user_id', true), '') IS NULL
                    THEN NULL
                WHEN current_setting('app.ctx_sig', true) = encode(
                        public.hmac(current_setting('app.current_user_id', true),
                                    (SELECT s.secret FROM public.app_context_secret s WHERE s.id = 1),
                                    'sha256'),
                        'hex')
                    THEN NULLIF(current_setting('app.current_user_id', true), '')::integer
                ELSE NULL
            END
        $fn$;
    """)

    # El admin se sigue resolviendo contra la tabla, pero partiendo del id firmado.
    op.execute("""
        CREATE OR REPLACE FUNCTION public.is_admin_now()
        RETURNS boolean
        LANGUAGE sql STABLE
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        AS $fn$
            SELECT COALESCE((
                SELECT u.is_admin FROM public.users u WHERE u.id = public.rls_user_id()
            ), false)
        $fn$;
    """)

    # Fija el contexto solo si la firma es correcta; si no, lo deja vacío.
    op.execute("""
        CREATE OR REPLACE FUNCTION public.app_set_rls_context(p_user_id integer, p_sig text)
        RETURNS void
        LANGUAGE plpgsql VOLATILE
        SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        AS $fn$
        DECLARE
            v_secret text;
            v_esperada text;
        BEGIN
            IF p_user_id IS NULL THEN
                PERFORM set_config('app.current_user_id', '', true);
                PERFORM set_config('app.ctx_sig', '', true);
                RETURN;
            END IF;

            SELECT s.secret INTO v_secret FROM public.app_context_secret s WHERE s.id = 1;
            v_esperada := encode(public.hmac(p_user_id::text, v_secret, 'sha256'), 'hex');

            IF p_sig IS DISTINCT FROM v_esperada THEN
                RAISE EXCEPTION 'firma de contexto inválida';
            END IF;

            PERFORM set_config('app.current_user_id', p_user_id::text, true);
            PERFORM set_config('app.ctx_sig', p_sig, true);
        END;
        $fn$;
    """)

    if _role_exists(DEFINER_ROLE):
        for firma in ("public.rls_user_id()", "public.is_admin_now()",
                      "public.app_set_rls_context(integer, text)"):
            op.execute(f"ALTER FUNCTION {firma} OWNER TO {DEFINER_ROLE}")

    for firma in ("public.rls_user_id()", "public.is_admin_now()",
                  "public.app_set_rls_context(integer, text)"):
        op.execute(f"REVOKE ALL ON FUNCTION {firma} FROM PUBLIC")
        op.execute(f"GRANT EXECUTE ON FUNCTION {firma} TO PUBLIC")

    # La versión de un solo argumento ya no sirve: aceptaba el id sin firmar.
    op.execute("DROP FUNCTION IF EXISTS public.app_set_rls_context(integer)")

    # Las políticas pasan a leer el id firmado.
    op.execute("DROP POLICY IF EXISTS users_self_select ON users")
    op.execute("CREATE POLICY users_self_select ON users FOR SELECT "
               "USING (id = public.rls_user_id())")
    op.execute("DROP POLICY IF EXISTS users_self_update ON users")
    op.execute("CREATE POLICY users_self_update ON users FOR UPDATE "
               "USING (id = public.rls_user_id()) WITH CHECK (id = public.rls_user_id())")

    for tabla in TABLAS_DUENO:
        op.execute(f"DROP POLICY IF EXISTS {tabla}_owner_all ON {tabla}")
        op.execute(f"""
            CREATE POLICY {tabla}_owner_all ON {tabla}
            FOR ALL USING ({MIO} OR {ADMIN}) WITH CHECK ({MIO} OR {ADMIN})
        """)

    op.execute("DROP POLICY IF EXISTS audit_log_self_select ON audit_log")
    op.execute(f"CREATE POLICY audit_log_self_select ON audit_log "
               f"FOR SELECT USING ({MIO} OR {ADMIN})")


def downgrade() -> None:
    if not _is_postgres():
        return

    sin_firma = "NULLIF(current_setting('app.current_user_id', true), '')::integer"

    op.execute("DROP POLICY IF EXISTS users_self_select ON users")
    op.execute(f"CREATE POLICY users_self_select ON users FOR SELECT USING (id = {sin_firma})")
    op.execute("DROP POLICY IF EXISTS users_self_update ON users")
    op.execute(f"CREATE POLICY users_self_update ON users FOR UPDATE "
               f"USING (id = {sin_firma}) WITH CHECK (id = {sin_firma})")

    for tabla in TABLAS_DUENO:
        op.execute(f"DROP POLICY IF EXISTS {tabla}_owner_all ON {tabla}")
        op.execute(f"""
            CREATE POLICY {tabla}_owner_all ON {tabla}
            FOR ALL USING (user_id = {sin_firma} OR {ADMIN})
            WITH CHECK (user_id = {sin_firma} OR {ADMIN})
        """)

    op.execute("DROP POLICY IF EXISTS audit_log_self_select ON audit_log")
    op.execute(f"CREATE POLICY audit_log_self_select ON audit_log "
               f"FOR SELECT USING (user_id = {sin_firma} OR {ADMIN})")

    op.execute("DROP FUNCTION IF EXISTS public.app_set_rls_context(integer, text)")
    op.execute("DROP FUNCTION IF EXISTS public.rls_user_id()")
    op.execute("""
        CREATE OR REPLACE FUNCTION public.is_admin_now()
        RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = pg_catalog, public, pg_temp
        AS $fn$
            SELECT COALESCE((SELECT u.is_admin FROM public.users u
                WHERE u.id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            ), false)
        $fn$;
    """)

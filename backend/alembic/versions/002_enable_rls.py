"""enable Row Level Security (Postgres only)

Revision ID: 002_enable_rls
Revises: 001_initial_schema
Create Date: 2026-05-04

Activa Row-Level Security en las tablas que contienen datos por-usuario.
La aplicación setea dos GUCs por transacción (ver `app/core/security.py`):

    SELECT set_config('app.current_user_id', '<id>', true);
    SELECT set_config('app.is_admin',        'true|false', true);

Las políticas leen estos GUCs vía `current_setting('app.current_user_id', true)`
(el segundo argumento `true` evita que falle si el GUC no está seteado;
en ese caso devuelve NULL y la política falla cerrada: ningún acceso).

Tablas con RLS:
- users                  → solo veo/modifico mi propia fila (admin ve todas).
- user_techniques        → solo veo/modifico filas con user_id = yo.
- user_boss_challenges   → idem.

Tablas sin RLS (catálogo público):
- techniques, recipes, technique_prerequisites, recipe_techniques, pages
  → autorización a nivel de aplicación (admin para escribir).

Rol de la app: RLS no se aplica a roles `BYPASSRLS` ni a superusuarios. La
conexión que usa la aplicación debe ser un rol normal (p.ej. `app_user`). Configura tu
DATABASE_URL con un rol no-superusuario en producción.

En SQLite esta migración es un no-op.
"""
from alembic import op


revision = "002_enable_rls"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


# Tablas a las que aplica RLS y su columna de propiedad.
USER_OWNED = {
    "users":                "id",          # la fila es el usuario
    "user_techniques":      "user_id",
    "user_boss_challenges": "user_id",
}


def _is_postgres() -> bool:
    bind = op.get_bind()
    return bind.dialect.name == "postgresql"


def upgrade() -> None:
    if not _is_postgres():
        # SQLite y otros motores no tienen RLS.
        return

    # FORCE evita que el owner salte RLS por accidente; superusuarios y
    # BYPASSRLS sí pueden saltarlo.
    for table in USER_OWNED:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")

    # users: admin con acceso total, usuario normal solo a su fila.
    op.execute("""
        CREATE POLICY users_admin_all ON users
            AS PERMISSIVE
            FOR ALL
            USING (current_setting('app.is_admin', true) = 'true')
            WITH CHECK (current_setting('app.is_admin', true) = 'true');
    """)
    op.execute("""
        CREATE POLICY users_self_select ON users
            FOR SELECT
            USING (id = NULLIF(current_setting('app.current_user_id', true), '')::int);
    """)
    op.execute("""
        CREATE POLICY users_self_update ON users
            FOR UPDATE
            USING (id = NULLIF(current_setting('app.current_user_id', true), '')::int)
            WITH CHECK (id = NULLIF(current_setting('app.current_user_id', true), '')::int);
    """)
    # Registro: cualquiera puede insertar (las claves UNIQUE de username/email
    # imponen el resto). El endpoint /auth/register usa una sesión sin RLS,
    # pero esta política existe por defensa en profundidad.
    op.execute("""
        CREATE POLICY users_register_insert ON users
            FOR INSERT
            WITH CHECK (true);
    """)

    # Políticas genéricas para tablas con `user_id`.
    for table, col in USER_OWNED.items():
        if table == "users":
            continue  # ya tratada arriba

        op.execute(f"""
            CREATE POLICY {table}_owner_all ON {table}
                FOR ALL
                USING (
                    {col} = NULLIF(current_setting('app.current_user_id', true), '')::int
                    OR current_setting('app.is_admin', true) = 'true'
                )
                WITH CHECK (
                    {col} = NULLIF(current_setting('app.current_user_id', true), '')::int
                    OR current_setting('app.is_admin', true) = 'true'
                );
        """)


def downgrade() -> None:
    if not _is_postgres():
        return

    op.execute("DROP POLICY IF EXISTS users_admin_all ON users")
    op.execute("DROP POLICY IF EXISTS users_self_select ON users")
    op.execute("DROP POLICY IF EXISTS users_self_update ON users")
    op.execute("DROP POLICY IF EXISTS users_register_insert ON users")
    for table in USER_OWNED:
        if table == "users":
            continue
        op.execute(f"DROP POLICY IF EXISTS {table}_owner_all ON {table}")

    for table in USER_OWNED:
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

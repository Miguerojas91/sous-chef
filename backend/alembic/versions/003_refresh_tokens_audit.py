"""refresh tokens + audit log

Revision ID: 003_refresh_tokens_audit
Revises: 002_enable_rls
Create Date: 2026-05-04

Crea dos tablas nuevas:

- `refresh_tokens`: hash + metadata de refresh tokens (nunca almacenamos el
  token en claro; se compara con hash al rotar).
- `audit_log`: registro append-only de acciones sensibles
  (login, logout, register, premium_grant, etc.).

Ambas tienen RLS si la DB es Postgres.
"""
from alembic import op
import sqlalchemy as sa


revision = "003_refresh_tokens_audit"
down_revision = "002_enable_rls"
branch_labels = None
depends_on = None


def _is_postgres() -> bool:
    return op.get_bind().dialect.name == "postgresql"


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  index=True, nullable=False),
        # SHA-256 del token en hex (64 chars). No guardamos el token plano.
        sa.Column("token_hash", sa.String(length=128), unique=True, index=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.current_timestamp()),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_id", sa.Integer(),
                  sa.ForeignKey("refresh_tokens.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("ip", sa.String(length=64), nullable=True),
    )

    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(),
                  sa.ForeignKey("users.id", ondelete="SET NULL"),
                  index=True, nullable=True),  # null = acción pre-auth (intento de login fallido)
        sa.Column("action", sa.String(length=64), nullable=False, index=True),
        sa.Column("target", sa.String(length=255), nullable=True),
        sa.Column("ip", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("metadata", sa.Text(), nullable=True),  # JSON serializado opcional
        sa.Column("ok", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.current_timestamp()),
    )

    if not _is_postgres():
        return

    # refresh_tokens: el dueño (o admin) gestiona los suyos.
    op.execute("ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE refresh_tokens FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY refresh_tokens_owner_all ON refresh_tokens
            FOR ALL
            USING (
                user_id = NULLIF(current_setting('app.current_user_id', true), '')::int
                OR current_setting('app.is_admin', true) = 'true'
            )
            WITH CHECK (
                user_id = NULLIF(current_setting('app.current_user_id', true), '')::int
                OR current_setting('app.is_admin', true) = 'true'
            );
    """)

    # audit_log: el usuario puede leer sus propias entradas. Solo admin puede
    # actualizar/borrar (idealmente nadie: append-only). INSERT abierto porque
    # los hooks de auth corren con sesión sin user_id seteado.
    op.execute("ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE audit_log FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY audit_log_self_select ON audit_log
            FOR SELECT
            USING (
                user_id = NULLIF(current_setting('app.current_user_id', true), '')::int
                OR current_setting('app.is_admin', true) = 'true'
            );
    """)
    op.execute("""
        CREATE POLICY audit_log_insert ON audit_log
            FOR INSERT
            WITH CHECK (true);
    """)
    op.execute("""
        CREATE POLICY audit_log_admin_modify ON audit_log
            FOR UPDATE
            USING (current_setting('app.is_admin', true) = 'true')
            WITH CHECK (current_setting('app.is_admin', true) = 'true');
    """)
    op.execute("""
        CREATE POLICY audit_log_admin_delete ON audit_log
            FOR DELETE
            USING (current_setting('app.is_admin', true) = 'true');
    """)


def downgrade() -> None:
    if _is_postgres():
        op.execute("DROP POLICY IF EXISTS audit_log_admin_delete ON audit_log")
        op.execute("DROP POLICY IF EXISTS audit_log_admin_modify ON audit_log")
        op.execute("DROP POLICY IF EXISTS audit_log_insert ON audit_log")
        op.execute("DROP POLICY IF EXISTS audit_log_self_select ON audit_log")
        op.execute("DROP POLICY IF EXISTS refresh_tokens_owner_all ON refresh_tokens")
    op.drop_table("audit_log")
    op.drop_table("refresh_tokens")

"""initial schema

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-05-04

Crea el schema completo de Sous Chef. Compatible con SQLite y Postgres.

NOTA: Si ya tienes datos creados con `Base.metadata.create_all` (modo dev),
borra `sous.db` antes de aplicar esta migración (o stampea con
`alembic stamp 001_initial_schema` para marcarla como aplicada sin recrear).
"""
from alembic import op
import sqlalchemy as sa


revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("username", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("email", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("xp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("allergies", sa.String(), nullable=False, server_default="[]"),
        sa.Column("dislikes", sa.String(), nullable=False, server_default="[]"),
    )

    # ── techniques ─────────────────────────────────────────────────────────────
    op.create_table(
        "techniques",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), unique=True),
        sa.Column("description", sa.String()),
        sa.Column("difficulty", sa.String()),
        sa.Column("level", sa.Integer(), server_default="1"),
        sa.Column("xp_reward", sa.Integer(), server_default="100"),
        sa.Column("theory_url", sa.String(), nullable=True),
        sa.Column("theory_content", sa.String(), nullable=True),
        sa.Column("masterclass_video_url", sa.String(), nullable=True),
    )

    # ── recipes ────────────────────────────────────────────────────────────────
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("title", sa.String(), index=True),
        sa.Column("description", sa.String()),
        sa.Column("video_url", sa.String(), nullable=True),
        sa.Column("main_protein", sa.String(), index=True, nullable=True),
        sa.Column("mood", sa.String(), index=True, nullable=True),
        sa.Column("region", sa.String(), index=True, nullable=True),
        sa.Column("difficulty", sa.String()),
        sa.Column("is_boss_challenge", sa.Boolean(), server_default=sa.false()),
        sa.Column("boss_level", sa.Integer(), nullable=True),
        sa.Column("xp_reward", sa.Integer(), server_default="50"),
        sa.Column("ingredients", sa.String()),
        sa.Column("instructions", sa.String()),
    )

    # ── technique_prerequisites (M2M) ──────────────────────────────────────────
    op.create_table(
        "technique_prerequisites",
        sa.Column("technique_id", sa.Integer(), sa.ForeignKey("techniques.id"), primary_key=True),
        sa.Column("prerequisite_id", sa.Integer(), sa.ForeignKey("techniques.id"), primary_key=True),
    )

    # ── recipe_techniques (M2M) ────────────────────────────────────────────────
    op.create_table(
        "recipe_techniques",
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id"), primary_key=True),
        sa.Column("technique_id", sa.Integer(), sa.ForeignKey("techniques.id"), primary_key=True),
    )

    # ── user_techniques ────────────────────────────────────────────────────────
    op.create_table(
        "user_techniques",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("technique_id", sa.Integer(), sa.ForeignKey("techniques.id"), index=True, nullable=False),
        sa.Column("is_validated", sa.Boolean(), server_default=sa.false()),
    )

    # ── user_boss_challenges ───────────────────────────────────────────────────
    op.create_table(
        "user_boss_challenges",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), index=True, nullable=False),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id"), index=True, nullable=False),
        sa.Column("is_validated", sa.Boolean(), server_default=sa.false()),
        sa.Column("validation_photo_url", sa.String(), nullable=True),
        sa.Column("ai_feedback", sa.String(), nullable=True),
    )

    # ── pages (CMS) ────────────────────────────────────────────────────────────
    op.create_table(
        "pages",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("slug", sa.String(), unique=True, index=True),
        sa.Column("title", sa.String()),
        sa.Column("content_json", sa.String(), server_default="[]"),
    )


def downgrade() -> None:
    op.drop_table("pages")
    op.drop_table("user_boss_challenges")
    op.drop_table("user_techniques")
    op.drop_table("recipe_techniques")
    op.drop_table("technique_prerequisites")
    op.drop_table("recipes")
    op.drop_table("techniques")
    op.drop_table("users")

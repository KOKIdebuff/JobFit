"""add JobFit LLM invocation audit table

Revision ID: 20260907_0006
Revises: 20260905_0005
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260907_0006"
down_revision: str | None = "20260905_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ID = sa.CHAR(length=36)
NOW = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "llm_invocations",
        sa.Column("id", ID, nullable=False),
        sa.Column("public_id", sa.String(120), nullable=False),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("turn_index", sa.Integer(), nullable=False),
        sa.Column("purpose", sa.String(50), nullable=False),
        sa.Column("provider", sa.String(40), nullable=False),
        sa.Column("model", sa.String(120), nullable=False),
        sa.Column("prompt_version", sa.String(80), nullable=False),
        sa.Column("knowledge_version", sa.String(40), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("error_code", sa.String(80), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index("ix_llm_invocations_public_id", "llm_invocations", ["public_id"])
    op.create_index("ix_llm_invocations_session_id", "llm_invocations", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_llm_invocations_session_id", table_name="llm_invocations")
    op.drop_index("ix_llm_invocations_public_id", table_name="llm_invocations")
    op.drop_table("llm_invocations")

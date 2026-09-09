"""add JobFit semantic judgments

Revision ID: 20260909_0007
Revises: 20260907_0006
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260909_0007"
down_revision: str | None = "20260907_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ID = sa.CHAR(length=36)
NOW = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "semantic_judgments",
        sa.Column("id", ID, nullable=False),
        sa.Column("public_id", sa.String(120), nullable=False),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("question_id", sa.String(120), nullable=False),
        sa.Column("answer_id", sa.String(120), nullable=False),
        sa.Column("competency_id", sa.String(80), nullable=False),
        sa.Column("llm_invocation_id", ID, nullable=False),
        sa.Column("schema_version", sa.String(80), nullable=False),
        sa.Column("prompt_version", sa.String(80), nullable=False),
        sa.Column("provider", sa.String(40), nullable=False),
        sa.Column("model", sa.String(120), nullable=False),
        sa.Column("judgment_json", sa.Text(), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["llm_invocation_id"], ["llm_invocations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("answer_id"),
        sa.UniqueConstraint("llm_invocation_id"),
    )
    op.create_index("ix_semantic_judgments_public_id", "semantic_judgments", ["public_id"])
    op.create_index("ix_semantic_judgments_session_id", "semantic_judgments", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_semantic_judgments_session_id", table_name="semantic_judgments")
    op.drop_index("ix_semantic_judgments_public_id", table_name="semantic_judgments")
    op.drop_table("semantic_judgments")

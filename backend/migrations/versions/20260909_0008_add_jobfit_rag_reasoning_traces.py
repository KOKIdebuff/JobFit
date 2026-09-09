"""add JobFit RAG reasoning traces

Revision ID: 20260909_0008
Revises: 20260909_0007
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260909_0008"
down_revision: str | None = "20260909_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ID = sa.CHAR(length=36)
NOW = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "rag_reasoning_traces",
        sa.Column("id", ID, nullable=False),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("answer_id", sa.String(120), nullable=False),
        sa.Column("semantic_judgment_id", ID, nullable=False),
        sa.Column("competency_id", sa.String(80), nullable=False),
        sa.Column("focus", sa.String(50), nullable=False),
        sa.Column("requirement", sa.String(300), nullable=False),
        sa.Column("source_ids_json", sa.Text(), nullable=False),
        sa.Column("scores_json", sa.Text(), nullable=False),
        sa.Column("knowledge_version", sa.String(40), nullable=False),
        sa.Column("reasoning_version", sa.String(80), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["semantic_judgment_id"], ["semantic_judgments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("answer_id"),
        sa.UniqueConstraint("semantic_judgment_id"),
    )
    op.create_index("ix_rag_reasoning_traces_session_id", "rag_reasoning_traces", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_rag_reasoning_traces_session_id", table_name="rag_reasoning_traces")
    op.drop_table("rag_reasoning_traces")

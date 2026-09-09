"""add JobFit evidence boundary judgments

Revision ID: 20260909_0009
Revises: 20260909_0008
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260909_0009"
down_revision: str | None = "20260909_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ID = sa.CHAR(length=36)
NOW = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "evidence_boundary_judgments",
        sa.Column("id", ID, nullable=False),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("question_id", sa.String(120), nullable=False),
        sa.Column("answer_id", sa.String(120), nullable=False),
        sa.Column("competency_id", sa.String(80), nullable=False),
        sa.Column("competency_evidence_id", ID, nullable=False),
        sa.Column("semantic_judgment_id", ID, nullable=False),
        sa.Column("schema_version", sa.String(80), nullable=False),
        sa.Column("policy_version", sa.String(80), nullable=False),
        sa.Column("base_focus", sa.String(50), nullable=True),
        sa.Column("effective_focus", sa.String(50), nullable=True),
        sa.Column("applied", sa.Boolean(), nullable=False),
        sa.Column("judgment_json", sa.Text(), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["competency_evidence_id"], ["competency_evidence.id"]),
        sa.ForeignKeyConstraint(
            ["semantic_judgment_id"], ["semantic_judgments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("answer_id"),
        sa.UniqueConstraint("competency_evidence_id"),
        sa.UniqueConstraint("semantic_judgment_id"),
    )
    op.create_index(
        "ix_evidence_boundary_judgments_session_id",
        "evidence_boundary_judgments",
        ["session_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_evidence_boundary_judgments_session_id",
        table_name="evidence_boundary_judgments",
    )
    op.drop_table("evidence_boundary_judgments")

"""add pending confirmation and notification reminder fields

Revision ID: 20260621_0004
Revises: 20260620_0003
Create Date: 2026-06-21 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260621_0004"
down_revision: str | None = "20260620_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("human_interview_bookings") as batch_op:
        batch_op.add_column(
            sa.Column("pending_confirmation_expires_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(sa.Column("pending_confirmation_reason", sa.Text(), nullable=True))
        batch_op.create_index(
            op.f("ix_human_interview_bookings_pending_confirmation_expires_at"),
            ["pending_confirmation_expires_at"],
        )

    with op.batch_alter_table("notifications") as batch_op:
        batch_op.add_column(sa.Column("entity_type", sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column("entity_public_id", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("dedupe_key", sa.String(length=240), nullable=True))
        batch_op.add_column(sa.Column("remind_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index(op.f("ix_notifications_entity_type"), ["entity_type"])
        batch_op.create_index(op.f("ix_notifications_entity_public_id"), ["entity_public_id"])
        batch_op.create_index(op.f("ix_notifications_dedupe_key"), ["dedupe_key"])
        batch_op.create_index(op.f("ix_notifications_remind_at"), ["remind_at"])
        batch_op.create_unique_constraint("uq_notifications_dedupe_key", ["dedupe_key"])


def downgrade() -> None:
    with op.batch_alter_table("notifications") as batch_op:
        batch_op.drop_constraint("uq_notifications_dedupe_key", type_="unique")
        batch_op.drop_index(op.f("ix_notifications_remind_at"))
        batch_op.drop_index(op.f("ix_notifications_dedupe_key"))
        batch_op.drop_index(op.f("ix_notifications_entity_public_id"))
        batch_op.drop_index(op.f("ix_notifications_entity_type"))
        batch_op.drop_column("remind_at")
        batch_op.drop_column("dedupe_key")
        batch_op.drop_column("entity_public_id")
        batch_op.drop_column("entity_type")

    with op.batch_alter_table("human_interview_bookings") as batch_op:
        batch_op.drop_index(op.f("ix_human_interview_bookings_pending_confirmation_expires_at"))
        batch_op.drop_column("pending_confirmation_reason")
        batch_op.drop_column("pending_confirmation_expires_at")

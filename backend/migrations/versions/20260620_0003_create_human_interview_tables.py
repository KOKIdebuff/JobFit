"""create human interview booking tables

Revision ID: 20260620_0003
Revises: 20260620_0002
Create Date: 2026-06-20 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260620_0003"
down_revision: str | None = "20260620_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("recipient_id", sa.CHAR(length=36), nullable=False),
        sa.Column("notification_type", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["recipient_id"],
            ["users.id"],
            name=op.f("fk_notifications_recipient_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
        sa.UniqueConstraint("public_id", name=op.f("uq_notifications_public_id")),
    )
    op.create_index(
        op.f("ix_notifications_notification_type"), "notifications", ["notification_type"]
    )
    op.create_index(op.f("ix_notifications_public_id"), "notifications", ["public_id"])
    op.create_index(op.f("ix_notifications_recipient_id"), "notifications", ["recipient_id"])
    op.create_index(op.f("ix_notifications_status"), "notifications", ["status"])

    op.create_table(
        "human_interviewers",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("user_id", sa.CHAR(length=36), nullable=False),
        sa.Column("organization_id", sa.CHAR(length=36), nullable=True),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("contact_email", sa.String(length=255), nullable=False),
        sa.Column("timezone", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_human_interviewers_organization_id_organizations"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_human_interviewers_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interviewers")),
        sa.UniqueConstraint("public_id", name=op.f("uq_human_interviewers_public_id")),
        sa.UniqueConstraint("user_id", name="uq_human_interviewers_user_id"),
    )
    op.create_index(
        op.f("ix_human_interviewers_organization_id"), "human_interviewers", ["organization_id"]
    )
    op.create_index(op.f("ix_human_interviewers_public_id"), "human_interviewers", ["public_id"])
    op.create_index(op.f("ix_human_interviewers_status"), "human_interviewers", ["status"])
    op.create_index(op.f("ix_human_interviewers_user_id"), "human_interviewers", ["user_id"])

    op.create_table(
        "human_interview_location_templates",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("organization_id", sa.CHAR(length=36), nullable=True),
        sa.Column("created_by", sa.CHAR(length=36), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("arrival_instructions", sa.Text(), nullable=False),
        sa.Column("contact_name", sa.String(length=120), nullable=False),
        sa.Column("contact_phone", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name=op.f("fk_human_interview_location_templates_created_by_users"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_human_interview_location_templates_organization_id_organizations"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_location_templates")),
        sa.UniqueConstraint(
            "public_id", name=op.f("uq_human_interview_location_templates_public_id")
        ),
    )
    op.create_index(
        op.f("ix_human_interview_location_templates_created_by"),
        "human_interview_location_templates",
        ["created_by"],
    )
    op.create_index(
        op.f("ix_human_interview_location_templates_organization_id"),
        "human_interview_location_templates",
        ["organization_id"],
    )
    op.create_index(
        op.f("ix_human_interview_location_templates_public_id"),
        "human_interview_location_templates",
        ["public_id"],
    )
    op.create_index(
        op.f("ix_human_interview_location_templates_status"),
        "human_interview_location_templates",
        ["status"],
    )

    op.create_table(
        "human_interview_meeting_information",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("organization_id", sa.CHAR(length=36), nullable=True),
        sa.Column("created_by", sa.CHAR(length=36), nullable=False),
        sa.Column("interview_type", sa.String(length=24), nullable=False),
        sa.Column("meeting_url", sa.String(length=600), nullable=False),
        sa.Column("location_template_id", sa.CHAR(length=36), nullable=True),
        sa.Column("details_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name=op.f("fk_human_interview_meeting_information_created_by_users"),
        ),
        sa.ForeignKeyConstraint(
            ["location_template_id"],
            ["human_interview_location_templates.id"],
            name=op.f(
                "fk_human_interview_meeting_information_location_template_id_human_interview_location_templates"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_human_interview_meeting_information_organization_id_organizations"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_meeting_information")),
        sa.UniqueConstraint(
            "public_id", name=op.f("uq_human_interview_meeting_information_public_id")
        ),
    )
    op.create_index(
        op.f("ix_human_interview_meeting_information_created_by"),
        "human_interview_meeting_information",
        ["created_by"],
    )
    op.create_index(
        op.f("ix_human_interview_meeting_information_interview_type"),
        "human_interview_meeting_information",
        ["interview_type"],
    )
    op.create_index(
        op.f("ix_human_interview_meeting_information_location_template_id"),
        "human_interview_meeting_information",
        ["location_template_id"],
    )
    op.create_index(
        op.f("ix_human_interview_meeting_information_organization_id"),
        "human_interview_meeting_information",
        ["organization_id"],
    )
    op.create_index(
        op.f("ix_human_interview_meeting_information_public_id"),
        "human_interview_meeting_information",
        ["public_id"],
    )
    op.create_index(
        op.f("ix_human_interview_meeting_information_status"),
        "human_interview_meeting_information",
        ["status"],
    )

    op.create_table(
        "human_interview_invitations",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("token", sa.String(length=160), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=False),
        sa.Column("job_id", sa.CHAR(length=36), nullable=False),
        sa.Column("candidate_id", sa.CHAR(length=36), nullable=False),
        sa.Column("created_by", sa.CHAR(length=36), nullable=False),
        sa.Column("primary_interviewer_id", sa.CHAR(length=36), nullable=False),
        sa.Column("interview_type", sa.String(length=24), nullable=False),
        sa.Column("meeting_information_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_human_interview_invitations_application_id_applications"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["candidate_id"],
            ["users.id"],
            name=op.f("fk_human_interview_invitations_candidate_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name=op.f("fk_human_interview_invitations_created_by_users"),
        ),
        sa.ForeignKeyConstraint(
            ["job_id"], ["jobs.id"], name=op.f("fk_human_interview_invitations_job_id_jobs")
        ),
        sa.ForeignKeyConstraint(
            ["meeting_information_id"],
            ["human_interview_meeting_information.id"],
            name=op.f(
                "fk_human_interview_invitations_meeting_information_id_human_interview_meeting_information"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["primary_interviewer_id"],
            ["human_interviewers.id"],
            name=op.f("fk_human_interview_invitations_primary_interviewer_id_human_interviewers"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_invitations")),
        sa.UniqueConstraint("public_id", name=op.f("uq_human_interview_invitations_public_id")),
        sa.UniqueConstraint("token", name="uq_human_interview_invitations_token"),
    )
    for column in (
        "application_id",
        "candidate_id",
        "created_by",
        "interview_type",
        "job_id",
        "meeting_information_id",
        "primary_interviewer_id",
        "public_id",
        "status",
        "token",
    ):
        op.create_index(
            op.f(f"ix_human_interview_invitations_{column}"),
            "human_interview_invitations",
            [column],
        )

    op.create_table(
        "human_interview_availability_slots",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("interviewer_id", sa.CHAR(length=36), nullable=False),
        sa.Column("created_by", sa.CHAR(length=36), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name=op.f("fk_human_interview_availability_slots_created_by_users"),
        ),
        sa.ForeignKeyConstraint(
            ["interviewer_id"],
            ["human_interviewers.id"],
            name=op.f("fk_human_interview_availability_slots_interviewer_id_human_interviewers"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_availability_slots")),
        sa.UniqueConstraint(
            "public_id", name=op.f("uq_human_interview_availability_slots_public_id")
        ),
    )
    for column in ("created_by", "end_at", "interviewer_id", "public_id", "start_at", "status"):
        op.create_index(
            op.f(f"ix_human_interview_availability_slots_{column}"),
            "human_interview_availability_slots",
            [column],
        )

    op.create_table(
        "human_interview_sessions",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_sessions")),
        sa.UniqueConstraint("public_id", name=op.f("uq_human_interview_sessions_public_id")),
    )
    op.create_index(
        op.f("ix_human_interview_sessions_public_id"), "human_interview_sessions", ["public_id"]
    )
    op.create_index(
        op.f("ix_human_interview_sessions_status"), "human_interview_sessions", ["status"]
    )

    op.create_table(
        "human_interview_bookings",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("invitation_id", sa.CHAR(length=36), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=False),
        sa.Column("job_id", sa.CHAR(length=36), nullable=False),
        sa.Column("candidate_id", sa.CHAR(length=36), nullable=False),
        sa.Column("primary_interviewer_id", sa.CHAR(length=36), nullable=False),
        sa.Column("slot_id", sa.CHAR(length=36), nullable=False),
        sa.Column("session_id", sa.CHAR(length=36), nullable=False),
        sa.Column("meeting_information_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("interview_type", sa.String(length=24), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("buffer_end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("candidate_contact_json", sa.Text(), nullable=False),
        sa.Column("candidate_reschedule_count", sa.Integer(), nullable=False),
        sa.Column("company_reschedule_count", sa.Integer(), nullable=False),
        sa.Column("rescheduled_from_id", sa.CHAR(length=36), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("cancelled_by", sa.CHAR(length=36), nullable=True),
        sa.Column("company_late_cancel", sa.Boolean(), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_human_interview_bookings_application_id_applications"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["cancelled_by"],
            ["users.id"],
            name=op.f("fk_human_interview_bookings_cancelled_by_users"),
        ),
        sa.ForeignKeyConstraint(
            ["candidate_id"],
            ["users.id"],
            name=op.f("fk_human_interview_bookings_candidate_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["invitation_id"],
            ["human_interview_invitations.id"],
            name=op.f("fk_human_interview_bookings_invitation_id_human_interview_invitations"),
        ),
        sa.ForeignKeyConstraint(
            ["job_id"], ["jobs.id"], name=op.f("fk_human_interview_bookings_job_id_jobs")
        ),
        sa.ForeignKeyConstraint(
            ["meeting_information_id"],
            ["human_interview_meeting_information.id"],
            name=op.f(
                "fk_human_interview_bookings_meeting_information_id_human_interview_meeting_information"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["primary_interviewer_id"],
            ["human_interviewers.id"],
            name=op.f("fk_human_interview_bookings_primary_interviewer_id_human_interviewers"),
        ),
        sa.ForeignKeyConstraint(
            ["rescheduled_from_id"],
            ["human_interview_bookings.id"],
            name=op.f("fk_human_interview_bookings_rescheduled_from_id_human_interview_bookings"),
        ),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["human_interview_sessions.id"],
            name=op.f("fk_human_interview_bookings_session_id_human_interview_sessions"),
        ),
        sa.ForeignKeyConstraint(
            ["slot_id"],
            ["human_interview_availability_slots.id"],
            name=op.f("fk_human_interview_bookings_slot_id_human_interview_availability_slots"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_bookings")),
        sa.UniqueConstraint("public_id", name=op.f("uq_human_interview_bookings_public_id")),
    )
    for column in (
        "application_id",
        "buffer_end_at",
        "candidate_id",
        "end_at",
        "interview_type",
        "invitation_id",
        "job_id",
        "meeting_information_id",
        "primary_interviewer_id",
        "public_id",
        "rescheduled_from_id",
        "session_id",
        "slot_id",
        "start_at",
        "status",
    ):
        op.create_index(
            op.f(f"ix_human_interview_bookings_{column}"), "human_interview_bookings", [column]
        )

    op.create_table(
        "human_interview_booking_participants",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("booking_id", sa.CHAR(length=36), nullable=False),
        sa.Column("user_id", sa.CHAR(length=36), nullable=False),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["booking_id"],
            ["human_interview_bookings.id"],
            name=op.f(
                "fk_human_interview_booking_participants_booking_id_human_interview_bookings"
            ),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_human_interview_booking_participants_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_booking_participants")),
    )
    for column in ("booking_id", "role", "user_id"):
        op.create_index(
            op.f(f"ix_human_interview_booking_participants_{column}"),
            "human_interview_booking_participants",
            [column],
        )

    op.create_table(
        "human_interview_booking_status_history",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("booking_id", sa.CHAR(length=36), nullable=False),
        sa.Column("previous_status", sa.String(length=40), nullable=True),
        sa.Column("next_status", sa.String(length=40), nullable=False),
        sa.Column("actor_id", sa.CHAR(length=36), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["actor_id"],
            ["users.id"],
            name=op.f("fk_human_interview_booking_status_history_actor_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["booking_id"],
            ["human_interview_bookings.id"],
            name=op.f(
                "fk_human_interview_booking_status_history_booking_id_human_interview_bookings"
            ),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_booking_status_history")),
    )
    for column in ("actor_id", "booking_id", "next_status"):
        op.create_index(
            op.f(f"ix_human_interview_booking_status_history_{column}"),
            "human_interview_booking_status_history",
            [column],
        )

    op.create_table(
        "human_interview_reports",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("booking_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("conclusion", sa.Text(), nullable=False),
        sa.Column("competency_json", sa.Text(), nullable=False),
        sa.Column("key_observations", sa.Text(), nullable=False),
        sa.Column("risks", sa.Text(), nullable=False),
        sa.Column("candidate_summary", sa.Text(), nullable=False),
        sa.Column("internal_notes", sa.Text(), nullable=False),
        sa.Column("created_by", sa.CHAR(length=36), nullable=False),
        sa.Column("submitted_by", sa.CHAR(length=36), nullable=True),
        sa.Column("published_by", sa.CHAR(length=36), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["booking_id"],
            ["human_interview_bookings.id"],
            name=op.f("fk_human_interview_reports_booking_id_human_interview_bookings"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.id"], name=op.f("fk_human_interview_reports_created_by_users")
        ),
        sa.ForeignKeyConstraint(
            ["published_by"],
            ["users.id"],
            name=op.f("fk_human_interview_reports_published_by_users"),
        ),
        sa.ForeignKeyConstraint(
            ["submitted_by"],
            ["users.id"],
            name=op.f("fk_human_interview_reports_submitted_by_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_reports")),
        sa.UniqueConstraint("booking_id", name=op.f("uq_human_interview_reports_booking_id")),
        sa.UniqueConstraint("public_id", name=op.f("uq_human_interview_reports_public_id")),
    )
    for column in ("created_by", "public_id", "status"):
        op.create_index(
            op.f(f"ix_human_interview_reports_{column}"), "human_interview_reports", [column]
        )

    op.create_table(
        "human_interview_audit_records",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("actor_id", sa.CHAR(length=36), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.CHAR(length=36), nullable=True),
        sa.Column("sensitive", sa.Boolean(), nullable=False),
        sa.Column("details_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["actor_id"], ["users.id"], name=op.f("fk_human_interview_audit_records_actor_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_human_interview_audit_records")),
        sa.UniqueConstraint("public_id", name=op.f("uq_human_interview_audit_records_public_id")),
    )
    for column in ("action", "actor_id", "entity_id", "entity_type", "public_id"):
        op.create_index(
            op.f(f"ix_human_interview_audit_records_{column}"),
            "human_interview_audit_records",
            [column],
        )


def downgrade() -> None:
    for column in ("action", "actor_id", "entity_id", "entity_type", "public_id"):
        op.drop_index(
            op.f(f"ix_human_interview_audit_records_{column}"),
            table_name="human_interview_audit_records",
        )
    op.drop_table("human_interview_audit_records")
    for column in ("created_by", "public_id", "status"):
        op.drop_index(
            op.f(f"ix_human_interview_reports_{column}"), table_name="human_interview_reports"
        )
    op.drop_table("human_interview_reports")
    for column in ("actor_id", "booking_id", "next_status"):
        op.drop_index(
            op.f(f"ix_human_interview_booking_status_history_{column}"),
            table_name="human_interview_booking_status_history",
        )
    op.drop_table("human_interview_booking_status_history")
    for column in ("booking_id", "role", "user_id"):
        op.drop_index(
            op.f(f"ix_human_interview_booking_participants_{column}"),
            table_name="human_interview_booking_participants",
        )
    op.drop_table("human_interview_booking_participants")
    for column in (
        "application_id",
        "buffer_end_at",
        "candidate_id",
        "end_at",
        "interview_type",
        "invitation_id",
        "job_id",
        "meeting_information_id",
        "primary_interviewer_id",
        "public_id",
        "rescheduled_from_id",
        "session_id",
        "slot_id",
        "start_at",
        "status",
    ):
        op.drop_index(
            op.f(f"ix_human_interview_bookings_{column}"), table_name="human_interview_bookings"
        )
    op.drop_table("human_interview_bookings")
    op.drop_index(op.f("ix_human_interview_sessions_status"), table_name="human_interview_sessions")
    op.drop_index(
        op.f("ix_human_interview_sessions_public_id"), table_name="human_interview_sessions"
    )
    op.drop_table("human_interview_sessions")
    for column in ("created_by", "end_at", "interviewer_id", "public_id", "start_at", "status"):
        op.drop_index(
            op.f(f"ix_human_interview_availability_slots_{column}"),
            table_name="human_interview_availability_slots",
        )
    op.drop_table("human_interview_availability_slots")
    for column in (
        "application_id",
        "candidate_id",
        "created_by",
        "interview_type",
        "job_id",
        "meeting_information_id",
        "primary_interviewer_id",
        "public_id",
        "status",
        "token",
    ):
        op.drop_index(
            op.f(f"ix_human_interview_invitations_{column}"),
            table_name="human_interview_invitations",
        )
    op.drop_table("human_interview_invitations")
    for column in (
        "status",
        "public_id",
        "organization_id",
        "location_template_id",
        "interview_type",
        "created_by",
    ):
        op.drop_index(
            op.f(f"ix_human_interview_meeting_information_{column}"),
            table_name="human_interview_meeting_information",
        )
    op.drop_table("human_interview_meeting_information")
    for column in ("status", "public_id", "organization_id", "created_by"):
        op.drop_index(
            op.f(f"ix_human_interview_location_templates_{column}"),
            table_name="human_interview_location_templates",
        )
    op.drop_table("human_interview_location_templates")
    for column in ("user_id", "status", "public_id", "organization_id"):
        op.drop_index(op.f(f"ix_human_interviewers_{column}"), table_name="human_interviewers")
    op.drop_table("human_interviewers")
    op.drop_index(op.f("ix_notifications_status"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_recipient_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_public_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_notification_type"), table_name="notifications")
    op.drop_table("notifications")

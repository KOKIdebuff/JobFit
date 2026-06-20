"""create core business tables

Revision ID: 20260620_0002
Revises: 20260619_0001
Create Date: 2026-06-20 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260620_0002"
down_revision: str | None = "20260619_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("created_by", sa.CHAR(length=36), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("company", sa.String(length=160), nullable=False),
        sa.Column("location", sa.String(length=120), nullable=False),
        sa.Column("employment_type", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("jd_text", sa.Text(), nullable=False),
        sa.Column("profile_json", sa.Text(), nullable=False),
        sa.Column("data_source", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.id"], name=op.f("fk_jobs_created_by_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_jobs")),
        sa.UniqueConstraint("public_id", name=op.f("uq_jobs_public_id")),
    )
    op.create_index(op.f("ix_jobs_created_by"), "jobs", ["created_by"], unique=False)
    op.create_index(op.f("ix_jobs_public_id"), "jobs", ["public_id"], unique=False)
    op.create_index(op.f("ix_jobs_status"), "jobs", ["status"], unique=False)

    op.create_table(
        "resumes",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("owner_id", sa.CHAR(length=36), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("structured_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("data_source", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], name=op.f("fk_resumes_owner_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_resumes")),
        sa.UniqueConstraint("public_id", name=op.f("uq_resumes_public_id")),
    )
    op.create_index(op.f("ix_resumes_owner_id"), "resumes", ["owner_id"], unique=False)
    op.create_index(op.f("ix_resumes_public_id"), "resumes", ["public_id"], unique=False)

    op.create_table(
        "applications",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("job_id", sa.CHAR(length=36), nullable=False),
        sa.Column("candidate_id", sa.CHAR(length=36), nullable=False),
        sa.Column("resume_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=60), nullable=False),
        sa.Column("detail_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["candidate_id"], ["users.id"], name=op.f("fk_applications_candidate_id_users")
        ),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], name=op.f("fk_applications_job_id_jobs")),
        sa.ForeignKeyConstraint(
            ["resume_id"], ["resumes.id"], name=op.f("fk_applications_resume_id_resumes")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_applications")),
        sa.UniqueConstraint("job_id", "candidate_id", name="uq_applications_job_candidate"),
        sa.UniqueConstraint("public_id", name=op.f("uq_applications_public_id")),
    )
    op.create_index(
        op.f("ix_applications_candidate_id"), "applications", ["candidate_id"], unique=False
    )
    op.create_index(op.f("ix_applications_job_id"), "applications", ["job_id"], unique=False)
    op.create_index(op.f("ix_applications_public_id"), "applications", ["public_id"], unique=False)
    op.create_index(op.f("ix_applications_resume_id"), "applications", ["resume_id"], unique=False)
    op.create_index(op.f("ix_applications_status"), "applications", ["status"], unique=False)

    op.create_table(
        "match_results",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False),
        sa.Column("rule_version", sa.String(length=80), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("data_source", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_match_results_application_id_applications"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_match_results")),
        sa.UniqueConstraint("application_id", name=op.f("uq_match_results_application_id")),
        sa.UniqueConstraint("public_id", name=op.f("uq_match_results_public_id")),
    )
    op.create_index(
        op.f("ix_match_results_public_id"), "match_results", ["public_id"], unique=False
    )

    op.create_table(
        "trial_tasks",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("source", sa.String(length=40), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("created_by", sa.CHAR(length=36), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_trial_tasks_application_id_applications"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.id"], name=op.f("fk_trial_tasks_created_by_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_trial_tasks")),
        sa.UniqueConstraint("application_id", name=op.f("uq_trial_tasks_application_id")),
        sa.UniqueConstraint("public_id", name=op.f("uq_trial_tasks_public_id")),
    )
    op.create_index(op.f("ix_trial_tasks_public_id"), "trial_tasks", ["public_id"], unique=False)

    op.create_table(
        "trial_submissions",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("prototype_url", sa.String(length=500), nullable=False),
        sa.Column("attachments_json", sa.Text(), nullable=False),
        sa.Column("evaluation_json", sa.Text(), nullable=True),
        sa.Column("submit_count", sa.Integer(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_trial_submissions_application_id_applications"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_trial_submissions")),
        sa.UniqueConstraint("application_id", name=op.f("uq_trial_submissions_application_id")),
        sa.UniqueConstraint("public_id", name=op.f("uq_trial_submissions_public_id")),
    )
    op.create_index(
        op.f("ix_trial_submissions_public_id"), "trial_submissions", ["public_id"], unique=False
    )

    op.create_table(
        "evaluation_reports",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("hr_payload_json", sa.Text(), nullable=False),
        sa.Column("candidate_payload_json", sa.Text(), nullable=False),
        sa.Column("data_source", sa.String(length=40), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("confirmed_by", sa.CHAR(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_evaluation_reports_application_id_applications"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["confirmed_by"], ["users.id"], name=op.f("fk_evaluation_reports_confirmed_by_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_evaluation_reports")),
        sa.UniqueConstraint("application_id", name=op.f("uq_evaluation_reports_application_id")),
        sa.UniqueConstraint("public_id", name=op.f("uq_evaluation_reports_public_id")),
    )
    op.create_index(
        op.f("ix_evaluation_reports_public_id"), "evaluation_reports", ["public_id"], unique=False
    )

    op.create_table(
        "recruitment_decisions",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("outcome", sa.String(length=80), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("internal_note", sa.Text(), nullable=True),
        sa.Column("decided_by", sa.CHAR(length=36), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("history_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_recruitment_decisions_application_id_applications"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["decided_by"], ["users.id"], name=op.f("fk_recruitment_decisions_decided_by_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recruitment_decisions")),
        sa.UniqueConstraint("application_id", name=op.f("uq_recruitment_decisions_application_id")),
        sa.UniqueConstraint("public_id", name=op.f("uq_recruitment_decisions_public_id")),
    )
    op.create_index(
        op.f("ix_recruitment_decisions_public_id"),
        "recruitment_decisions",
        ["public_id"],
        unique=False,
    )

    op.create_table(
        "ai_runs",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("public_id", sa.String(length=120), nullable=False),
        sa.Column("application_id", sa.CHAR(length=36), nullable=True),
        sa.Column("actor_id", sa.CHAR(length=36), nullable=False),
        sa.Column("operation", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("model", sa.String(length=80), nullable=False),
        sa.Column("prompt_version", sa.String(length=80), nullable=False),
        sa.Column("schema_version", sa.String(length=80), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fallback_source", sa.String(length=80), nullable=True),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("input_summary", sa.Text(), nullable=False),
        sa.Column("output_summary", sa.Text(), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], name=op.f("fk_ai_runs_actor_id_users")),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            name=op.f("fk_ai_runs_application_id_applications"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_runs")),
        sa.UniqueConstraint("public_id", name=op.f("uq_ai_runs_public_id")),
    )
    op.create_index(op.f("ix_ai_runs_actor_id"), "ai_runs", ["actor_id"], unique=False)
    op.create_index(op.f("ix_ai_runs_application_id"), "ai_runs", ["application_id"], unique=False)
    op.create_index(op.f("ix_ai_runs_operation"), "ai_runs", ["operation"], unique=False)
    op.create_index(op.f("ix_ai_runs_public_id"), "ai_runs", ["public_id"], unique=False)
    op.create_index(op.f("ix_ai_runs_status"), "ai_runs", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_runs_status"), table_name="ai_runs")
    op.drop_index(op.f("ix_ai_runs_public_id"), table_name="ai_runs")
    op.drop_index(op.f("ix_ai_runs_operation"), table_name="ai_runs")
    op.drop_index(op.f("ix_ai_runs_application_id"), table_name="ai_runs")
    op.drop_index(op.f("ix_ai_runs_actor_id"), table_name="ai_runs")
    op.drop_table("ai_runs")
    op.drop_index(op.f("ix_recruitment_decisions_public_id"), table_name="recruitment_decisions")
    op.drop_table("recruitment_decisions")
    op.drop_index(op.f("ix_evaluation_reports_public_id"), table_name="evaluation_reports")
    op.drop_table("evaluation_reports")
    op.drop_index(op.f("ix_trial_submissions_public_id"), table_name="trial_submissions")
    op.drop_table("trial_submissions")
    op.drop_index(op.f("ix_trial_tasks_public_id"), table_name="trial_tasks")
    op.drop_table("trial_tasks")
    op.drop_index(op.f("ix_match_results_public_id"), table_name="match_results")
    op.drop_table("match_results")
    op.drop_index(op.f("ix_applications_status"), table_name="applications")
    op.drop_index(op.f("ix_applications_resume_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_public_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_job_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_candidate_id"), table_name="applications")
    op.drop_table("applications")
    op.drop_index(op.f("ix_resumes_public_id"), table_name="resumes")
    op.drop_index(op.f("ix_resumes_owner_id"), table_name="resumes")
    op.drop_table("resumes")
    op.drop_index(op.f("ix_jobs_status"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_public_id"), table_name="jobs")
    op.drop_index(op.f("ix_jobs_created_by"), table_name="jobs")
    op.drop_table("jobs")

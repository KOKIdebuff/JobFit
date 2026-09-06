"""create JobFit competency assessment tables

Revision ID: 20260905_0005
Revises: 20260621_0004
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260905_0005"
down_revision: str | None = "20260621_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ID = sa.CHAR(length=36)
NOW = sa.DateTime(timezone=True)


def _identity() -> list[sa.Column]:
    return [
        sa.Column("id", ID, nullable=False),
        sa.Column("public_id", sa.String(120), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "candidate_competency_profiles",
        *_identity(),
        sa.Column("owner_id", ID, nullable=False),
        sa.Column("resume_id", ID, nullable=False),
        sa.Column("skills_json", sa.Text(), nullable=False),
        sa.Column("projects_json", sa.Text(), nullable=False),
        sa.Column("experience_json", sa.Text(), nullable=False),
        sa.Column("education_json", sa.Text(), nullable=False),
        sa.Column("competency_tags_json", sa.Text(), nullable=False),
        sa.Column("resume_evidence_json", sa.Text(), nullable=False),
        sa.Column("schema_version", sa.String(40), nullable=False),
        sa.Column("data_source", sa.String(40), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.Column("updated_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index(
        "ix_candidate_competency_profiles_public_id", "candidate_competency_profiles", ["public_id"]
    )
    op.create_index(
        "ix_candidate_competency_profiles_owner_id", "candidate_competency_profiles", ["owner_id"]
    )
    op.create_index(
        "ix_candidate_competency_profiles_resume_id", "candidate_competency_profiles", ["resume_id"]
    )
    op.create_table(
        "job_competency_profiles",
        *_identity(),
        sa.Column("owner_id", ID, nullable=False),
        sa.Column("job_role", sa.String(80), nullable=False),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("jd_text", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("profile_version", sa.String(40), nullable=False),
        sa.Column("source_profile_id", sa.String(80), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.Column("updated_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index(
        "ix_job_competency_profiles_public_id", "job_competency_profiles", ["public_id"]
    )
    op.create_index("ix_job_competency_profiles_owner_id", "job_competency_profiles", ["owner_id"])
    op.create_index("ix_job_competency_profiles_job_role", "job_competency_profiles", ["job_role"])
    op.create_table(
        "job_competencies",
        sa.Column("id", ID, nullable=False),
        sa.Column("profile_id", ID, nullable=False),
        sa.Column("competency_id", sa.String(80), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("rubric_json", sa.Text(), nullable=False),
        sa.Column("question_strategy_json", sa.Text(), nullable=False),
        sa.Column("evidence_requirements_json", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["job_competency_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_id", "competency_id"),
    )
    op.create_index("ix_job_competencies_profile_id", "job_competencies", ["profile_id"])
    op.create_table(
        "assessment_cases",
        *_identity(),
        sa.Column("candidate_id", ID, nullable=False),
        sa.Column("resume_id", ID, nullable=False),
        sa.Column("candidate_profile_id", ID, nullable=False),
        sa.Column("job_profile_id", ID, nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.Column("updated_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["candidate_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"]),
        sa.ForeignKeyConstraint(["candidate_profile_id"], ["candidate_competency_profiles.id"]),
        sa.ForeignKeyConstraint(["job_profile_id"], ["job_competency_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index("ix_assessment_cases_public_id", "assessment_cases", ["public_id"])
    op.create_index("ix_assessment_cases_candidate_id", "assessment_cases", ["candidate_id"])
    op.create_table(
        "interview_sessions",
        *_identity(),
        sa.Column("assessment_id", ID, nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("current_competency_id", sa.String(80)),
        sa.Column("current_difficulty", sa.Integer(), nullable=False),
        sa.Column("turn_count", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("covered_competencies_json", sa.Text(), nullable=False),
        sa.Column("unresolved_signals_json", sa.Text(), nullable=False),
        sa.Column("started_at", NOW),
        sa.Column("completed_at", NOW),
        sa.Column("created_at", NOW, nullable=False),
        sa.Column("updated_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessment_cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("assessment_id"),
    )
    op.create_index("ix_interview_sessions_public_id", "interview_sessions", ["public_id"])
    op.create_index("ix_interview_sessions_assessment_id", "interview_sessions", ["assessment_id"])
    op.create_table(
        "interview_messages",
        *_identity(),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("turn_index", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("input_method", sa.String(30), nullable=False),
        sa.Column("competency_id", sa.String(80), nullable=False),
        sa.Column("question_strategy", sa.String(50), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=False),
        sa.Column("client_request_id", sa.String(80)),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("session_id", "client_request_id"),
        sa.UniqueConstraint("session_id", "turn_index", "role"),
    )
    op.create_index("ix_interview_messages_public_id", "interview_messages", ["public_id"])
    op.create_index("ix_interview_messages_session_id", "interview_messages", ["session_id"])
    op.create_table(
        "answer_assessments",
        *_identity(),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("question_id", sa.String(120), nullable=False),
        sa.Column("answer_id", sa.String(120), nullable=False),
        sa.Column("competency_id", sa.String(80), nullable=False),
        *[
            sa.Column(name, sa.Float(), nullable=False)
            for name in (
                "relevance",
                "depth",
                "correctness",
                "specificity",
                "evidence_strength",
                "uncertainty",
            )
        ],
        sa.Column("missing_points_json", sa.Text(), nullable=False),
        sa.Column("contradictions_json", sa.Text(), nullable=False),
        sa.Column("competency_signal_json", sa.Text(), nullable=False),
        sa.Column("recommended_next_action", sa.String(50), nullable=False),
        sa.Column("provider", sa.String(40), nullable=False),
        sa.Column("model", sa.String(80), nullable=False),
        sa.Column("prompt_version", sa.String(80), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("answer_id"),
    )
    op.create_index("ix_answer_assessments_public_id", "answer_assessments", ["public_id"])
    op.create_index("ix_answer_assessments_session_id", "answer_assessments", ["session_id"])
    op.create_table(
        "competency_evidence",
        *_identity(),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("competency_id", sa.String(80), nullable=False),
        sa.Column("source", sa.String(40), nullable=False),
        sa.Column("question_id", sa.String(120), nullable=False),
        sa.Column("answer_id", sa.String(120), nullable=False),
        sa.Column("signal", sa.Text(), nullable=False),
        sa.Column("strength", sa.Float(), nullable=False),
        sa.Column("polarity", sa.String(20), nullable=False),
        sa.Column("supported_level", sa.Integer(), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("session_id", "answer_id", "signal"),
    )
    op.create_index("ix_competency_evidence_public_id", "competency_evidence", ["public_id"])
    op.create_index("ix_competency_evidence_session_id", "competency_evidence", ["session_id"])
    op.create_index(
        "ix_competency_evidence_competency_id", "competency_evidence", ["competency_id"]
    )
    op.create_table(
        "interview_memories",
        sa.Column("id", ID, nullable=False),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("summary_memory", sa.Text(), nullable=False),
        sa.Column("evidence_memory_json", sa.Text(), nullable=False),
        sa.Column("unresolved_signals_json", sa.Text(), nullable=False),
        sa.Column("last_compacted_turn", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("updated_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )
    op.create_table(
        "retrieval_traces",
        *_identity(),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("turn_index", sa.Integer(), nullable=False),
        sa.Column("purpose", sa.String(50), nullable=False),
        sa.Column("query_summary", sa.String(240), nullable=False),
        sa.Column("source_ids_json", sa.Text(), nullable=False),
        sa.Column("scores_json", sa.Text(), nullable=False),
        sa.Column("knowledge_version", sa.String(40), nullable=False),
        sa.Column("created_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index("ix_retrieval_traces_public_id", "retrieval_traces", ["public_id"])
    op.create_index("ix_retrieval_traces_session_id", "retrieval_traces", ["session_id"])
    op.create_table(
        "assessment_reports",
        *_identity(),
        sa.Column("assessment_id", ID, nullable=False),
        sa.Column("session_id", ID, nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("overall_score", sa.Integer(), nullable=False),
        sa.Column("fit_score", sa.Integer(), nullable=False),
        sa.Column("level", sa.String(40), nullable=False),
        sa.Column("competency_scores_json", sa.Text(), nullable=False),
        sa.Column("boundaries_json", sa.Text(), nullable=False),
        sa.Column("strengths_json", sa.Text(), nullable=False),
        sa.Column("gaps_json", sa.Text(), nullable=False),
        sa.Column("recommendations_json", sa.Text(), nullable=False),
        sa.Column("evidence_refs_json", sa.Text(), nullable=False),
        sa.Column("generated_at", NOW, nullable=False),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessment_cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("assessment_id"),
        sa.UniqueConstraint("session_id"),
    )
    op.create_index("ix_assessment_reports_public_id", "assessment_reports", ["public_id"])


def downgrade() -> None:
    for table in (
        "assessment_reports",
        "retrieval_traces",
        "interview_memories",
        "competency_evidence",
        "answer_assessments",
        "interview_messages",
        "interview_sessions",
        "assessment_cases",
        "job_competencies",
        "job_competency_profiles",
        "candidate_competency_profiles",
    ):
        op.drop_table(table)

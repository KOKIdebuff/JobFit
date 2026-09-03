import json
from datetime import timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.time import utc_now
from app.modules.ai_runs.models import AiRun
from app.modules.ai_runs.schemas import AiRunDto


def _loads(value: str) -> dict[str, Any]:
    parsed = json.loads(value or "{}")
    return parsed if isinstance(parsed, dict) else {}


def _dumps(value: dict[str, Any]) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


class AiRunService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create_run(
        self,
        *,
        public_id: str,
        actor_id: UUID,
        operation: str,
        prompt_version: str,
        schema_version: str,
        application_id: UUID | None = None,
        input_summary: dict[str, Any] | None = None,
        output_summary: dict[str, Any] | None = None,
        payload: dict[str, Any] | None = None,
        duration_ms: int = 1200,
        status: str = "running",
        fallback_source: str | None = None,
    ) -> AiRun:
        existing = self.session.scalar(select(AiRun).where(AiRun.public_id == public_id))
        if existing is not None:
            return existing
        now = utc_now()
        run = AiRun(
            public_id=public_id,
            actor_id=actor_id,
            application_id=application_id,
            operation=operation,
            status=status,
            provider="mock",
            model="mock-structured-v1",
            prompt_version=prompt_version,
            schema_version=schema_version,
            duration_ms=duration_ms,
            started_at=now,
            fallback_source=fallback_source,
            input_summary=_dumps(input_summary or {}),
            output_summary=_dumps(output_summary or {}),
            payload_json=_dumps(payload or {}),
            created_at=now,
            updated_at=now,
        )
        self.session.add(run)
        self.session.flush()
        return run

    def advance_due_runs(self) -> None:
        now = utc_now()
        runs = self.session.scalars(
            select(AiRun).where(AiRun.status.in_(["pending", "running"]))
        ).all()
        changed = False
        for run in runs:
            if now >= run.started_at + timedelta(milliseconds=run.duration_ms):
                run.status = "completed"
                run.completed_at = now
                run.updated_at = now
                changed = True
        if changed:
            self.session.flush()

    def list_runs(self, *, application_id: UUID | None = None) -> list[AiRun]:
        self.advance_due_runs()
        statement = select(AiRun).order_by(AiRun.created_at.desc())
        if application_id is not None:
            statement = statement.where(AiRun.application_id == application_id)
        return list(self.session.scalars(statement).all())

    def to_dto(self, run: AiRun) -> AiRunDto:
        return AiRunDto(
            id=run.id,
            public_id=run.public_id,
            application_id=run.application_id,
            application_public_id=run.application.public_id
            if run.application is not None
            else None,
            operation=run.operation,
            status=run.status,
            provider=run.provider,
            model=run.model,
            prompt_version=run.prompt_version,
            schema_version=run.schema_version,
            duration_ms=run.duration_ms,
            started_at=run.started_at,
            completed_at=run.completed_at,
            fallback_source=run.fallback_source,
            error_code=run.error_code,
            input_summary=_loads(run.input_summary),
            output_summary=_loads(run.output_summary),
            payload=_loads(run.payload_json),
            created_at=run.created_at,
            updated_at=run.updated_at,
        )

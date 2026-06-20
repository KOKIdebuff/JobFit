from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contracts.api import SuccessResponse, success_response
from app.contracts.errors import ErrorCode
from app.core.exceptions import AppException
from app.core.time import utc_now
from app.db.session import get_session
from app.modules.auth_users.deps import current_user
from app.modules.auth_users.schemas import AuthUser
from app.modules.notifications.models import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])
SESSION_DEPENDENCY = Depends(get_session)
CURRENT_USER_DEPENDENCY = Depends(current_user)


def _request_id(request: Request) -> UUID:
    return UUID(str(request.state.request_id))


@router.get("")
def list_notifications(
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    session: Session = SESSION_DEPENDENCY,
) -> SuccessResponse[dict[str, Any]]:
    notifications = session.scalars(
        select(Notification)
        .where(Notification.recipient_id == user.id)
        .order_by(Notification.created_at.desc())
    ).all()
    return success_response(
        {
            "notifications": [
                {
                    "id": item.public_id,
                    "type": item.notification_type,
                    "title": item.title,
                    "body": item.body,
                    "status": item.status,
                    "entity_type": item.entity_type,
                    "entity_public_id": item.entity_public_id,
                    "dedupe_key": item.dedupe_key,
                    "remind_at": item.remind_at.isoformat() if item.remind_at is not None else None,
                    "created_at": item.created_at.isoformat(),
                    "read_at": item.read_at.isoformat() if item.read_at is not None else None,
                }
                for item in notifications
            ]
        },
        request_id=_request_id(request),
    )


@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    session: Session = SESSION_DEPENDENCY,
) -> SuccessResponse[dict[str, Any]]:
    notification = session.scalar(
        select(Notification).where(
            Notification.public_id == notification_id,
            Notification.recipient_id == user.id,
        )
    )
    if notification is None:
        raise AppException(ErrorCode.AUTH_FORBIDDEN)
    now = utc_now()
    if notification.status != "read":
        notification.status = "read"
        notification.read_at = now
        session.commit()
    return success_response(
        {
            "id": notification.public_id,
            "status": notification.status,
            "read_at": (
                notification.read_at.isoformat() if notification.read_at is not None else None
            ),
        },
        request_id=_request_id(request),
    )


@router.post("/read-all")
def mark_all_notifications_read(
    request: Request,
    user: AuthUser = CURRENT_USER_DEPENDENCY,
    session: Session = SESSION_DEPENDENCY,
) -> SuccessResponse[dict[str, Any]]:
    notifications = session.scalars(
        select(Notification).where(
            Notification.recipient_id == user.id,
            Notification.status != "read",
        )
    ).all()
    now = utc_now()
    for notification in notifications:
        notification.status = "read"
        notification.read_at = now
    session.commit()
    return success_response({"updated_count": len(notifications)}, request_id=_request_id(request))

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth_users.models import Organization, User


class AuthUsersRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_user_by_id(self, user_id: UUID) -> User | None:
        return self.session.get(User, user_id)

    def get_user_by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email))

    def get_user_by_username(self, username: str) -> User | None:
        return self.session.scalar(select(User).where(User.username == username))

    def get_user_by_identifier(self, identifier: str) -> User | None:
        if "@" in identifier:
            return self.get_user_by_email(identifier)
        return self.get_user_by_username(identifier)

    def get_organization_by_name(self, name: str) -> Organization | None:
        return self.session.scalar(select(Organization).where(Organization.name == name))

    def create_organization(self, name: str) -> Organization:
        organization = Organization(name=name)
        self.session.add(organization)
        self.session.flush()
        return organization

    def create_user(
        self,
        *,
        email: str,
        username: str,
        display_name: str,
        role: str,
        password_hash: str,
        organization_id: UUID | None,
    ) -> User:
        user = User(
            email=email,
            username=username,
            display_name=display_name,
            role=role,
            password_hash=password_hash,
            organization_id=organization_id,
        )
        self.session.add(user)
        self.session.flush()
        return user

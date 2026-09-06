from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import get_settings
from app.db.base import Base
from app.modules.ai_runs import models as ai_runs_models
from app.modules.applications_matches import models as applications_matches_models
from app.modules.auth_users import models as auth_users_models
from app.modules.human_interviews import models as human_interviews_models
from app.modules.jobfit import models as jobfit_models
from app.modules.jobs import models as jobs_models
from app.modules.notifications import models as notifications_models
from app.modules.reports import models as reports_models
from app.modules.resumes import models as resumes_models
from app.modules.trials import models as trials_models

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

del (
    ai_runs_models,
    applications_matches_models,
    auth_users_models,
    human_interviews_models,
    jobs_models,
    jobfit_models,
    notifications_models,
    reports_models,
    resumes_models,
    trials_models,
)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    settings = get_settings()
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    settings = get_settings()
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.database_url
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

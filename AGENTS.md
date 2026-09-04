# Repository Guidelines

## Project Structure & Module Organization

HireLink is split into a TanStack Start frontend and a FastAPI backend.

- `src/routes/` contains file-based routes. Keep `src/routeTree.gen.ts` generated.
- `src/components/` contains UI and domain components; shared primitives live in `src/components/ui/`.
- `src/lib/` and `src/hooks/` hold services, adapters, fixtures, and React hooks.
- `src/assets/` stores frontend media assets.
- `backend/app/` contains `api/`, `core/`, `db/`, `contracts/`, and domain modules under `modules/`.
- `backend/tests/` contains pytest tests grouped by feature or contract.
- `docs/` contains product, architecture, and roadmap notes.

## Build, Test, and Development Commands

Run frontend commands from the repository root:

- `bun install --frozen-lockfile` installs locked dependencies.
- `bun run dev` starts the Vite/TanStack development server.
- `bun run build` creates a production build.
- `bun run lint` runs ESLint and Prettier checks.
- `bun run format` applies Prettier.

Run backend commands from `backend/`:

- `uv sync --frozen` installs locked Python dependencies.
- `uv run uvicorn app.main:app --reload` starts FastAPI locally.
- `uv run ruff format --check .` checks Python formatting.
- `uv run ruff check .` runs Python lint checks.
- `uv run mypy app` runs strict type checking.
- `uv run pytest` runs the backend test suite.
- `uv run alembic upgrade head` applies migrations.

## Coding Style & Naming Conventions

Frontend code uses TypeScript, React, ESLint, and Prettier. Prettier uses 100-character lines, semicolons, double quotes, and trailing commas. Prefer `*.server.ts` for server-only code. Use PascalCase for components and `useCamelCase` for hooks.

Backend code targets Python 3.12. Ruff uses a 100-character line length. Keep domain logic inside `backend/app/modules/<domain>/`, separating schemas, services, routers, repositories, and models where applicable.

## Testing Guidelines

Backend tests use pytest. Place tests under `backend/tests/<feature>/` and name files `test_*.py`. Add contract tests under `backend/tests/contract/` when API envelope behavior changes. Run targeted tests during development, then `uv run pytest` before handoff.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commit style, for example `feat(frontend): add evidence report workflow`. Keep commits focused and use `type(scope): subject` when practical.

Pull requests should include a summary, task context, test results, and screenshots or recordings for visible UI changes. Note migrations, configuration changes, and follow-up work explicitly.

## Security & Configuration Tips

Do not commit secrets, local databases, or generated logs. Treat `backend/uv.lock` and root `bun.lock` as dependency truth. Review auth, file parsing, and API contract changes carefully before merging.

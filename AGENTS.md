# Repository Guidelines

## Product Context

JobFit 是面向新一代信息技术岗位的岗位胜任力评估智能体。当前 Runtime 的唯一主线是：

简历上传与解析 → Candidate Competency Profile → Job Competency Profile → 固定 Interview Orchestrator 的自适应对话 → Evidence Ledger → 能力边界 → 岗位匹配度 → 评估报告。

不要把 JobFit 扩展或描述为 ATS、企业人才运营、HR 招聘 CRM、真人面试预约、数字人、视频面试、录音录像、反作弊或自由决策型多 Agent 平台。旧 HireLink 模块、表和环境变量别名仅可作为历史或兼容事实说明。

## Project Structure & Module Organization

JobFit 由 TanStack Start 前端和 FastAPI 后端组成。

- src/routes/ 包含文件路由；src/routeTree.gen.ts 为生成文件，禁止手工编辑。
- src/components/ 包含 UI 与领域组件；通用原子组件位于 src/components/ui/。
- src/lib/ 与 src/hooks/ 保存服务、适配器、类型和 React Hook。
- backend/app/ 包含 api、core、db、contracts 和 modules。
- backend/app/modules/jobfit/ 是岗位评估 Runtime；领域逻辑分离到 models、schemas、service、router、profiles 与 retrieval。
- backend/tests/ 按功能与契约组织 pytest。
- docs/ 保存产品、架构、路线图、实现状态与契约文档。

## Build, Test, and Development Commands

前端在仓库根目录执行：

- bun install --frozen-lockfile
- bun run dev
- bun run build
- bun run lint
- bun run format

后端在 backend/ 目录执行：

- uv sync --frozen
- uv run uvicorn app.main:app --reload
- uv run ruff format --check .
- uv run ruff check .
- uv run mypy app
- uv run pytest
- uv run alembic upgrade head

## Coding Style & Naming Conventions

前端使用 TypeScript、React、ESLint 与 Prettier。Prettier 使用 100 字符行宽、分号、双引号和 trailing comma。服务端专用模块优先使用 \*.server.ts；组件使用 PascalCase，Hook 使用 useCamelCase。

后端目标为 Python 3.12，Ruff 行宽为 100。领域逻辑应留在 backend/app/modules/<domain>/，按 schemas、services、routers、repositories 和 models 拆分。

JobFit Runtime 的状态、Evidence、记忆和报告规则必须可追溯、可测试。不要把确定性评分或内置 BM25 索引表述为真实外部模型或在线知识库。

## Testing Guidelines

后端测试使用 pytest，功能测试放入 backend/tests/<feature>/ 并命名为 test\_\*.py。API envelope 变化时在 backend/tests/contract/ 增加契约测试。开发时先运行最小相关测试，交付前运行 uv run pytest。

浏览器 SpeechRecognition 仅能验证文本输入路径；不得把它当作音频采集、录制或回放测试。

## Documentation Rules

- docs/implementation-status.md 是当前实现状态事实源；任何 implemented、partial、mock、frontend_demo、not_started 或 legacy 声明必须有代码、迁移、配置或测试证据。
- docs/prd.md 定义产品目标与边界；docs/architecture.md 定义当前与目标架构；docs/roadmap.md 定义实施顺序，不得互相替代。
- 活动文档只能把旧 HireLink、HR CRM、真人面试、视频、反作弊和能力试炼写为历史遗留、兼容或明确不纳入。
- docs/archive/ 与 design-qa.md 是历史证据，不得改写为当前产品事实。

## Commit & Pull Request Guidelines

最近历史遵循 Conventional Commit，例如 feat(jobfit): add adaptive competency assessment workflow。提交应聚焦，必要时使用 type(scope): subject。

Pull request 应包括摘要、任务上下文、测试结果和可见 UI 的截图或录屏。明确说明迁移、配置变化和后续工作。

## Security & Configuration Tips

不要提交密钥、本地数据库、日志或生成物。backend/uv.lock 与根目录 bun.lock 是依赖事实源。新部署使用 JOBFIT 环境变量；HIRELINK 环境变量仅为兼容读取别名。

审查认证、文件解析、资源所有权、用户输入和网络请求。生产环境必须配置非默认 JOBFIT_JWT_SECRET；配置 openai_compatible 时必须同时提供 base URL、API key 和模型名。

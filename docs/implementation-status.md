# HireLink 当前代码实现状态

> 状态：当前代码实现状态唯一事实源\\
> 审计日期：2026-07-11\\
> 依据：当前代码、路由注册、前后端调用链、迁移、测试和可识别的数据来源标记。\\
> 边界：本文描述当前仓库事实，不替代 `docs/prd.md` 第 12 节的产品版本与功能决策。

## 1. 状态规则

P0/P1/P2 只表示产品版本决策，不表示已经完成。当前实现状态统一使用以下枚举：

| 状态 | 含义 |
|---|---|
| `implemented` | 当前代码已有真实前后端或后端闭环、持久化和测试证据，可按代码事实称为已实现。 |
| `partial` | 已有部分真实链路，但缺少前端接入、测试、持久化、AI、权限或端到端闭环。 |
| `frontend_demo` | 主要是前端可交互演示，依赖静态数据、浏览器能力或 localStorage。 |
| `mock` | 后端或前端存在接口/流程，但结果来自 mock、预置 payload、fallback 或固定结构。 |
| `backend_foundation` | 有模型、表、契约或基础设施，但缺少可用业务 router/service/API 闭环。 |
| `not_started` | 当前代码未发现可执行实现。 |
| `blocked` | 已有实现尝试但受缺失依赖、配置或外部条件阻塞；当前未发现该状态。 |

## 2. 当前事实摘要

- 当前 FastAPI 实际注册的业务 router 只有 `auth_users`、`demo_data`、`human_interviews`、`notifications`。
- 核心招聘链路当前由 `demo_data` 承载，岗位、简历、申请、匹配、试炼、报告和 `ai_runs` 多处标记为 `mock`。
- 真实模型 Provider、固定 Agent Orchestrator、真实 PDF/DOCX 上传解析、独立职业画像 API、完整面试会话后端均未落地。
- 真人面试预约后端已具备较完整基础闭环和测试；前端真人面试服务仍使用 localStorage/fallback，未接 `/api/v1/human-interviews/*`。
- 通知后端已实现列表和已读接口；前端通知服务仍使用 localStorage。
- 演示数据是当前稳定演示的重要组成，不得被描述为真实业务生成结果。

## 3. 功能实现证据矩阵

| canonical feature name | product version | implementation status | frontend status | backend status | data persistence status | AI status | integration status | test status | exact code evidence paths | drift description | recommended document correction |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 登录和基础角色权限 | P0 | `implemented` | `implemented`：前端 auth service 调真实 API | `implemented`：注册、登录、退出、当前用户已挂载 | `implemented`：`organizations`、`users` | 不涉及 AI | `implemented`：前后端 auth 调用链存在 | `implemented`：认证 pytest 覆盖 | `backend/app/main.py`; `backend/app/modules/auth_users/router.py`; `backend/app/modules/auth_users/service.py`; `src/lib/auth/service.ts`; `backend/tests/auth_users/test_auth.py` | 早期 P0 基线曾写“不实现完整认证业务”，已落后于代码。 | README/architecture 可以称认证已实现；P0 baseline 必须标注为历史基线。 |
| 简历上传与解析 | P0 | `mock` | `frontend_demo`：本地解析和 localStorage 版本管理 | `partial`：`/resumes` 接 JSON payload，不是真实文件上传解析 | `partial`：`resumes` 表保存文本和结构化 JSON，默认 mock 来源 | `mock`：未见真实 Provider 调用 | `partial`：前端主简历页未形成真实后端文件上传链路 | 未发现简历解析专项测试 | `backend/app/modules/demo_data/router.py`; `backend/app/modules/demo_data/service.py`; `backend/app/modules/resumes/models.py`; `src/lib/resume-parser.ts`; `src/routes/resume.tsx` | 文档要求 PDF/DOCX 真实解析，但当前主要是前端 demo 与后端 mock payload。 | PRD/roadmap 保留 P0 目标；README/architecture 标注当前为 frontend_demo/mock。 |
| AI 职业画像 | P0 | `mock` | `frontend_demo`：候选人详情和画像卡片来自 demo detail | `backend_foundation`：`profiles` 包存在但无完整 router/service/model 闭环 | `backend_foundation` 或 `mock`：画像数据嵌在 demo detail 中 | `mock`：未见画像 Agent / Provider | 未真实联调 | 未发现画像 API 测试 | `backend/app/modules/profiles/__init__.py`; `backend/app/modules/demo_data/service.py`; `src/lib/candidate-detail-demo.ts`; `src/components/candidate-detail/CandidateDetailSections.tsx` | PRD 将 AI 职业画像列为 P0 产品决策，但当前没有独立真实实现。 | 保留 P0 决策，状态写为 mock/backend_foundation。 |
| 岗位发布与 JD 解析 | P0 | `mock` | `partial`：部分页面可创建/展示岗位 | `partial`：`/jobs` 与 `/jobs/{job_id}/parse` 存在 | `partial`：`jobs` 表存在，`data_source` 默认 mock | `mock`：parse 使用固定 `demo_profile()` 和 mock ai_run | `partial`：前端通过 demo API 使用 | 未发现 JD 解析专项测试 | `backend/app/modules/demo_data/router.py`; `backend/app/modules/demo_data/service.py`; `backend/app/modules/jobs/models.py`; `src/lib/hirelink-api/service.ts`; `src/routes/jd-parse.tsx` | 文档目标是真实 JD 解析，代码是 demo parse。 | roadmap/architecture 将真实解析标为 target requirement。 |
| 人岗匹配 | P0 | `mock` | `frontend_demo` / `partial`：匹配页和 HR 候选人页展示 demo 分数 | `partial`：`applications`、`match_results` 表和 demo API 存在 | `partial`：匹配结果可写入表，来源 mock | `mock`：AI 只以 demo 摘要存在，未见真实解释生成 | `partial`：部分 HR 页面读 demo API | 未发现 `match_rule_v1` 测试 | `backend/app/modules/applications_matches/models.py`; `backend/app/modules/demo_data/service.py`; `src/routes/match.tsx`; `src/routes/hr.jobs.$jobId.candidates.tsx`; `src/lib/mock-data.ts` | 文档写固定规则评分目标，代码未见独立规则服务/API。 | 不得称当前已实现确定性匹配，只能称 demo/mock。 |
| 智能面试提问 | P0 / P2 | `frontend_demo` | `frontend_demo`：`/interview` 使用静态问题 | `not_started`：`interviews` 模块无完整业务 API | 无真实持久化证据 | `mock` / `not_started` | 未联调 | 未发现测试 | `src/routes/interview.tsx`; `src/lib/mock-data.ts`; `backend/app/modules/interviews/__init__.py` | 文档要求 P0 预生成题目，但当前未见后端题目集。 | PRD 保留 P0/P2 决策；实现状态写 frontend_demo/not_started。 |
| 岗位能力试炼 | P0 / P2 | `partial` | `partial`：候选人/HR 试炼页调用 demo API，失败可 fallback localStorage | `partial`：trial task/submission demo API 存在 | `partial`：`trial_tasks`、`trial_submissions` 表存在，`source` 默认 mock | `mock`：任务生成和评价使用预设结构 / mock ai_run | `partial`：前端接部分 demo API | 间接由 human_interviews 测试 setup 使用，未见专项试炼测试 | `backend/app/modules/demo_data/router.py`; `backend/app/modules/demo_data/service.py`; `backend/app/modules/trials/models.py`; `src/lib/trial-demo.ts`; `src/routes/candidate.applications.$applicationId.trial.tsx` | 有可交互和持久化基础，但不是真实 AI 任务生成/评价。 | 文档标注 partial/mock，不写成真实岗位能力验证闭环。 |
| 面试会话与记录 | P0 / P2 | `frontend_demo` | `frontend_demo`：本地页面/浏览器能力演示 | `not_started`：无完整面试会话 router/service/model 实现 | 未发现真实会话/回答表落地 | `not_started` | 未联调 | 未发现测试 | `src/routes/interview.tsx`; `src/lib/mock-data.ts`; `backend/app/modules/interviews/__init__.py` | 文档的 P0 会话、转写、确认仍主要是产品目标。 | architecture Current 中不得写为后端已运行组件。 |
| AI 面试证据链报告 | P0 | `partial` | `partial`：HR/候选人报告视图存在 | `partial`：generate/confirm/get demo API 存在 | `partial`：`evaluation_reports` 表存在，data_source mock | `mock`：报告生成使用 `create_report_payload()` 和 mock ai_run | `partial`：前端调用 demo report API | human_interviews setup 会调用确认报告；未见报告专项测试 | `backend/app/modules/demo_data/router.py`; `backend/app/modules/demo_data/service.py`; `backend/app/modules/reports/models.py`; `src/lib/evaluation-report/service.ts`; `src/components/evaluation-report/` | 当前有报告实体和权限视图雏形，但内容非真实模型生成。 | 可描述为 demo API + mock report，不得称真实 AI 报告闭环已完成。 |
| 智能招聘工作台 | P0 / P1 | `partial` | `partial`：HR 岗位/候选人/详情/决策页面存在 | `partial`：jobs/candidates/detail/decision demo API 存在 | `partial`：jobs、applications、match_results、reports、decisions 表 | `mock`：摘要、分数和证据来自 demo/mock | `partial`：部分页面接后端 demo API，部分仍 localStorage | 未发现工作台专项测试 | `src/routes/hr.tsx`; `src/routes/hr.index.tsx`; `src/routes/hr.jobs.$jobId.candidates.tsx`; `src/lib/hirelink-api/service.ts`; `backend/app/modules/demo_data/router.py` | 当前能演示 HR 流程，但不是完整真实招聘工作台。 | README 拆到 Currently implemented / Mock capabilities。 |
| 求职者成长中心 | P0 / P1 | `frontend_demo` | `frontend_demo` / `partial`：候选人报告页存在 | `partial`：候选人可读已确认 mock report | `partial`：报告表存在 | `mock`：成长建议来自预设报告 | `partial` | 未发现专项测试 | `src/routes/candidate.applications.$applicationId.report.tsx`; `src/lib/evaluation-report/service.ts`; `backend/app/modules/demo_data/service.py` | 产品目标是成长中心，当前主要是报告演示视图。 | 标为 frontend_demo/mock，P1 学习路径保持规划。 |
| 多 Agent 协作面板 | P0 | `mock` | `partial`：面板优先读后端，失败 fallback fixtures | `partial`：`/ai-runs` 读取记录 | `partial`：`ai_runs` 表存在 | `mock`：provider/model 默认 mock，无真实 Orchestrator | `partial`：展示层可读 mock runs | 未发现 Agent 专项测试 | `backend/app/modules/ai_runs/models.py`; `backend/app/modules/ai_runs/service.py`; `backend/app/modules/demo_data/router.py`; `src/lib/agent-runs/service.ts`; `src/routes/hr.agent-runs.tsx` | 文档曾把固定 Orchestrator 当目标架构；当前只有 mock 运行记录。 | architecture 图拆分 As-Is 与 To-Be；Current 不画固定 Orchestrator 为已运行。 |
| 演示预置数据 | P0 | `implemented` | `implemented`：多个页面可消费 demo/fallback | `implemented`：`ensure_demo_data()` 幂等准备核心 demo 数据 | `implemented`：写入核心表，来源标记 mock | `mock`：预置数据替代真实 AI | `implemented`：用于演示兜底 | 间接由多个后端测试 setup 使用 | `backend/app/modules/demo_data/service.py`; `backend/app/modules/demo_data/router.py`; `src/lib/mock-data.ts`; `src/lib/*fallback*` | 演示数据是事实能力，但不是业务真实生成。 | README 单列 Mock/preloaded capabilities。 |
| 虚拟面试官 | P1 / P2 | `not_started` | 未见真实 Runtime | 未见后端 API | 无 | 不涉及或未开始 | 无 | 无 | `src/assets/digital-interviewer.jpg` 仅为静态资产；未见服务/API | 产品规划存在，代码未落地。 | 只保留 planned capability。 |
| 能力护照 | P1 / P2 | `not_started` | 未见独立入口 | 未见模型/API | 无 | 无 | 无 | 无 | 未发现独立代码证据 | 产品规划存在，代码未落地。 | 只保留 planned capability。 |
| 真人面试预约 | P1 | `partial` | `frontend_demo`：页面组存在但服务使用 localStorage/fallback | `implemented`：邀约、档期、预约、取消、改期、pending confirmation、提醒、报告等 API | `implemented`：多张 human_interview 表和通知写入 | 不涉及 AI | `partial`：前后端未接真实 API | `implemented`：human_interviews pytest 覆盖较完整 | `backend/app/modules/human_interviews/router.py`; `backend/app/modules/human_interviews/service.py`; `backend/app/modules/human_interviews/models.py`; `backend/migrations/versions/20260620_0003_create_human_interview_tables.py`; `backend/tests/human_interviews/test_human_interviews.py`; `src/lib/human-interviews/service.ts` | 后端状态已超出旧 P1 规划，但前端仍不是端到端真实链路。 | 文档写为后端已实现基础闭环、整体 partial，不纳入 P0 主闭环完成度。 |
| 站内通知 | P1 supporting | `partial` | `frontend_demo`：通知页和 service 使用 localStorage | `implemented`：列表、单条已读、全部已读 API | `implemented`：`notifications` 表 | 不涉及 AI | `partial`：前端未接后端通知 API | `implemented`：human_interviews 测试覆盖用户隔离和已读 | `backend/app/modules/notifications/router.py`; `backend/app/modules/notifications/models.py`; `backend/tests/human_interviews/test_human_interviews.py`; `src/lib/notifications/service.ts`; `src/routes/notifications.tsx` | 后端真实存在，前端仍本地演示。 | 标为 partial，避免“通知已端到端实现”。 |
| 可信面试 | P2 | `not_started` | 未见风险提示 UI | 未见可信面试 API | 无 | 无 | 无 | 无 | 未发现代码证据 | 仅产品规划。 | 只能写 planned，不得说当前支持。 |
| 企业人才运营 | P2 | `not_started` | 未见独立入口 | 未见模型/API | 无 | 无 | 无 | 无 | 未发现代码证据 | 仅产品规划。 | 只能写 planned。 |
| AI 内推网络 | P2 | `frontend_demo` | `frontend_demo`：`/network` 使用静态 mock 数据 | `not_started` | 无 | 无 | 无真实集成 | 无 | `src/routes/network.tsx`; `src/lib/mock-data.ts` | 有演示页，不是 AI 内推网络实现。 | README 标为 interactive frontend demo / planned capability。 |
| ATS 对接 | P2 | `not_started` | 未见入口 | 未见外部集成 API | 无 | 无 | 无 | 无 | 未发现代码证据 | 仅产品规划。 | 只能写 planned。 |

## 4. Router 与 API 当前事实

当前 `backend/app/main.py` 只把以下 router 传入 `create_api_router()`：

- `auth_router`
- `core_router`，来自 `backend/app/modules/demo_data/router.py`
- `human_interviews_router`
- `notifications_router`

因此，只有模型或包目录但没有注册 router 的模块，不能按当前真实 API 能力描述。

## 5. 文档同步规则

- `docs/prd.md`：产品决策事实源。可以描述目标、范围、版本归属和取舍，不维护当前完成度矩阵。
- `docs/implementation-status.md`：当前代码实现状态事实源。任何“当前已实现/已支持/已接入”类表述都应能回到本文的证据行。
- `docs/roadmap.md`：实施顺序、依赖和目标里程碑。不得把 target requirement 写成 current implementation。
- `docs/architecture.md`：拆分 Current / As-Is、Target / To-Be 和 Planned Extensions。目标组件不得画成当前运行组件。
- P0 baseline/task map/contract：历史冻结计划和契约记录。`Frozen` 不等于已完成，`Done When` 不等于 `Done`。
- `README.md`：面向读者的当前状态摘要。必须区分 Product vision、Currently implemented、Interactive frontend demo、Mock/preloaded capabilities 和 Planned capabilities。

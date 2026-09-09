# JobFit

> 面向新一代信息技术岗位的岗位胜任力评估智能体。

JobFit 将简历、目标岗位和多轮对话面试组织为可追溯的岗位能力评估。主路径是：

简历上传与解析 → Candidate Competency Profile → Job Competency Profile → 固定 Interview Orchestrator 驱动的自适应对话 → Evidence Ledger → 能力边界识别 → 岗位匹配度评分 → 自动化评估报告。

它服务于候选人的岗位准备与能力反馈，不是 ATS、企业人才运营系统或招聘 CRM。系统不会作出录用、淘汰或可信面试强判定。

## 当前代码事实

当前实现状态的唯一事实源是 [Implementation Status](./docs/implementation-status.md)。产品目标、架构设计和路线图不等同于当前已经完成的能力。

| 能力                            | 当前状态              | 事实边界                                                                        |
| ------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| 简历上传与解析                  | implemented           | 后端受控处理 PDF、DOCX、TXT，结构化提取为规则/关键词级别。                      |
| Candidate Competency Profile    | implemented           | 从已授权简历创建并持久化候选人能力画像和简历证据。                              |
| Job Competency Profile          | implemented / partial | 已持久化岗位模板画像；自由文本 JD 不会被语义解析成新的能力模型。                |
| 多轮文字面试与动态追问          | implemented           | 固定状态机根据回答的确定性评估调整追问、难度和覆盖维度。                        |
| 浏览器语音输入                  | frontend_demo         | 使用浏览器语音转文字，仅提交文本；不保存或上传音频。                            |
| Evidence Ledger、三层记忆、BM25 | implemented           | 证据、摘要记忆、工作记忆、检索轨迹均有当前 Runtime 证据。                       |
| 能力边界、匹配评分与报告        | implemented           | 由岗位权重和有效 Evidence 的确定性公式生成。                                    |
| 受控 LLM 后续追问 Provider       | implemented           | `JF-P1-01` 已完成受控 deterministic / OpenAI-compatible 路径，并通过 V2（local/mock）验证。 |
| 真实外部 Provider 验证           | pending               | 尚无命名真实外部 Provider 调用或生产验证证据；不得写为 Production Ready。             |

旧招聘平台代码、迁移和表可能仍存在于仓库历史或数据库中，但已经不挂载到 JobFit Runtime、导航或比赛主路径。

## 核心能力

### 岗位胜任力模型

当前内置 AI 工程师、Java 工程师和产品经理三类模板。每个模板定义能力项、权重、L0–L5 Rubric、追问策略和 Evidence 要求；创建评估时会生成可追溯的 Job Competency Profile。

### 固定 Interview Orchestrator

Interview Orchestrator 是受面试状态、岗位模板、回答评估、版本号和 Evidence 规则约束的确定性编排 Runtime。它不是能自由选择工具或目标的多 Agent 平台。

每轮回答会写入面试消息、回答评估和 Evidence；Runtime 决定澄清、追问示例、情景题、提升/降低难度、切换能力维度或结束面试。

### RAG 与长文本记忆

当前检索层使用内置岗位 Rubric 和题库策略片段构建小型 BM25 索引，记录检索来源和分数。当前没有外部知识库、向量数据库或在线题库接入。

- Working Memory：读取最近会话消息。
- Summary Memory：每四轮压缩一段回答摘要。
- Evidence Memory：持久化能力证据的等级与强度。

### 自动化评估报告

完成至少八轮回答后，系统生成能力雷达、能力边界、岗位匹配度、优势、缺口和 P0/P1/P2 提升建议。报告中的评分和建议关联 Evidence ID，不把确定性评分写成真实大模型判断。

## 明确不纳入当前产品

AI 内推网络、企业人才运营、HR 招聘 CRM、ATS 对接、真人面试预约、数字人、虚拟面试官、视频面试、WebRTC、摄像头监考、录音录像、音视频回放、高级反作弊、行为分析和岗位能力试炼不属于 JobFit 当前主线。

## 技术结构

| 层      | 当前职责                                                                                 |
| ------- | ---------------------------------------------------------------------------------------- |
| 前端    | React、TanStack Start、TanStack Router、TanStack Query、Tailwind、Recharts。             |
| API     | FastAPI 统一响应、认证、文件处理与 JobFit REST 资源。                                    |
| Runtime | JobFitService 中的固定面试状态机、Evidence、记忆、BM25 和报告计算。                      |
| 数据    | SQLite、SQLAlchemy、Alembic；JobFit 迁移创建画像、评估、面试、证据、记忆、检索和报告表。 |
| 安全    | JWT HttpOnly Cookie、Argon2id、文件类型/大小/MIME 校验、资源所有权校验。                 |

## 本地运行

### 前端

在仓库根目录执行：

    bun install --frozen-lockfile
    bun run dev

默认地址为 http://127.0.0.1:5173。

### 后端

在 backend 目录执行：

    uv sync --frozen
    uv run alembic upgrade head
    uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

默认 API 地址为 http://127.0.0.1:8000，健康检查为 /health，OpenAPI 为 /docs。

## 环境变量与 Provider 配置

后端读取 `backend/.env`。`backend/.env.example` 是 development 示例的键和值来源，不是可直接用于
production 的部署模板；不得将真实 Provider API key 写入仓库、示例文件或前端环境变量。

| 变量组                                                                                                     | 用途与当前状态 |
| ---------------------------------------------------------------------------------------------------------- | --- |
| JOBFIT_ENVIRONMENT、JOBFIT_LOG_LEVEL、JOBFIT_DATABASE_URL、JOBFIT_SQLITE_BUSY_TIMEOUT_MS                   | 后端运行基础配置。 |
| JOBFIT_JWT_SECRET、JOBFIT_AUTH_COOKIE_NAME                                                                 | 认证安全与 Cookie 名称；production 必须替换默认密钥。 |
| JOBFIT_LLM_PROVIDER、JOBFIT_LLM_BASE_URL、JOBFIT_LLM_API_KEY、JOBFIT_LLM_MODEL、JOBFIT_LLM_TIMEOUT_SECONDS | 受控 Provider 的服务端配置；local/mock 路径已验证，但配置或 mock 不能证明真实外部 Provider 已验证。 |
| JOBFIT_ALLOW_DEMO_PROVIDER                                                                                 | deterministic 演示 Provider 的显式许可；其 production 语义由 D-011 定义。 |
| VITE_JOBFIT_API_BASE_URL                                                                                   | Vite 构建时读取的前端 API 基地址，应在前端环境文件中配置。 |
| VITE_JOBFIT_ENABLE_SPEECH_INPUT                                                                            | 示例中存在但当前前端未读取，不应被表述为可用的功能开关。 |

### Production Provider 契约

`D-011` 已 Accepted，但其生产启动准入尚为 **Not Implemented / Not Verified**；以下是待
`JF-PS-01` 实现的配置契约，而不是当前已经取得的 production 运行证据：

- development / test 未显式配置 Provider 时可以使用 deterministic 默认值。
- production 必须显式设置 `JOBFIT_LLM_PROVIDER`；未设置即应拒绝启动。
- production 显式设置 `JOBFIT_LLM_PROVIDER=deterministic` 时，还必须显式设置
  `JOBFIT_ALLOW_DEMO_PROVIDER=true`。此模式只能称为 demo/mock scope，不能称为真实外部
  Provider、V5 验证或 Production Ready。
- `openai_compatible` 仍要求 base URL、API key 和 model；production URL 必须为 HTTPS。
  Provider 配置错误、超时、网络 / HTTP 错误或无效输出继续按 D-009 fail-closed，禁止自动降级到
  deterministic。

新部署使用 `JOBFIT_*`。当前仅保留以下 HIRELINK legacy 兼容读取：后端的
`HIRELINK_ENVIRONMENT`、`HIRELINK_LOG_LEVEL`、`HIRELINK_DATABASE_URL`、
`HIRELINK_SQLITE_BUSY_TIMEOUT_MS`、`HIRELINK_JWT_SECRET`、`HIRELINK_AUTH_COOKIE_NAME`，以及前端的
`VITE_HIRELINK_API_BASE_URL`。Provider 配置没有 `HIRELINK_LLM_*` alias；即使
`HIRELINK_ENVIRONMENT=production` 使应用进入 production，仍必须由
`JOBFIT_LLM_PROVIDER` 满足 D-011，不能借 legacy alias 代替。

## 验证

前端：

    bun run lint
    bun run build

后端：

    cd backend
    uv run ruff format --check .
    uv run ruff check .
    uv run mypy app
    uv run pytest

## 文档入口

- [产品需求文档](./docs/prd.md)
- [技术架构](./docs/architecture.md)
- [路线图](./docs/roadmap.md)
- [P1 分阶段升级协议](./docs/p1-implementation-protocol.md)
- [实施计划与 P0 接口基线](./docs/implementation-plan.md)
- [当前进度](./docs/progress.md)
- [当前实现状态](./docs/implementation-status.md)
- [架构与产品决策](./docs/architecture-decisions.md)
- [比赛作品说明](./docs/JobFit-AI大赛作品说明文档.md)
- [JobFit 仓库审计](./docs/jobfit-repository-audit.md)
- [历史决策归档](./docs/archive/HireLink决策.md)

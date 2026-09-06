# JobFit 当前实现状态

> 本文是当前代码、迁移、配置和测试可直接证明的事实源，不拥有产品目标、阶段规划或任务运行状态。
> 观察快照：`main` 的代码提交 `9027e06`，本轮工作树仅重组文档；证据来自路由注册、JobFit Runtime、模型、迁移、前端路径、配置和 pytest。
>
> 产品 Desired State 见 [prd.md](./prd.md)，批准取舍见 [architecture-decisions.md](./architecture-decisions.md)，阶段顺序见 [roadmap.md](./roadmap.md)，接口语义见 [implementation-plan.md](./implementation-plan.md) 的 P0 接口与契约基线。

## 1. 状态解释

| 状态 | 可作出的事实结论 |
| --- | --- |
| `implemented` | 已直接观察到可运行的后端或前后端闭环，并能回溯到源码、迁移、配置或测试证据。 |
| `partial` | 已观察到可用片段，但完整语义、真实接入、外部 Provider、可维护资料源或端到端覆盖仍不充分。 |
| `backend_foundation` | 已观察到模型、Schema、迁移或基础设施，但尚未观察到完整的业务 Router/Service/API 闭环。 |
| `frontend_demo` | 前端依赖浏览器能力或交互演示；不等于后端持久化、媒体采集或端到端质量验证。 |
| `mock` | 输出来自固定数据、规则兜底或预置内容；不能表述为真实模型生成或真实集成。 |
| `not_started` | 未观察到当前可执行实现。 |
| `legacy` | 旧代码、表、迁移或兼容设置仍可见，但不在当前 JobFit Runtime 主路径。 |
| `out_of_scope` | 已获批准、明确不纳入当前产品和路线图的能力。 |

## 2. 已观察到的主流程证据

| 能力 | 状态 | 直接观察到的事实 | 主要证据 |
| --- | --- | --- | --- |
| 认证与候选人入口 | implemented | Cookie 认证存在；登录和注册前端进入岗位评估路径。 | `backend/app/modules/auth_users/`、`src/routes/login.tsx`、`src/routes/register.tsx`、`backend/tests/auth_users/test_auth.py`。 |
| FastAPI / SQLite / Alembic 基础 | implemented | FastAPI Router、SQLite 默认连接、foreign keys、busy timeout 和 JobFit Alembic migration 均存在。 | `backend/app/main.py`、`core/config.py`、`db/session.py`、`backend/migrations/versions/20260905_0005_create_jobfit_assessment_tables.py`。 |
| 受控简历上传与解析 | implemented | PDF、DOCX、TXT 经大小、扩展名、MIME、基本签名和文本可提取性校验后，由受控规则提取结构化信息。 | `backend/app/modules/jobfit/service.py` 的 `extract_resume`、`save_resume`。 |
| Candidate Competency Profile | implemented | 已授权简历可生成并持久化技能、项目、经历、教育、标签和简历 Evidence。 | `jobfit/models.py`、`jobfit/service.py`、`backend/migrations/versions/20260905_0005_create_jobfit_assessment_tables.py`。 |
| Job Competency Profile | implemented | 岗位模板、标题、难度、JD 文本和能力项会形成可持久化岗位画像。 | `jobfit/profiles.py`、`jobfit/service.py`、JobFit migration。 |
| 自由 JD 语义建模 | partial | JD 文本可保存，但不会生成任意新的 Rubric 或能力模型。 | `JobProfileCreate`、`create_job_profile`。 |
| 多轮文字面试 | implemented | 会话、消息、版本、至少八轮完成条件和恢复 API 存在。 | `jobfit/router.py`、`jobfit/service.py`、`backend/tests/jobfit/test_jobfit_flow.py`。 |
| 浏览器语音转文字 | frontend_demo | `SpeechRecognition` 或 `webkitSpeechRecognition` 只把文本填入输入，再提交文本。 | `src/routes/interviews.$sessionId.tsx`。 |
| 动态追问 | implemented | 固定规则根据回答信号、覆盖度和难度选择下一动作。 | `JobFitService._assess`、`JobFitService._decide`。 |
| 固定 Interview Orchestrator | implemented | 状态机、岗位模板、会话版本、Evidence 和策略共同约束会话，不存在自由决策型多 Agent Runtime。 | `JobFitService`、`InterviewStatus`、`NextAction`。 |
| Evidence Ledger | implemented | 每轮回答保存 Evidence、强度、支持等级及问题/答案引用。 | `CompetencyEvidence`、Evidence API、主流程测试。 |
| BM25 检索 | implemented | 内置岗位 Rubric、Evidence 要求和题目策略片段可检索，并保存 source ID、分数和知识版本。 | `jobfit/retrieval.py`、`RetrievalTrace`。 |
| Working / Summary / Evidence Memory | implemented | 最近消息、每四轮摘要和持久化 Evidence 记忆可读取。 | `InterviewMemory`、Memory API、主流程测试。 |
| 能力边界与岗位匹配度 | implemented | 由有效 Evidence、能力等级、置信度和岗位权重计算。 | `JobFitService.generate_report`。 |
| 雷达图、优势/缺口、建议与报告 | implemented | 后端保存评分、能力边界、优势、缺口和 P0/P1/P2 建议；前端渲染报告。 | `AssessmentReport`、Reports API、`src/routes/reports.*`、主流程测试。 |
| 真实 LLM Provider | partial | 配置可以校验 `deterministic` / `openai_compatible` 及后者所需字段，但 Runtime 未观察到供应商 SDK 或远程模型调用。 | `backend/app/core/config.py`、`JobFitService`。 |
| 外部知识库或在线题库 | partial | 当前只有内置 BM25 语料，未观察到外部同步或可维护资料来源。 | `jobfit/retrieval.py`。 |

## 3. API、数据与兼容边界

- 当前 `/api/v1` Router 挂载认证与 JobFit 资源；精确请求、响应、错误、资源所有权与会话并发语义见 [implementation-plan.md](./implementation-plan.md) 的 P0 接口与契约基线。
- JobFit 领域迁移创建候选人/岗位画像、评估、面试、消息、回答评估、Evidence、记忆、检索轨迹和报告实体；当前聚合列表由 Implementation Plan 的接口基线维护。
- Settings 以 `JOBFIT_*` 为主，并直接读取有限的 `HIRELINK_*` legacy 别名；Provider 只有配置校验，前端还保留 `VITE_HIRELINK_API_BASE_URL` 兼容读取。其存在不证明旧 Runtime、导航或产品能力。
- `out_of_scope` 能力的完整批准清单见决策 `D-005`，避免在此重复维护产品取舍。

## 4. 测试证据与限制

`backend/tests/auth_users/test_auth.py`、`backend/tests/contract/test_response_contract.py` 与 `backend/tests/jobfit/test_jobfit_flow.py` 覆盖认证、统一响应契约、岗位模板权重、简历上传、画像、会话、Evidence、记忆、检索轨迹、报告和生产默认密钥拒绝等路径。

这些测试使用本地确定性 Runtime 与测试数据库。它们不证明真实 LLM、外部知识库、浏览器语音识别质量、端到端浏览器旅程或生产运行质量。每次实际执行结果、环境和验证级别由 [progress.md](./progress.md) 的事件记录引用，不由本文自行声明通过。

# JobFit 当前实现状态

> 本文是当前代码、迁移、配置和测试可直接证明的事实源，不拥有产品目标、阶段规划或任务运行状态。
> 观察快照：`main` 的 JF-P1-01 Provider、审计 migration 与测试基线，以及当前工作树的 JF-PS-01 Settings 显式来源校验、配置矩阵与事实同步；证据来自路由注册、JobFit Runtime、模型、迁移、前端路径、配置和 pytest。Decision 文档本身不构成实现或验证证据。
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
| `pending` | 已批准的验证或未来 Phase 尚未取得对应实现或运行证据；不能表述为已开始。 |
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
| BM25 检索 | implemented | 内置岗位 Rubric、Evidence 要求和题目策略片段可检索，并保存 source ID、分数和知识版本；P1 的受控后续追问会接收受限检索片段。 | `jobfit/retrieval.py`、`RetrievalTrace`、`jobfit/llm.py`。 |
| Working / Summary / Evidence Memory | implemented | 最近消息、每四轮摘要和持久化 Evidence 记忆可读取。 | `InterviewMemory`、Memory API、主流程测试。 |
| 能力边界与岗位匹配度 | implemented | 由有效 Evidence、能力等级、置信度和岗位权重计算。 | `JobFitService.generate_report`。 |
| 雷达图、优势/缺口、建议与报告 | implemented | 后端保存评分、能力边界、优势、缺口和 P0/P1/P2 建议；前端渲染报告。 | `AssessmentReport`、Reports API、`src/routes/reports.*`、主流程测试。 |
| 受控 LLM Follow-up Provider（JF-P1-01） | implemented | deterministic / OpenAI-compatible 后续追问 Provider、严格 JSON 输出校验、超时/Provider/无效输出语义、BM25 Prompt 上下文、P1 调用审计和 local/mock 测试均已观察到。验证范围为 V2（local/mock）。 | `backend/app/modules/jobfit/llm.py`、`JobFitService`、`LLMInvocation` migration、`backend/tests/jobfit/test_llm_provider.py`。 |
| Semantic Answer Evaluation（JF-P1-02） | implemented | 私有 `semantic_judgments` migration、严格版本化 Judgment Schema、仅接受 JSON float 的 confidence、deterministic 结构化基线、`LLMInvocation` 关联、原子失败与 `0006 → 0007 → 0006` 本地迁移生命周期均已验证。显式 openai_compatible Provider 只传输 synthetic/de-identified profile，不含原始 Candidate Answer、问题原文、岗位描述或候选人标识；当前只通过 mock/stub 验证。不存在命名真实 semantic Provider / V5 / production 运行证据。 | `backend/app/modules/jobfit/llm.py`、`models.py`、`service.py`、`20260909_0007` migration、`backend/tests/jobfit/test_semantic_judgment.py`。 |
| Intelligent Adaptive Follow-up（JF-P1-03） | partial | 同一 competency 的 P1-03 `base_focus` 已按服务端固定顺序 `personal_action → measurable_result → tradeoff → boundary → failure_handling` 优先消费 `missing_dimensions`，不受 Provider 数组排序控制；之后才处理 contradiction、低 confidence、Evidence、Summary Memory 与兜底。跨 competency 安全重置为 `personal_action`，不可信原文不进入题目，P0 action、difficulty、competency、状态、评分、Evidence 与公开 API 不变。P1-03 定向 7 项与完整后端 95 项回归均通过，范围为 V2（local/mock）；P1-03 自身不发送 external adaptive payload，真实 Provider / V5 / production 运行证据仍不存在。 | `backend/app/modules/jobfit/service.py`、`backend/tests/jobfit/test_adaptive_follow_up.py`、P1-02 Judgment contract。 |
| RAG Interview Reasoning（JF-P1-04） | partial | 已观察到内置 BM25 structured metadata、受信任 requirement grounding 与私有 `rag_reasoning_traces` migration；它只约束同一 P1-03 focus 下的题目依据，不改变 P0 / P1-03 controls。没有外部知识库、向量 RAG、外部 Provider 或 V5 / production 运行证据。 | `backend/app/modules/jobfit/retrieval.py`、`models.py`、`service.py`、`20260909_0008` migration、`backend/tests/jobfit/test_rag_reasoning.py`。 |
| Evidence + Boundary Hardening（JF-P1-05） | partial | 已观察到 private `evidence_boundary_judgments` migration、纯 deterministic strict payload、同能力项 whitelist focus override、最小化 trace 与 hardening failure 原子回滚；它不修改 P0 Evidence fields、AnswerAssessment、Report、状态、版本或公开 API。没有真实外部 Provider、外部事实核验、V5 或 production 运行证据。 | `backend/app/modules/jobfit/evidence_hardening.py`、`models.py`、`service.py`、`20260909_0009` migration、`backend/tests/jobfit/test_evidence_boundary_hardening.py`。 |
| production Provider 显式选择与 demo 准入（D-011 / JF-PS-01） | implemented | Settings 通过 `model_fields_set` 区分默认值与显式来源：production 缺少 `JOBFIT_LLM_PROVIDER` 时拒绝启动；explicit deterministic 仅在 explicit `JOBFIT_ALLOW_DEMO_PROVIDER=true` 时允许。development / test 默认行为、openai_compatible URL / HTTPS / 凭据校验与 fail-closed 均保持不变。验证范围为 V2（local/mock），不构成真实 Provider 或 production 运行证据。 | `backend/app/core/config.py`、`backend/tests/jobfit/test_llm_provider.py`、D-011。 |
| 真实外部 Provider Invocation / Production Validation | pending | 尚未直接观察到命名真实外部 Provider 的实际调用或生产运行证据。P1-01 的 V2 local/mock 不能升级为 V5、真实外部集成或 Production Ready。 | 无命名外部 Provider 运行观察；验证边界见 `progress.md` 的 P1-01 事件记录。 |
| 报告生成中状态（D-012：`REPORT_GENERATION`） | not_started | 枚举声明存在，但当前 `generate_report()` 只接受 `COMPLETED` 会话并同步创建或返回报告；未观察到写入、队列、恢复或异步生成转换。D-012 为 Accepted / Not Implemented / Not Verified 的预留状态。 | `backend/app/modules/jobfit/schemas.py`、`JobFitService.generate_report`、D-012。 |
| 会话失败终态（D-013：`FAILED`） | not_started | 枚举声明存在，但 Provider 故障只回滚本轮业务写入、追加最小失败 `LLMInvocation` 审计并返回既有 `AI_*` 错误；未观察到会话写入 `FAILED`。D-013 为 Accepted / Not Implemented / Not Verified 的预留状态。 | `backend/app/modules/jobfit/schemas.py`、`JobFitService.answer` 的 Provider 异常路径、D-013。 |
| 外部知识库或在线题库 | partial | 当前只有内置 BM25 语料，未观察到外部同步或可维护资料来源。 | `jobfit/retrieval.py`。 |

## 3. API、数据与兼容边界

- 当前 `/api/v1` Router 挂载认证与 JobFit 资源；精确请求、响应、错误、资源所有权与会话并发语义见 [implementation-plan.md](./implementation-plan.md) 的 P0 接口与契约基线。
- JobFit 领域迁移创建候选人/岗位画像、评估、面试、消息、回答评估、Evidence、记忆、检索轨迹、P1 专属 LLMInvocation、私有 SemanticJudgment、私有 RAGReasoningTrace、私有 EvidenceBoundaryJudgment 和报告实体；当前聚合列表由 Implementation Plan 的接口基线维护。P1-01 至 P1-05 不改变既有公开 API wire shape。
- Settings 以 `JOBFIT_*` 为主；当前后端 legacy 读取仅为 `HIRELINK_ENVIRONMENT`、`HIRELINK_LOG_LEVEL`、`HIRELINK_DATABASE_URL`、`HIRELINK_SQLITE_BUSY_TIMEOUT_MS`、`HIRELINK_JWT_SECRET` 与 `HIRELINK_AUTH_COOKIE_NAME`，前端兼容读取仅为 `VITE_HIRELINK_API_BASE_URL`。Provider 仅由服务端读取，没有 `HIRELINK_LLM_*` alias；其存在不证明旧 Runtime、导航或产品能力。D-011 的 production 显式选择准入已实现并完成 V2（local/mock）配置验证；真实 Provider 与 production 运行证据仍 pending。
- `out_of_scope` 能力的完整批准清单见决策 `D-005`，避免在此重复维护产品取舍。

## 4. 测试证据与限制

`backend/tests/auth_users/test_auth.py`、`backend/tests/contract/test_response_contract.py`、`backend/tests/jobfit/test_jobfit_flow.py`、`backend/tests/jobfit/test_llm_provider.py`、`backend/tests/jobfit/test_semantic_judgment.py`、`backend/tests/jobfit/test_adaptive_follow_up.py`、`backend/tests/jobfit/test_rag_reasoning.py` 与 `backend/tests/jobfit/test_evidence_boundary_hardening.py` 覆盖认证、统一响应契约、岗位模板权重、简历上传、画像、会话、Evidence、记忆、检索轨迹、报告、Provider URL/Prompt、严格输出、失败原子性、审计、幂等、生产默认密钥拒绝、D-011 的 production Provider / demo 显式来源准入，以及 P1-02 私有 Judgment、P1-03 whitelist focus / P0 Freeze、P1-04 trusted RAG grounding / injection guard 和 P1-05 私有 minimal hardening payload / focus override / atomicity / migration。

这些测试使用本地测试数据库、deterministic Runtime 与 mock/stub Provider。它们支持 P1-01 的 V2（local/mock）结论，
但不证明命名真实 LLM、外部知识库、浏览器语音识别质量、端到端浏览器旅程或 production 运行质量。现有测试已验证 D-011 的生产显式 Provider 准入，但不验证真实 Provider / production 观察，也不验证 D-012 / D-013 的未来预留状态工作流；后者仍分别为 Not Verified。每次实际执行结果、环境和验证级别由 [progress.md](./progress.md) 的事件记录引用，不由本文自行声明通过；P1 阶段边界见 [p1-implementation-protocol.md](./p1-implementation-protocol.md)。

# JobFit 决策登记

> 本文记录项目负责人已经批准、且会影响 JobFit 产品边界或文档权威关系的结论。
> 它不替代产品需求、架构、路线图、实施计划、运行进度或代码事实；当前 P0 接口与契约基线由
> [implementation-plan.md](./implementation-plan.md) 按 `D-008` 维护。
>
> 初始登记日期：2026-09-06。初始批准来源为项目负责人于 2026-09-06 对 JobFit 文档治理范围和产品边界的明确指示；后续已批准决策的来源与时间以各自条目为准。

## 使用规则

- `D-*` 是稳定身份，不因措辞调整、执行状态或后续文档重组而重编号。
- 每条记录只保存批准结论、理由、影响与同步位置；完整产品需求、技术结构和任务设计分别回到其所属主源。
- 新的产品、架构、契约或路线图取舍必须先获得明确批准，再追加新的 `D-*` 记录。
- 历史 HireLink 决策保留在归档和 Git 历史中，不重写为当前 JobFit 决策。

## 决策索引

| ID | 状态 | 主题 | 主要同步位置 |
| --- | --- | --- | --- |
| D-001 | approved | JobFit 岗位胜任力评估主线 | [prd.md](./prd.md) |
| D-002 | approved | 固定、确定性的 Interview Orchestrator 边界 | [prd.md](./prd.md)、[implementation-status.md](./implementation-status.md) |
| D-003 | approved | Evidence、BM25 与三层记忆的可追溯性 | [prd.md](./prd.md)、[implementation-plan.md](./implementation-plan.md) |
| D-004 | approved | 文本输入、浏览器语音转文字与数据最小化边界 | [prd.md](./prd.md)、[implementation-plan.md](./implementation-plan.md) |
| D-005 | approved | 旧招聘平台能力的 legacy / out_of_scope 处理 | [prd.md](./prd.md)、[roadmap.md](./roadmap.md) |
| D-006 | approved | 文档权威边界与 P1 任务准入 | [implementation-plan.md](./implementation-plan.md)、[progress.md](./progress.md) |
| D-007 | approved | FastAPI、SQLite 与模块化单体工程取舍 | [implementation-status.md](./implementation-status.md)、[architecture.md](./architecture.md) |
| D-008 | approved | P0 内容归纳、契约基线迁移与历史归档 | [implementation-plan.md](./implementation-plan.md)、[progress.md](./progress.md) |
| D-009 | approved | 真实 LLM Provider 的受控追问边界 | [architecture.md](./architecture.md)、[implementation-plan.md](./implementation-plan.md)、[progress.md](./progress.md) |
| D-010 | approved | P1 分阶段智能化升级协议与状态基线 | [p1-implementation-protocol.md](./p1-implementation-protocol.md)、[roadmap.md](./roadmap.md)、[progress.md](./progress.md) |
| D-011 | Accepted | 生产 Provider 显式选择与 deterministic 演示例外 | [architecture.md](./architecture.md)、[implementation-status.md](./implementation-status.md)、[progress.md](./progress.md) |
| D-012 | Accepted | `REPORT_GENERATION` 作为当前未实现的预留状态 | 本决策登记；后续报告工作流设计前必须重新决策 |
| D-013 | Accepted | `FAILED` 作为当前未实现的预留状态 | 本决策登记；未来失败分类与恢复设计前必须重新决策 |
| D-014 | approved | P1-02 结构化 Semantic Judgment 与确定性 Runtime 边界 | [implementation-plan.md](./implementation-plan.md)、[progress.md](./progress.md) |
| D-015 | approved | Current Baseline Browser Delivery Validation 边界 | [roadmap.md](./roadmap.md)、[implementation-plan.md](./implementation-plan.md)、[progress.md](./progress.md) |
| D-016 | approved | P1-03 受控语义焦点追问与固定 Runtime 边界 | [implementation-plan.md](./implementation-plan.md)、[progress.md](./progress.md) |
| D-017 | approved | P1-04 内置 BM25 Grounded Interview Reasoning 与私有 Trace | [implementation-plan.md](./implementation-plan.md)、[progress.md](./progress.md) |

## D-001：以岗位胜任力评估为唯一产品主线

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准。
- **结论**：JobFit 的主路径固定为：简历解析 → Candidate Competency Profile → Job Competency Profile → 多轮对话式面试 → Evidence Ledger → 能力边界识别 → 岗位匹配度评分 → 自动化评估报告。
- **理由**：候选人需要可解释的岗位能力反馈，而不是仅有简历关键词、单次问答或招聘流程状态。
- **影响**：PRD 以该闭环定义需求；Roadmap 只安排强化该闭环的阶段；报告结论必须可回溯到简历或面试 Evidence。

## D-002：Interview Orchestrator 采用固定、可追溯的编排

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准。
- **结论**：Interview Orchestrator 由会话状态、岗位模板、回答评估、Evidence 与版本控制约束，负责澄清、追问、情景题、难度调整、维度切换或结束；不定义为可自由决定目标或工具的多 Agent 平台。
- **理由**：岗位评估的过程、评分和追问需要可复现、可测试和可解释。
- **影响**：PRD 保留动态追问需求；Implementation Status 只按源码与测试证据说明已实现边界；未来真实 Provider 接入不得改变 Evidence 与会话可追溯性。

## D-003：证据链优先于黑箱结论

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准。
- **结论**：每轮回答应形成 Evidence Ledger；岗位 Rubric、Evidence 要求和题目策略可通过 BM25 检索；Working Memory、Summary Memory 与 Evidence Memory 共同保留必要上下文；报告的能力边界、匹配度和建议必须保留可追溯依据。
- **理由**：单一分数无法说明候选人在哪些能力维度已有证据、哪些仍需补充。
- **影响**：PRD 定义业务要求，Implementation Plan 的 P0 接口与契约基线定义读取和幂等语义，Implementation Status 用代码、迁移和测试路径说明当前实现证据。内置 BM25 不得表述为外部在线知识库或真实模型检索服务。

## D-004：只处理确认提交的文本，不建立音视频能力

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准。
- **结论**：多轮面试支持直接文字输入，也可接受浏览器语音转文字后由用户确认的文本；系统不上传、录制、保存或回放音频、视频、摄像头或行为数据。
- **理由**：保留易用的输入方式，同时维持数据最小化和可验证的文本评估边界。
- **影响**：`speech_to_text` 只表示文本来源；浏览器语音能力的实际可用性在 Implementation Status 中按 `frontend_demo` 处理，不构成媒体采集或后端语音能力。

## D-005：旧招聘平台域降级为 legacy 或 out_of_scope

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准。
- **结论**：AI 内推网络、企业人才运营、HR 招聘 CRM、智能招聘工作台、ATS 对接、真人面试预约、数字人、虚拟面试官、视频面试、WebRTC、摄像头监考、录音录像、音视频回放、高级反作弊、行为分析、可信面试强判定和岗位能力试炼不属于当前 JobFit 产品或路线图。
- **理由**：这些能力会把产品重新扩展为企业招聘运营或媒体面试平台，偏离岗位胜任力评估主线。
- **影响**：活动文档只能将相关名称写为 `legacy`、`out_of_scope`、兼容或历史事实；旧表、迁移、环境变量和归档文本不构成当前 Runtime 能力。

## D-006：以职责分离维护文档与任务准入

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准。
- **结论**：PRD 拥有产品目标，决策登记拥有批准取舍，Roadmap 拥有阶段顺序，Implementation Plan 拥有可执行任务，Progress 拥有运行状态，Implementation Status 拥有代码事实，Contracts 拥有 API/并发/兼容语义。`JF-P1-*` 在获得具体批准并写入 Plan 前仅为 Roadmap 方向。
- **理由**：避免同一事实在多个文档中被独立改写，进而产生状态漂移或把规划写成实现。
- **影响（现行部分）**：`JF-DOC-01` 是首个文档治理任务；三个 P0 辅助文档正式废弃但保留文件和追溯入口。
- **已被取代的历史表述**：本决策原先将 `p0-contracts.md` 作为因既有链接兼容而继续使用的活动契约文件；该部分已由 `D-008` 于 2026-09-06 取代。当前 P0 接口与契约基线唯一由 `implementation-plan.md` 承载，归档 `docs/archive/legacy-p0/p0-contracts.md` 仅供历史追溯。
- **修订记录**：`D-008` 于 2026-09-06 取代本决策中“独立 Contracts 文件拥有当前 API 契约”的部分；`D-006` 的其余职责边界和历史保持不变。

## D-007：采用 FastAPI 模块化单体与 SQLite 起步

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准；当前实现证据见 Settings、数据库 Session、迁移、Router 和测试。
- **结论**：JobFit 当前采用 FastAPI 模块化单体、Pydantic、SQLAlchemy、Alembic 与 SQLite。配置通过 `JOBFIT_*` 读取，SQLite 启用 foreign keys 和 busy timeout。
- **理由**：当前岗位胜任力评估 Runtime 需要可审计的 REST 边界、可版本化迁移、确定性本地测试和低运维复杂度；拆分微服务、引入异步 ORM 或外部基础设施不能提高当前 P0 闭环的可验证性。
- **影响**：数据模型变化仍必须通过 Alembic；未来在真实多用户负载、并发、后台任务或外部知识源需求具备直接证据后，才可重新评估 PostgreSQL、队列或其他基础设施，且不得把未来方向写为当前实现。

## D-008：归纳 P0 内容并归档旧文档

- **状态**：approved
- **来源**：项目负责人 2026-09-06 批准的 P0 内容归纳、链接迁移与历史归档指令。
- **结论**：`p0-contracts.md`、`p0-parallel-task-map.md`、`p0-integration-issues.md` 与 `p0-implementation-baseline.md` 的有效 JobFit 内容归入当前六文档体系；四份原文件移动至 `docs/archive/legacy-p0/`，不再作为活动主入口。
- **理由**：当前接口、任务、状态与工程取舍若同时由 P0 文件和当前文档维护，会形成相互冲突的事实源；归档能保留历史，同时让 JobFit 主线只有可继续维护的权威入口。
- **影响**：Implementation Plan 承载 P0 接口与契约基线、P0/P1 任务表和 `JF-DOC-02`；Progress 承载任务状态与风险；Implementation Status 仅承载代码事实；README、架构和当前主文档的链接必须离开根 `p0-*.md` 路径。归档中的旧 HireLink 内容只能作为历史，不得重新定义当前能力。

## D-009：真实 LLM Provider 的受控追问边界

- **状态**：approved。
- **批准人 / 时间**：项目负责人，2026-09-07。
- **来源与历史**：项目负责人在当前对话明确选择 `JF-P1-01` 的路径 A；本次同步记录时间为 2026-09-07T00:40:05+08:00。此前 P1-01 仅为 pending 方向，其 Provider、失败处理和运行证据决策均未冻结。
- **结论**：`JF-P1-01` 采用仅后端可调用的 OpenAI-compatible Chat Completions Provider。Provider 只生成与既定 `NextAction` 一致的下一问；固定 Interview Orchestrator 继续唯一决定回答评估、会话状态、能力切换、难度变化和结束条件，Evidence 验证、Memory 更新和 Report 评分保持既有确定性语义。
- **RAG 与 Prompt 边界**：首个开场问题保持确定性模板。从后续回答开始，Provider 只接收受控构造的既定动作、能力项、难度、候选人回答、当前 Summary / Evidence Memory 摘要，以及现有内置 BM25 的检索片段和知识版本。该检索仍是内置岗位资料，不等同于外部知识库或 `JF-P1-02` 的资料治理。候选人内容仅作为不可信上下文，不能改变动作、调用目标或系统边界。
- **失败与可追溯性**：当配置为 `openai_compatible` 时，超时、网络/Provider 错误或无效输出分别复用既有 `AI_TIMEOUT`、`AI_PROVIDER_ERROR`、`AI_INVALID_OUTPUT` 语义失败；该轮不得保存回答、Evidence、Memory 或 Report 变更。`deterministic` 仅是显式配置的开发/演示模式，不作为静默回退。后续实现增加 P1 专属、追加式 `LLMInvocation` 审计实体和迁移，记录会话/轮次/目的、Provider、模型、Prompt 版本、检索知识版本、状态、耗时和归类错误；不得记录密钥、Authorization header、完整 Prompt 或完整 Provider 错误正文。
- **验证与完成边界**：首期以本地 mock/stub 的受控调用契约验证为基础；真实外部 Provider 的 V5 运行证据必须在本地安全配置密钥后单独取得。本决策和后续 mock 验证均不构成真实外部调用、浏览器 E2E 或已实现状态的证据。
- **影响**：本决策冻结 P1-01 的 Provider、失败和审计边界，并同步到 Architecture、Implementation Plan 和 Progress。它不批准重写 Competency Model、Evidence Ledger、Memory、Report、自由决策型多 Agent、外部知识库、自由 JD 语义建模或浏览器 E2E。
- **后续协议注记**：`D-010` 于 2026-09-08 以新的、未实施的 P1 阶段协议取代此前 P1-02 至 P1-04 的规划身份；本条中对旧 P1-02 资料治理的引用仅保留为当时的历史语境，不改变 D-009 对 P1-01 的批准、实现边界或验证证据。

## D-010：P1 分阶段智能化升级协议与状态基线

- **状态**：approved。
- **批准人 / 时间**：项目负责人，2026-09-08。
- **来源**：项目负责人明确要求将 P1 分阶段协议、P1-01 的完成边界和后续 pending Phase 固化为 Markdown 文档基线。
- **结论**：`docs/p1-implementation-protocol.md` 成为 P1-01 至 P1-09 的正式阶段协议。`JF-P1-01` 当前为 `completed`、`V2（local/mock）`；真实外部 Provider Validation 和 Production Validation 均为 `pending`。`JF-P1-02` 至 `JF-P1-09` 均为 `pending`，本决策不授权启动其中任何一个实现。
- **理由**：Provider 实现、local/mock 验证、Roadmap、Plan 和面向读者文档若继续采用不同 P1 身份或验证结论，会把已实现的受控路径、真实外部验证和未来规划混为一谈。
- **边界**：P1 只在既有 P0 Runtime 上增量增强。LLM 提供语义理解与语言表达，固定 Deterministic Runtime 保持状态机、会话、Schema、版本、幂等、Evidence、评分、失败处理和报告公式的控制权。P0 Freeze、Decision Protocol 与 Out of Scope 以 P1 Protocol 为准。
- **影响**：Roadmap 同步阶段顺序，Implementation Plan 同步任务准入，Progress 同步状态索引，Implementation Status 同步代码事实，Architecture 和 README 同步当前边界。保留 D-009 与 P1-01 不可变事件；不修改 Python、前端、Runtime、数据库、迁移、API 或 Provider 实现。

## D-011：生产 Provider 显式选择与 deterministic 演示例外

- **日期**：2026-09-08。
- **状态**：Accepted。
- **来源**：项目负责人于本轮 Provider Safety 决策闭环中明确选择候选方案 B。
- **Context**：当前 `Settings` 默认 `llm_provider="deterministic"` 且 `allow_demo_provider=True`。现有生产校验只在 deterministic 且 demo 许可关闭时拒绝启动，因此生产环境在未显式配置 Provider 时仍可能以 deterministic 启动。`D-009` 已冻结 OpenAI-compatible 的 fail-closed 语义和“deterministic 不得静默回退”的边界，但未唯一确定生产环境的显式配置准入规则。
- **Decision**：development / test 未配置 Provider 时可以默认使用 deterministic。production 必须显式配置 `JOBFIT_LLM_PROVIDER`，未配置即启动失败；若生产显式选择 deterministic，还必须同时显式设置 `JOBFIT_ALLOW_DEMO_PROVIDER=true`。OpenAI-compatible 的配置错误、超时、调用失败或无效输出继续 fail-closed，禁止自动降级为 deterministic。任何 deterministic 运行只能标记为 demo/mock scope，不构成真实外部 Provider 集成或 Production Ready 证据。
- **Alternatives Considered**：A. 生产环境完全禁止 deterministic；安全边界最强，但无法支持明确隔离的生产演示。B. 采用本决策的显式演示例外；保留开发、测试和受控演示可用性，同时拒绝无意的生产默认值。C. 保留当前默认行为，仅禁止 Provider 运行失败后的 fallback；迁移成本最低，但不能保证生产 Provider 是有意选择的。
- **Consequences**：部署配置将成为生产启动的必需输入；显式演示场景必须同时表达 Provider 与 demo 许可。Provider 失败后的事务与审计语义仍以 D-009 为准，不新增降级路径。
- **Compatibility / Migration Impact**：development / test 的默认 deterministic 行为保持兼容。现有生产部署必须显式设置 `JOBFIT_LLM_PROVIDER`；若继续使用 deterministic，必须补充显式 `JOBFIT_ALLOW_DEMO_PROVIDER=true`，否则未来实现应拒绝启动。无需数据库、API 或数据迁移。
- **Implementation Status**：Implemented。`Settings.validate_secure_runtime()` 通过 `model_fields_set` 区分默认值与显式 Settings 来源；production 缺少 `JOBFIT_LLM_PROVIDER` 时拒绝启动，显式 deterministic 仅在显式 `JOBFIT_ALLOW_DEMO_PROVIDER=true` 时允许。
- **Verification Status**：V2（local/mock）。配置矩阵、Provider fail-closed 回归、完整后端 pytest、Ruff、Mypy 与安全静态扫描均已执行；未调用真实 Provider，未取得 production 或 V5 运行证据。
- **后续实现任务或阻塞关系**：`JF-PS-01` 已完成本地配置安全实现与验证。真实 Provider V5、production 观察、部署和任何启用 D-012 / D-013 预留状态的工作仍须作为独立任务与证据处理。
- **Supersedes / Superseded By**：不取代 D-009；本决策补充其生产配置准入边界。当前未被后续决策取代。

## D-012：`REPORT_GENERATION` 作为当前未实现的预留状态

- **日期**：2026-09-08。
- **状态**：Accepted。
- **来源**：项目负责人于本轮 Provider Safety 决策闭环中明确选择候选方案 B。
- **Context**：`InterviewStatus` 声明了 `REPORT_GENERATION`，但当前同步 `generate_report()` 流程只接受 `COMPLETED` 会话并直接创建或返回报告；未观察到该状态的写入、后台任务、异步生成、恢复队列或报告生成中 API 语义。
- **Decision**：`REPORT_GENERATION` 明确为当前 Runtime 未实现的预留状态。当前报告生成继续以 `COMPLETED` 为唯一可生成报告的会话终态；在完成独立的报告工作流设计、状态转换、失败/重试/恢复语义和验证前，不得将 `REPORT_GENERATION` 表述为当前实际进入的状态。
- **Alternatives Considered**：A. 立即使当前 Runtime 进入 `REPORT_GENERATION`；可为将来的异步工作流铺路，但需要先定义持久化中间态、恢复、幂等和 API 可见语义。B. 采用本决策的预留状态；如实保持当前同步行为并保留未来扩展点。C. 移除该枚举值；可缩小当前类型面，但会产生不必要的兼容性收缩，并在未来重新引入时增加治理成本。
- **Consequences**：当前会话状态机不新增转换，报告生成失败仍沿用现有异常处理边界；`REPORT_GENERATION` 不得用于证明报告正在异步生成、可恢复或已实现对应 Runtime 能力。
- **Compatibility / Migration Impact**：当前 API、数据库、会话记录和报告生成行为保持不变，无需数据或数据库迁移。未来若启用该状态，必须先完成独立决策并明确客户端兼容、版本、并发和恢复策略。
- **Implementation Status**：Not Implemented。当前未新增使 Runtime 显式识别或保护预留状态的代码；已观察到的“不进入该状态”仅是现状事实，不等同于本决策已被代码实现。
- **Verification Status**：Not Verified。未执行新的状态机或报告流程验证。
- **后续实现任务或阻塞关系**：任何将报告生成改为异步、长耗时或可恢复工作流的实现，都被本决策阻塞，直至相应状态与兼容性决策被批准并同步到接口契约、实施计划和测试。
- **Supersedes / Superseded By**：不取代既有决策；当前未被后续决策取代。

## D-013：`FAILED` 作为当前未实现的预留状态

- **日期**：2026-09-08。
- **状态**：Accepted。
- **来源**：项目负责人于本轮 Provider Safety 决策闭环中明确选择候选方案 B。
- **Context**：`InterviewStatus` 声明了 `FAILED`，但当前 Runtime 未将会话持久化为该状态。OpenAI-compatible Provider 的超时、网络/HTTP 错误或无效输出会回滚本轮 Candidate Answer、Evidence、Answer Assessment、Memory、RetrievalTrace、Report 与 Session Version 变更，仅追加最小 `LLMInvocation.status="failed"` 审计记录，并返回既有 `AI_*` 异常；此前已持久化的会话状态通常保持为 `WAITING_FOR_ANSWER`。`D-009` 已冻结 fail-closed 与非敏感审计边界，但未定义此类调用失败是否应终止整个会话。
- **Decision**：`FAILED` 明确为当前 Runtime 未实现的预留状态。当前 Provider 故障继续 fail-closed：不保存本轮业务写入、不自动降级到 deterministic、保留最小调用失败审计并返回既有异常；会话保持此前可重试状态。除非未来完成独立的失败分类、终态条件、恢复/重试、版本、报告限制和 API 语义设计，否则不得将 `FAILED` 表述为当前实际持久化的会话终态。
- **Alternatives Considered**：A. 将 `FAILED` 作为持久化 Runtime 终态；可表达不可恢复会话失败，但需要先定义故障分类、恢复和客户端语义。B. 采用本决策的预留状态；使短暂 Provider 故障继续由异常与调用审计表达，并与当前可重试行为一致。C. 移除该枚举值；可缩小当前类型面，但会不必要地收缩未来扩展空间，并增加未来重新引入时的兼容性成本。
- **Consequences**：fail-closed 不等于会话终止。`LLMInvocation` 继续是内部 Provider 调用审计实体，不成为公开业务聚合；会话状态机不新增 Provider 故障到 `FAILED` 的转换。
- **Compatibility / Migration Impact**：当前 API、数据库、会话记录、调用审计和用户重试行为保持不变，无需数据或数据库迁移。未来若启用 `FAILED`，必须先完成独立决策并明确错误分类、用户可见恢复、版本和客户端兼容策略。
- **Implementation Status**：Not Implemented。当前未新增使 Runtime 显式识别或保护预留状态的代码；已观察到的“不进入该状态”仅是现状事实，不等同于本决策已被代码实现。
- **Verification Status**：Not Verified。未执行新的失败状态机或恢复流程验证。
- **后续实现任务或阻塞关系**：任何将 Provider、报告或其他 Runtime 异常持久化为会话 `FAILED` 终态的实现，都被本决策阻塞，直至相应失败分类、恢复语义、接口契约、实施计划和测试获得批准并同步。
- **Supersedes / Superseded By**：不取代 D-009；本决策补充其调用失败的会话状态边界。当前未被后续决策取代。

## D-014：P1-02 结构化 Semantic Judgment 与确定性 Runtime 边界

- **日期**：2026-09-09。
- **状态**：approved。
- **来源**：项目负责人明确批准 `JF-P1-02` 先于 `JF-P1-03` 实施，并确认本决策的持久化、Provider、失败与 P0 Freeze 边界。
- **Decision**：`JF-P1-02` 新增仅后端可访问的、版本化 `semantic_judgments` 实体和独立 Alembic migration。每个成功 Judgment 关联 source answer、session、question、competency 与对应 `LLMInvocation`，并保存 `schema_version`、`prompt_version`、provider、model、受限结构化 payload 与创建时间。它是 LLM Semantic Evaluation 的中间判断，不是第二套 `AnswerAssessment`，也不得替代或改写 P0 最终评分。
- **Provider / Schema**：Semantic Evaluation 复用现有服务器端 `JOBFIT_LLM_PROVIDER` 的 Provider 选择、安全配置、timeout 和基础 fail-closed 设施，但使用与 Follow-up `{"question":"..."}` 完全分离的严格 Semantic Judgment JSON Schema。显式 deterministic 模式使用可追溯的本地确定性结构化基线；项目负责人已授权显式 openai_compatible 的 semantic path，但其外部 payload 只能是本地构造的 synthetic/de-identified profile，不得包含原始 Candidate Answer、问题原文、岗位描述或候选人标识。Provider 错误或无效输出不得静默降级。
- **P0 Freeze**：P1-02 不改变 `AnswerAssessment` 最终评分、Evidence persistence / validation、Interview State Machine、Session lifecycle / version / idempotency、Competency switching、结束条件或 Report scoring / formula。Semantic Judgment 当前只完成 Candidate Answer → Semantic Evaluation → strict validation → private persistence → minimal audit；其用于针对性追问的行为由后续 `JF-P1-03` 在消费已冻结契约后单独定义。`JF-P1-04` 不在本决策中预设字段或实现。
- **Failure / Privacy**：openai_compatible 的 timeout、Provider / HTTP error 或无效 Schema 输出复用既有 `AI_*` 语义。所有失败均 fail-closed：不写入该轮 answer、SemanticJudgment、Evidence、AnswerAssessment、Memory、RetrievalTrace、Report 或 Session Version，仅追加最小失败 `LLMInvocation` 审计。审计和 Judgment 不得保存 API key、Authorization、完整 Prompt、完整原始 Provider response 或错误正文；mock/stub 验证使用 synthetic/de-identified 文本，真实网络与 V5 观察仍需独立执行。
- **Compatibility / Migration Impact**：允许且要求 P1 专属 migration；不重构、迁移或重算 P0 tables / 历史数据，不新增公开 API、前端读取、外部知识库或独立 Semantic Provider 配置。
- **Verification / Gate**：A1 已由本次项目负责人授权满足。V2（local/mock）已覆盖严格 Schema、成功持久化、调用关联、确定性回归、synthetic/de-identified OpenAI-compatible mock、失败原子性、幂等 / 旧题保护、migration upgrade / downgrade 与安全数据最小化测试。真实网络调用与 production / V5 观察均为 pending。A2 未触发：公开语义与 P0 owner 未改变；A3 不适用。
- **Supersedes / Superseded By**：不取代 D-009、D-010 或 D-011；为 `JF-P1-02` 提供 phase-specific 执行边界。当前未被后续决策取代。

## D-015：Current Baseline Browser Delivery Validation 边界

- **日期**：2026-09-09。
- **状态**：approved。
- **来源**：项目负责人明确批准 `JF-DLV-05` 作为独立的非 P1 基线交付验证任务，并要求保留 `JF-P1-09 → JF-P1-08` 的既有依赖。
- **Decision**：`JF-DLV-05` 只验证当前已实现的 JobFit 主路径：fresh-clone 依赖安装、默认 SQLite migration / 启动、前端生产构建，以及候选人的本地人工 Browser Golden Journey。它不属于 `JF-P1-09`，不改变 P1-02 至 P1-09 的状态、顺序、依赖或完成口径。
- **Scope / Privacy**：验证使用本地 deterministic Runtime、合成简历与演示账号。浏览器语音转文字仅将用户确认后的文本以既有 `speech_to_text` 标记提交；不得上传、录制、保存、回放或处理音频、视频、摄像头或行为数据。
- **Compatibility / Migration Impact**：允许为文件型 SQLite URL 自动创建数据库父目录，以修复 fresh clone 默认 `backend/data/` 缺失导致 migration 失败的问题；不改变默认数据库 URL、Alembic 链、公开 API、数据模型或历史数据。前端只修复既有 `input_method` 来源透传，不新增 wire shape。
- **Verification / Gate**：A1 已由本次项目负责人授权满足。机械检查最多分别证明 V1 / V2 / V3；只有在指定本地浏览器中完成登录、评估、至少八轮面试、一次真实语音转文字确认、降级文本回退和报告生成的人工观察后，才可记录 V4（local / manual）。A2 在机器验证后复核；A3 不适用，除非发生提交、发布、部署或生产操作。
- **P1 Isolation**：`JF-P1-09` 继续依赖 `JF-P1-08`。`JF-DLV-05` 的通过不得被描述为 Browser E2E / Demo Validation Phase 已完成，也不得证明真实 Provider、production、通用浏览器兼容性或后续 P1 Runtime。
- **Supersedes / Superseded By**：不取代 D-004、D-010 或 D-014；当前未被后续决策取代。

## D-016：P1-03 受控语义焦点追问与固定 Runtime 边界

- **日期**：2026-09-09。
- **状态**：approved。
- **来源**：项目负责人要求在已冻结的 `JF-P1-02` 输出契约后实施 `JF-P1-03`，并明确 LLM 不得接管 Competency Switching、Interview End、最终评分或 Session State。项目负责人于 2026-09-09 明确选择：同一 competency 的 P1-03 `base_focus` 采用服务端固定的缺失维度优先顺序。
- **Decision**：`JF-P1-03` 只在既有固定 `NextAction`、目标 competency 和 difficulty 已由 deterministic Runtime 决定后，使用当前 Candidate Answer 的私有 Semantic Judgment、既有 Evidence Memory、Summary Memory 是否存在和 Competency Context，选择一个受白名单约束的追问焦点，并据此构造下一题的 deterministic template。同一 competency 时，先从 `missing_dimensions` 集合按服务端固定顺序 `personal_action → measurable_result → tradeoff → boundary → failure_handling` 选择 `base_focus`，再处理 contradiction、低 confidence、Evidence、Summary Memory 和兜底规则；切换 competency 时安全重置为 `personal_action`。该规则只约束 P1-03 `base_focus`，不重排 P1-04，也不修改后续阶段的独立 effective-focus policy。它不新增第二套 Semantic Judgment、Memory、Evidence 或公开 API。
- **Trust Boundary**：只允许消费 Semantic Judgment 的枚举化 `missing_dimensions`、是否存在 contradiction 和 bounded confidence；Provider 返回的缺失列表顺序不拥有控制权。不得将 LLM summary、contradiction detail、候选人原文、Memory 原文或外部资料原文直接插入用户可见题目。追问文字只能由服务端固定模板、当前能力项和 whitelist focus 组成。这样 Prompt injection 或不可信语义输出不能改变题目以外的 Runtime，也不能注入任意文本。
- **P0 Freeze**：`_assess()`、`_decide()`、State Machine、Session lifecycle / version / idempotency、Evidence persistence / validation、difficulty、Competency Switching、Interview End、Report scoring / formula 继续由 deterministic Runtime 唯一控制。P1-03 不新增 action 枚举，不改变已决定的 action；只改变该 action 下的下一问焦点与措辞。
- **Provider / External Gap**：显式 deterministic 模式完整支持本地受控自适应模板。P1-03 自身不发起 external adaptive request；P1-02 的显式 openai_compatible semantic path 仅传输 synthetic/de-identified profile。真实 Provider 的 adaptive prompt 扩展、命名真实网络观察与 V5 / production 验证仍需单独决策。
- **Compatibility / Verification**：不新增 migration 或前端 / HTTP contract；沿用私有 `SemanticJudgment`、既有 `InterviewMessage.question_strategy` 与 `LLMInvocation` 追溯。本轮 V2（local/mock）已验证 server-ordered missing-dimension base-focus：不同 missing / contradiction / memory / evidence 输入生成不同的白名单焦点，action / difficulty / competency / state / scoring 不变，重复请求与旧题不重复触发，且 semantic evaluation 不可用时阻断 follow-up。P1-03 定向 7 项与完整后端 95 项 pytest 均通过。A1 已满足；A2 已由本轮项目负责人对题目焦点优先级的明确选择解决；A3 不适用。真实 Provider、外部网络和 V5 / production 仍 blocked / pending。
- **Supersedes / Superseded By**：不取代 D-014；P1-03 只消费其冻结 contract。当前未被后续决策取代。

## D-017：P1-04 内置 BM25 Grounded Interview Reasoning 与私有 Trace

- **日期**：2026-09-09。
- **状态**：approved。
- **来源**：项目负责人此前选择 P1-04 采用“内置 BM25 + 内部追溯”，并要求在 P1-02 / P1-03 实现后基于实际冻结的 Semantic Judgment 与 Follow-up Context 定义 P1-04。
- **Decision**：`JF-P1-04` 只使用现有、版本化的内置岗位模板 BM25，不引入外部知识库、向量数据库、在线资料同步、自由 JD 语义建模或新公开 API。RAG 在 P1-03 已确定 whitelist focus 后，从同岗位 / 同能力项的已检索资料中选取受信任的 Evidence Requirement，以 grounded template 补充当前下一问，并私有持久化该 reasoning 的 source ids、scores、knowledge version、focus、requirement、source answer 与 SemanticJudgment 关联。
- **P0 / P1-03 Freeze**：RAG 只能影响同一已决定 action 下的追问依据和题目措辞。它不得修改 `_assess()`、`_decide()`、NextAction、difficulty、competency switching、session lifecycle / version / idempotency、Evidence persistence / validation、Report scoring / formula，也不得创建第二套 Semantic Judgment 或 Follow-up Context。P1-03 的 whitelist focus 是 P1-04 的输入，不被 RAG 覆盖。
- **Trust / Privacy Boundary**：用户可见题目只能使用内置岗位模板中受信任、长度受限的 Evidence Requirement；不得写入 Candidate Answer、LLM summary、contradiction detail、Memory 原文、检索 chunk 全文或外部资料原文。`rag_reasoning_traces` 仅后端内部使用，不新增 Router / DTO；审计不得保存完整 prompt、完整 answer、API key、Authorization、Provider response 或错误正文。
- **External Gap**：P1-04 不增加外部调用。P1-02 的显式 openai_compatible semantic path 仅传输 synthetic/de-identified profile；P1-04 的 external RAG、命名真实 Provider、V5 与 production 观察均不在本决策范围内。
- **Compatibility / Verification**：允许独立 P1 migration 创建 private trace；不修改 P0 tables 或历史数据。V2（local/mock）已证明内置 BM25 source / knowledge version 参与 template grounding 并留存 private trace，RAG 仅改变同 action 下的 trusted requirement，不影响 P0 actions / scores / state，失败 / 幂等 / 旧题保护保持，且没有外部请求。A1 已满足；A2 未触发（无公开或 P0 语义变化）；A3 不适用。外部 RAG / Provider、V5 / production 仍 blocked / pending。
- **Supersedes / Superseded By**：不取代 D-014 或 D-016；只消费两者的冻结输入。当前未被后续决策取代。

## D-018：P1-05 私有 Evidence / Boundary Hardening 与受控追问

- **日期**：2026-09-09。
- **状态**：approved。
- **来源**：项目负责人明确批准 `JF-P1-05` 实施计划，并选择“受控追问层”与“仅当前回答文本”的核验边界。
- **Decision**：`JF-P1-05` 新增仅后端可访问、版本化的 `evidence_boundary_judgments` 及独立 Alembic migration。每个成功判断唯一关联 source answer、session、question、competency、既有 `CompetencyEvidence` 与私有 `SemanticJudgment`，并保存 schema / policy version、P1-03 base focus、最终 effective focus、是否实际覆盖及受限结构化 payload。它不是第二套 `AnswerAssessment` 或 `CompetencyEvidence`，也不得重算或改写 P0 结果。
- **Policy / Trust Boundary**：纯 deterministic policy 只读取当前 Candidate Answer、既有 P0 assessment signal 与同轮 strict Semantic Judgment。Evidence strength 仅将既有 P0 strength 映射为 `weak`、`partial`、`sufficient`；Ownership 仅表示当前文本是否展示第一人称归属与明确行动；Contradiction 仅投影 strict Judgment 的受限 kind；Boundary 仅识别当前文本中受限的边界、约束、取舍或故障恢复信号。所有“not_demonstrated”或“needs_clarification”均表示需要澄清，绝不声称候选人陈述为假。
- **Follow-up Boundary**：只有 P0 已决定继续同一 competency 时，P1-05 才在 P1-03 已选择的 whitelist focus 上按固定优先级选择既有 focus：contradiction → `boundary`，ownership 缺失 → `personal_action`，strength 未达 sufficient → `measurable_result`，boundary 缺失 → `boundary`。若 P0 切换 competency 或结束面试，P1-05 记录为未覆盖并保留既有流程。它不新增 action、focus 枚举、Router、DTO 或前端读取；P1-04 继续只用最终 whitelist focus 与 trusted requirement 构造题目。
- **Privacy / Failure**：新增 payload 只能保存 enum、threshold band 和固定 reason code，不得保存 Candidate Answer、Evidence signal 副本、LLM summary、contradiction detail、Prompt、Provider response、API key、Authorization 或错误正文。Hardening 的严格构造或持久化失败必须使本轮 fail-closed；不允许静默绕过追溯或写入部分业务数据。P1-05 不增加 Provider、网络、外部 RAG 或外部数据处理调用。
- **P0 Freeze / Compatibility**：`AnswerAssessment`、`CompetencyEvidence` 的 strength / polarity / verified / supported_level、Evidence persistence / validation、State Machine、Session lifecycle / version / idempotency、competency switching、结束条件、Report scoring / formula 和现有 HTTP wire shape 保持不变。允许且要求只创建 P1 专属表，不重构、迁移或重算 P0 tables / 历史数据。
- **Verification / Gate**：A1 已由项目负责人本轮批准满足。V2（local/mock）已覆盖严格 payload、同能力项 focus override、P0 freeze、隐私最小化、hardening failure 原子回滚、duplicate / stale protection、`0008 → 0009 → 0008` migration 与 security scan；定向相邻回归 53 passed，完整后端 pytest 90 passed，Ruff、Mypy（60 source files）与 `git diff --check` 通过。A2 未触发：D-018 已批准唯一的 user-visible focus 调整，且公开 API / P0 语义保持不变；A3 不适用，未执行部署、发布、production migration 或真实外部数据服务操作。真实 Provider、外部数据处理服务、V5 / production 观察仍 blocked / pending。
- **Supersedes / Superseded By**：不取代 D-014、D-016 或 D-017；P1-05 只消费其冻结的 Semantic Judgment、Follow-up focus 和 grounded template 输入。当前未被后续决策取代。

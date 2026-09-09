# JobFit 实施计划

> 本文是当前可执行工程任务的唯一计划主源。它定义任务、依赖、完成条件、验证和风险；不记录实时
> 状态，也不替代产品需求、决策登记、路线图或实现状态。经 `D-008` 批准，本文同时承载当前
> JobFit P0 接口与契约基线，替代已归档的 `p0-contracts.md` 活动入口。
>
> 建立日期：2026-09-06。当前计划基线：项目负责人于 2026-09-06 批准的 P0 内容归纳、链接迁移
> 与历史归档范围、项目负责人于 2026-09-07 通过 `D-009` 批准的 `JF-P1-01` 路径 A 边界，以及
> 2026-09-08 通过 `D-010` 批准的 P1 分阶段升级协议。

## 使用规则

- 新任务必须先在本文定义，再由 [progress.md](./progress.md) 记录运行状态。
- `status_initial` 是任务的初始规划元数据，不能被当作当前状态。
- `status_initial` 不等于当前运行状态。`JF-P1-01` 的历史初始状态为 `pending`，当前 `completed / V2（local/mock）` 状态只以 Progress 为准。
- `JF-P1-02` 至 `JF-P1-09` 是正式 `pending` Phase，尚未成为可执行实现任务；其阶段目标与准入见 [p1-implementation-protocol.md](./p1-implementation-protocol.md)，进入实施前必须补齐该 Phase 的具体任务卡。
- 产品目标由 [prd.md](./prd.md) 定义，已批准取舍由 [architecture-decisions.md](./architecture-decisions.md) 记录，代码事实由 [implementation-status.md](./implementation-status.md) 证明。
- 当前资源接口、输入 Schema、错误、会话状态、幂等和配置兼容基线见“P0 接口与契约基线”；代码是否实际存在仍只由 Implementation Status 的源码、迁移和测试证据证明。

## 已批准任务图

| Task ID | 阶段 | 依赖 | 执行顺序 | 并行关系 | 初始状态 |
| --- | --- | --- | --- | --- | --- |
| JF-DOC-01 | Documentation Governance | none | 1 | none；共享文档主源，必须串行 | pending |
| JF-DOC-02 | Documentation Governance | JF-DOC-01 | 2 | none；迁移主文档、归档与链接必须串行 | pending |
| JF-P0-01 | P0（历史导入） | none | historical | 不作为新并行任务 | historical completed |
| JF-P0-02 | P0（历史导入） | JF-P0-01 | historical | 不作为新并行任务 | historical completed |
| JF-P0-03 | P0（历史导入） | JF-P0-01、JF-P0-02 | historical | 不作为新并行任务 | historical completed |
| JF-P0-04 | P0（历史导入） | JF-P0-03 | historical | 不作为新并行任务 | historical completed |
| JF-P0-05 | P0（历史导入） | JF-P0-04 | historical | 不作为新并行任务 | historical completed |
| JF-P0-06 | P0（历史导入） | JF-P0-01 至 JF-P0-05 | historical | 不作为新并行任务 | historical completed |
| JF-P1-01 | P1 | JF-P0-04、D-009 | after D-009 | 已完成；后续 Phase 默认不并行启动 | pending |
| JF-PS-01 | Provider Safety（P1 非阶段性 hardening） | JF-P1-01、D-009、D-011 | after D-011 SSoT sync | 与会改动 Settings 的任务串行 | pending |
| JF-P1-02 | P1 | JF-P1-01、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |
| JF-P1-03 | P1 | JF-P1-02、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |
| JF-P1-04 | P1 | JF-P1-03、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |
| JF-P1-05 | P1 | JF-P1-04、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |
| JF-P1-06 | P1 | JF-P1-05、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |
| JF-P1-07 | P1 | JF-P1-06、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |
| JF-P1-08 | P1 | JF-P1-07、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |
| JF-P1-09 | P1 | JF-P1-08、D-010 | after phase-specific approval | 默认串行；未形成可执行任务卡 | pending |

## JF-DOC-01：决策与进度文档体系重组

| 字段 | 定义 |
| --- | --- |
| `task_id` | `JF-DOC-01` |
| `phase` | Documentation Governance；不改变 JobFit P0/P1 产品阶段。 |
| `summary` | 将 JobFit 的产品决策、实施计划、运行进度、代码事实与公共契约分离为可追溯的文档主源。 |
| `status_initial` | `pending` |
| `depends_on` | `none` |
| `execution_order` / `parallel_with` | `1` / `none`。所有改动共同影响文档事实源，使用单一 `documentation-governance` 执行 lane。 |
| `source_requirement` | 2026-09-06 项目负责人批准的文档治理请求；产品边界见 [prd.md](./prd.md)。 |
| `source_decision` | `D-001` 至 `D-006`，见 [architecture-decisions.md](./architecture-decisions.md)。 |
| `spec_or_contract` | 文档职责边界见本文与决策 `D-006`；原活动契约快照见[归档 p0-contracts.md](./archive/legacy-p0/p0-contracts.md)。 |
| `architecture_or_adr` | `N/A`：本任务不修改 [architecture.md](./architecture.md)、代码、数据模型或系统边界。 |
| `expected_result` | PRD、决策登记、Roadmap、Implementation Status、Contracts、Implementation Plan 与 Progress 各自拥有唯一职责；三个重复 P0 文档保留文件但正式废弃。 |
| `changed_files` | `docs/prd.md`、`docs/roadmap.md`、`docs/implementation-status.md`、`docs/architecture-decisions.md`、`docs/p0-implementation-baseline.md`、`docs/p0-parallel-task-map.md`、`docs/p0-contracts.md`、`docs/p0-integration-issues.md`、`docs/implementation-plan.md`、`docs/progress.md`。 |
| `acceptance_criteria` | 仅上述十份文件发生本任务改动；每类信息只有一个权威归宿；`JF-DOC-01` 在 Plan 定义、在 Progress 记状态；P0 遗留文件均含 deprecated、替代主源和归档建议；旧 HireLink 招聘能力不再被写成当前或计划功能；所有本地 Markdown 链接可解析。 |
| `validation` | 检查目标文件范围、`git diff --check`、本地 Markdown 相对链接检查、关键术语上下文检查、源码路径抽查；在 `backend/` 运行 `uv run pytest`，并记录环境、结果与限制。 |
| `required_verification_level` | 文档结构与链接为 `V1`（本地静态检查）；实现状态中的受测主链路以本地 pytest 的 `V2` 作为支持证据，不宣称 E2E、生产或真实外部 Provider 验证。 |
| `gate` | A1：不触发代码/系统边界变更，文档治理范围已获项目负责人批准；A2：验证后确认无未决用户可见行为；A3：不适用，无合并、发布、部署或迁移。 |
| `risk` | 目标文件在开始前已处于未提交状态；不得用 reset、checkout、stash 或全局替换覆盖其内容。后续 `D-008` 已批准归档 P0 文件并修复活动链接。 |
| `rollback` | 仅对本任务产生的十份文档使用局部反向补丁或基于 `git diff` 的逐文件回退；不回退或改写开始前已有的用户工作。 |
| `superseded_by` | `none` |

## Planning Impact：P0 内容归纳与历史归档

项目负责人于 2026-09-06 批准将四份 `p0-*` 文档的有效 JobFit 内容迁入当前六文档体系，并将原文移动至 `docs/archive/legacy-p0/`。该决定由 `D-008` 记录，并取代 `D-006` 中“独立 Contracts 文件拥有当前 API 契约”的部分。

- `JF-DOC-01` 保持 completed 历史，不回写其 Task 定义、事件或证据。
- `JF-DOC-02` 是本轮文档迁移、链接修复和归档的唯一执行任务。
- `JF-P0-*` 为历史规划任务导入；其当前代码证据见 Implementation Status，原始执行时间和详细事件不可追溯时必须在 Progress 标注限制。
- `JF-P1-*` 进入正式 pending 计划，但任何实现仍需满足各自的需求、契约、架构、验证和 Gate 条件。

## P0 接口与契约基线

### 通用响应、认证与所有权

- 当前 JobFit 资源位于 `/api/v1`，成功响应使用 `success/data/meta`，失败响应使用 `success/error/meta`；`meta` 包含 `request_id`、UTC `timestamp` 与可为空的 `pagination`。
- `/api/v1/auth` 管理注册、登录、退出和当前用户；会话令牌为 HttpOnly Cookie。
- 简历、候选人画像、岗位画像、评估、会话和报告必须经过资源所有权校验。历史角色和 `HIRELINK_*` 配置只作 legacy 兼容，不能定义当前招聘工作流。

### 当前资源与输入边界

| 资源 | 接口或输入基线 | 关键语义 |
| --- | --- | --- |
| 胜任力模板 | `GET /competency-profiles`、`GET /competency-profiles/{role}` | 当前 role 为 `ai_engineer`、`java_engineer`、`product_manager`。 |
| 简历与候选人画像 | `POST /resumes/upload`、`GET /resumes`、`GET /resumes/{id}`、`POST /candidate-profiles`、`GET /candidate-profiles/{id}` | 上传仅接受受控 PDF、DOCX、TXT；画像创建输入为 `resume_id`。 |
| 岗位画像与评估 | `POST /job-profiles`、`GET /job-profiles/{id}`、`POST /assessments`、`GET /assessments/{id}` | 岗位画像输入为 `job_role`、2–160 字符 `title`、最多 30000 字符 `jd_text` 和 1–5 `difficulty`；JD 文本不等同于自由能力模型生成。 |
| 面试会话 | `POST /interview-sessions`、查询、`start`、`answers`、`complete` 子资源 | Assessment 创建唯一会话；回答输入包含当前 `question_id`、1–12000 字符文本、`input_method`、8–80 字符 `client_request_id` 和 `expected_session_version`。 |
| Evidence、Memory、Retrieval | `GET .../evidence`、`memory`、`retrieval-traces` | 返回 Evidence、三层记忆与 BM25 source ID/分数/知识版本。 |
| 报告 | `POST .../report`、`GET /reports`、`GET /reports/{id}` | 仅 `COMPLETED` 会话可生成；重复生成返回同一报告。`REPORT_GENERATION` 不是当前报告 API 会进入的状态。 |

### 会话、并发、错误与实体

- 当前 Runtime 使用 `PREPARING`、`ASKING`、`WAITING_FOR_ANSWER`、`EVALUATING`、`DECIDING` 与 `COMPLETED`。`REPORT_GENERATION` 是 D-012 Accepted / Not Implemented / Not Verified 的预留状态；当前报告只从 `COMPLETED` 同步生成或返回，未进入该状态。`FAILED` 是 D-013 Accepted / Not Implemented / Not Verified 的预留状态；当前 Provider 故障按既有 `AI_*` fail-closed 语义返回，未把会话持久化为该状态。
- 同一会话与 `client_request_id` 的重复答案不得重复写入；版本、问题或状态不匹配时返回 `INTERVIEW_CONFLICT` 或 `INTERVIEW_INVALID_STATE`。
- `speech_to_text` 仅标记用户确认文本的来源，不表示音频上传、录制、保存或回放。
- 关键错误包括 `AUTH_UNAUTHORIZED`、`AUTH_FORBIDDEN`、`FILE_TOO_LARGE`、`FILE_UNSUPPORTED_TYPE`、`FILE_MIME_MISMATCH`、`FILE_TEXT_NOT_EXTRACTABLE`、`INTERVIEW_INVALID_STATE`、`INTERVIEW_CONFLICT` 与 `REPORT_INVALID_STATE`。
- 当前聚合为 `resumes`、`candidate_competency_profiles`、`job_competency_profiles`、`job_competencies`、`assessment_cases`、`interview_sessions`、`interview_messages`、`answer_assessments`、`competency_evidence`、`interview_memories`、`retrieval_traces`、`assessment_reports`。

### 配置与可追溯性

- 新部署使用 `JOBFIT_*`。当前仅有 `HIRELINK_ENVIRONMENT`、`HIRELINK_LOG_LEVEL`、`HIRELINK_DATABASE_URL`、`HIRELINK_SQLITE_BUSY_TIMEOUT_MS`、`HIRELINK_JWT_SECRET`、`HIRELINK_AUTH_COOKIE_NAME` 和前端 `VITE_HIRELINK_API_BASE_URL` 的 legacy 兼容读取；不存在 `HIRELINK_LLM_*` Provider alias。这些兼容读取不能定义当前招聘工作流或替代 Provider 显式选择。
- `D-011` 的配置契约为 Accepted / Not Implemented / Not Verified：development / test 未显式 Provider 时可使用 deterministic 默认；production 必须显式设置 `JOBFIT_LLM_PROVIDER`，未设置即拒绝启动；production 显式 deterministic 还必须显式设置 `JOBFIT_ALLOW_DEMO_PROVIDER=true`。若 `HIRELINK_ENVIRONMENT=production` 使应用进入 production，仍必须由 `JOBFIT_LLM_PROVIDER` 满足该规则。
- `JOBFIT_LLM_PROVIDER`、`JOBFIT_LLM_BASE_URL`、`JOBFIT_LLM_API_KEY`、`JOBFIT_LLM_MODEL`、`JOBFIT_LLM_TIMEOUT_SECONDS`、`JOBFIT_ALLOW_DEMO_PROVIDER` 只约束服务端配置与受控调用，不构成真实 Provider 调用。openai_compatible 仍要求 URL、API key、model，production URL 必须为 HTTPS；失败不得自动降级到 deterministic。任何 deterministic 运行只能标记为 demo/mock scope。
- `VITE_JOBFIT_API_BASE_URL` 是当前前端 API 基地址；`VITE_JOBFIT_ENABLE_SPEECH_INPUT` 不是当前消费的功能开关。
- 报告、追问和评分必须保留模板/知识版本、会话版本、Evidence ID 或报告版本；不得以最新模板重建历史评分。

## P0 历史任务基线

| Task ID | 任务名称 | 输入依赖 | 输出产物 | 验收口径 | 对应代码区域 | 风险 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JF-P0-01 | 受控简历解析与候选人画像 | 认证、受控文件处理 | 简历文本、结构化字段、Candidate Competency Profile 与简历 Evidence | 授权用户可上传受控文件并创建画像；文件边界和所有权生效 | `jobfit/service.py`、`models.py`、简历/画像 Router、JobFit migration | 文件解析与隐私边界 | P0 |
| JF-P0-02 | 岗位胜任力模板与画像 | P0-01、岗位模板 | Job Competency Profile、能力项、权重、Rubric | 模板版本、标题、难度和 JD 文本可追溯 | `jobfit/profiles.py`、`schemas.py`、`service.py`、migration | 版本覆盖与自由 JD 误表述 | P0 |
| JF-P0-03 | Assessment 与固定面试编排 | P0-01、P0-02 | Assessment、可恢复会话、版本和幂等边界 | 会话可创建、开始、回答、恢复和完成 | `router.py`、`schemas.py`、`service.py` | 并发提交与状态冲突 | P0 |
| JF-P0-04 | 动态追问、Evidence、BM25 与记忆 | P0-03 | 固定追问、Evidence Ledger、RetrievalTrace、三层 Memory | 回答可形成 Evidence、检索轨迹和记忆，不引入自由多 Agent | `service.py`、`retrieval.py`、相关模型 | 将内置 BM25 夸大为外部 RAG | P0 |
| JF-P0-05 | 能力边界、匹配度与报告 | P0-04 | AssessmentReport、能力雷达数据、优势/缺口/建议 | 报告可回溯 Evidence，匹配度按岗位权重计算 | `generate_report`、报告模型/Router、报告页面 | 评分可解释性 | P0 |
| JF-P0-06 | 候选人评估主路径 | P0-01 至 P0-05 | 评估、面试记录和报告页面路径 | 候选人可从评估进入会话和报告，不恢复旧招聘导航 | `src/routes/assessment*`、`interviews*`、`reports*` | 前端 E2E 证据不足 | P0 |

## P1 分阶段执行基线

P1 的阶段身份、目标、P0 Freeze、LLM / Deterministic Runtime 边界和 Decision Protocol 由
[p1-implementation-protocol.md](./p1-implementation-protocol.md) 唯一维护。本节只维护计划图中的任务身份与
准入，避免把未开始 Phase 写成已有实现设计。

| Task ID | 阶段名称 | `status_initial` | 当前计划边界 | 进入实施前必须补齐 |
| --- | --- | --- | --- | --- |
| JF-P1-01 | Controlled LLM Follow-up Provider | pending（历史） | 已完成的实际状态见 Progress：`completed / V2（local/mock）`；真实外部 Provider 验证仍 pending。 | 不适用；保留 D-009 任务卡和不可变验证记录。 |
| JF-P1-02 | LLM Semantic Answer Evaluation | pending | 仅定义严格结构化 Semantic Judgment；LLM 不接管最终 Runtime。 | 语义结构、Runtime 控制边界、验证与 Gate。 |
| JF-P1-03 | Intelligent Adaptive Follow-up | pending | 仅定义以 Candidate Answer、Semantic Judgment、Evidence、Memory 和 Competency Context 为输入的专业追问目标。 | 数据使用边界、接口、验证与 Gate。 |
| JF-P1-04 | RAG Integration into Interview Reasoning | pending | 仅定义 RAG 参与 Interview Reasoning 的目标。 | 推理边界、知识治理、验证与 Gate。 |
| JF-P1-05 | Evidence + Boundary Hardening | pending | 仅定义 Evidence Strength、Contradiction Detection、Ownership Verification 与 Competency Boundary 的增强目标。 | 规则、可追溯性、验证与 Gate。 |
| JF-P1-06 | Semantic Long-term Memory | pending | 仅定义 Summary Memory 的语义结构化升级；不创建第四套 Memory System。 | Memory 结构、兼容性、验证与 Gate。 |
| JF-P1-07 | Assessment Report Quality | pending | 仅定义 Evidence Traceability、客观性和 Improvement Recommendation 质量目标。 | 报告语义、验证与 Gate。 |
| JF-P1-08 | Interviewer Persona | pending | 仅定义 Text Interview 专业表达与自然承接目标；不引入 Avatar、数字人或 Video Interview。 | Persona 边界、验证与 Gate。 |
| JF-P1-09 | Browser E2E / Demo Validation | pending | 仅定义完整 Browser E2E Candidate Journey 验证目标。 | 测试环境、覆盖范围、验证与 Gate。 |

## JF-P1-01：真实 LLM Provider 与受控追问

| 字段 | 定义 |
| --- | --- |
| `task_id` | `JF-P1-01` |
| `phase` | P1 |
| `summary` | 在不重写 P0 Competency Model、Evidence Ledger、Memory、Report 或固定 Interview Orchestrator 的前提下，接入可追溯的 OpenAI-compatible Provider，使现有内置 BM25 真正进入后续追问 Prompt。 |
| `status_initial` | `pending` |
| `depends_on` | `JF-P0-04`；架构与行为边界由 `D-009` 批准。 |
| `execution_order` / `parallel_with` | `after D-009` / 当前任务已完成；P1-02 至 P1-09 依 D-010 的阶段顺序保持 pending，不自动并行启动。 |
| `execution_lane` | `jobfit-llm-provider`。 |
| `source_requirement` | [prd.md](./prd.md) 第 4.3、4.4 节的固定面试编排、Evidence、检索与记忆要求。 |
| `source_decision` | `D-002`、`D-003`、`D-009`。 |
| `spec_or_contract` | 保持当前 P0 API wire shape；复用既有 `AI_TIMEOUT`、`AI_PROVIDER_ERROR`、`AI_INVALID_OUTPUT` 错误语义，不新增浏览器 Provider 接口或密钥传递。 |
| `architecture_or_adr` | [architecture.md](./architecture.md) 的 Current / As-Is Provider 边界；Provider 只生成既定 `NextAction` 的下一问，固定 Orchestrator 仍控制评估、状态和评分。 |
| `expected_result` | 仅后端 Provider 适配器、受控 Prompt、BM25 追问上下文、fail-closed 失败处理和 P1 专属 `LLMInvocation` 追加审计记录。审计不保存密钥、Authorization header、完整 Prompt 或完整 Provider 错误正文。 |
| `acceptance_criteria` | 1. 显式 `openai_compatible` 配置可经受控适配器调用，且模型与 Prompt 版本可追溯；2. 首个开场问题仍为确定性模板，后续 Provider 追问使用既定动作、能力项、难度、回答、当前 Memory 摘要和 BM25 片段/知识版本；3. Provider 不得改变 `_assess()`、`_decide()`、能力切换、难度、结束、Evidence 验证、Memory 或 Report 评分语义；4. 超时、Provider 错误和无效输出使用既有 `AI_*` 语义，且该轮不写入回答、Evidence、Memory 或 Report；5. `deterministic` 仅能显式选择，不能静默回退；6. 重复提交与确定性模式现有行为保持回归通过。 |
| `changed_files` | 实施边界限定于 `backend/app/core/config.py`、新的 JobFit Provider 边界、`backend/app/modules/jobfit/service.py`、P1 专属 `LLMInvocation` 模型/迁移、相关后端测试及受影响的事实状态文档；不改写 P0 Evidence、Memory、Report 或其历史数据。 |
| `validation` | 文档阶段：链接、Task-ID、状态与事实表述静态检查。代码阶段：本地 V1 配置/类型/迁移检查；本地 V2（`mock`）Provider 请求、成功、超时、错误、无效输出、无 P0 持久化副作用与确定性回归测试；命名真实 Provider 的 V5 观察须在安全配置凭据后单独记录。 |
| `required_verification_level` | 受控代码完成至少 V2（local/mock）；真实外部 Provider 运行结论只可凭独立 V5 证据声明。未取得 V5 前不得将 Implementation Status 的真实 Provider 状态升级为已验证运行。 |
| `gate` | A1：`D-009` 已批准本任务的 Provider、失败、审计和 P0 冻结边界；A2：代码机器验证后重新检查是否仍有未批准用户可见行为；A3：不适用，除非后续执行部署、迁移或发布。 |
| `risk` | 外部成本、凭据泄露、超时、不可复现输出、Prompt 注入、Provider 可用性和不当持久化候选人内容。Provider endpoint 只能由服务端配置，候选人内容只能作为不可信上下文。 |
| `rollback` | 将运行配置显式切换为 `deterministic`，并仅以局部反向补丁和 P1 专属迁移回退 Provider/审计实现；不回退、重算、删除或改写既有 P0 Evidence、Memory、Report 或历史评分。 |
| `superseded_by` | `none` |

## JF-PS-01：生产 Provider 显式选择与 deterministic 演示例外

| 字段 | 定义 |
| --- | --- |
| `task_id` | `JF-PS-01` |
| `phase` | Provider Safety（P1 非阶段性 hardening）；不重开已完成的 `JF-P1-01`，也不创建 D-010 未批准的后续 P1 阶段。 |
| `summary` | 实现 D-011 的 production Provider 显式选择准入，同时保留 D-009 的 fail-closed、最小审计和固定 Interview Orchestrator 边界。 |
| `status_initial` | `pending`；当前运行状态以 Progress 的 `ready` 为准。 |
| `depends_on` | 已完成的 `JF-P1-01`；来源决策为 `D-009`、`D-011`。不依赖、也不启动 `JF-P1-02` 至 `JF-P1-09`。 |
| `execution_order` / `parallel_with` | `after D-011 SSoT sync` / `none`；与任何修改 Settings 的任务串行。 |
| `execution_lane` | `jobfit-provider-safety`。 |
| `source_requirement` | [prd.md](./prd.md) 第 6 节“表述诚实”与第 8 节的实现状态证据边界；production 准入语义由 `D-011` 批准。 |
| `source_decision` | `D-009`、`D-011`。 |
| `spec_or_contract` | 本文“配置与可追溯性”中的 D-011 配置契约；不新增 HTTP API、前端 Provider 接口、数据库字段、migration、环境变量或 HIRELINK Provider alias。 |
| `architecture_or_adr` | [architecture.md](./architecture.md) 的 Provider 边界：Provider 只生成既定 `NextAction` 的下一问，固定 Orchestrator 继续控制状态、评估、Evidence、Memory 和评分。 |
| `expected_result` | production 能可靠区分默认值与显式 Provider / demo 许可；development / test 的 deterministic 默认保持兼容；openai_compatible 的现有 URL、HTTPS、凭据和 fail-closed 规则保持不变。 |
| `acceptance_criteria` | 1. production 未显式 `JOBFIT_LLM_PROVIDER` 时拒绝启动，即使解析值为默认 deterministic；2. production 显式 deterministic 只有同时显式 `JOBFIT_ALLOW_DEMO_PROVIDER=true` 才允许启动，且仅标记为 demo/mock scope；3. production 的 openai_compatible 仍要求完整 URL / API key / model 与 HTTPS；4. HIRELINK legacy alias（包括 `HIRELINK_ENVIRONMENT=production`）不能代替 `JOBFIT_LLM_PROVIDER`，且不新增 `HIRELINK_LLM_*` alias；5. 超时、Provider / HTTP 错误和无效输出仍 fail-closed，不自动退回 deterministic；6. 不改写 P0 Evidence、Memory、Report、评分、公开 API、migration 或历史数据。 |
| `changed_files` | **未来代码阶段**仅限 `backend/app/core/config.py`、`backend/tests/jobfit/test_llm_provider.py`、必要时 `backend/tests/contract/test_response_contract.py`，以及完成后的事实文档同步；不得改动 TypeScript、Provider 调用逻辑、migration、`backend/.env.example`、P0 Evidence / Memory / Report。**本次**仅改 README 与活动文档。 |
| `validation` | 文档阶段运行目标文件范围、Markdown 链接、Task-ID 集、术语与 `git diff --check` 静态检查。未来代码阶段在 `backend/` 运行 `uv run pytest tests/jobfit/test_llm_provider.py tests/jobfit/test_jobfit_flow.py tests/contract/test_response_contract.py` 与 `uv run mypy app`；测试使用 local/mock 与伪造凭据，不调用真实 Provider。 |
| `required_verification_level` | 文档同步为 V1（local/static）；代码完成至少 V2（local/mock）。命名真实外部 Provider 调用与 production 观察只可凭独立 V5 证据声明，当前均为 pending。 |
| `gate` | A1：`D-011` 已批准该任务的精确 production 配置边界；A2：未来机器验证后重新检查 fallback、legacy 或用户可见错误语义；A3：不适用，除非后续执行部署、发布、production 配置变更或真实外部 Provider 观察。 |
| `risk` | 无意 production 默认值、demo 被误表述为真实集成、HIRELINK alias 扩散、凭据泄露、Provider 失败后不当 fallback，以及用文档或 mock 夸大为 V5。 |
| `rollback` | 本次文档仅用逐段反向补丁回退，且不覆盖已有 `architecture-decisions.md` 用户改动。未来代码只回退 `JF-PS-01` 的 Settings 校验与对应测试 / 事实记录；不得通过恢复隐式 production deterministic 作为回滚路径，不触及 P1-01、数据库或 P0 历史数据。 |
| `superseded_by` | `none` |

### JF-PS-01 行为矩阵

| 环境与配置来源 | 预期启动结果 | 运行 / 证据边界 |
| --- | --- | --- |
| development / test，未设置 Provider | 允许；保持 deterministic 默认。 | 仅 development、test、demo/mock scope。 |
| production，未显式设置 `JOBFIT_LLM_PROVIDER` | 拒绝启动，即使解析后默认值为 deterministic。 | 防止 production 无意使用默认 Provider。 |
| production，显式 deterministic 但 demo flag 未显式设置 | 拒绝启动。 | 默认 `allow_demo_provider=true` 不能替代显式许可。 |
| production，显式 deterministic 且显式 `JOBFIT_ALLOW_DEMO_PROVIDER=false` | 拒绝启动。 | 明确禁用 demo Provider。 |
| production，显式 deterministic 且显式 `JOBFIT_ALLOW_DEMO_PROVIDER=true` | 允许启动。 | 仅 demo/mock scope；不构成真实 Provider、V5 或 Production Ready。 |
| production，显式 openai_compatible 且 URL / API key / model 完整、URL 为 HTTPS | 允许通过配置校验。 | 不证明已实际调用真实 Provider。 |
| production，openai_compatible 配置缺失、URL 非 HTTPS 或 URL 不安全 | 拒绝启动。 | 保持现有安全校验。 |
| openai_compatible 调用超时、网络 / HTTP 错误或输出无效 | 不自动切换 deterministic。 | 保持 D-009 fail-closed、最小审计与无本轮业务写入。 |
| 仅设置假想 `HIRELINK_LLM_PROVIDER` 或仅靠 HIRELINK legacy alias | 不视为 Provider 显式配置。 | production 仍必须由 `JOBFIT_LLM_PROVIDER` 满足 D-011。 |

## JF-DOC-02：P0 内容归纳、链接迁移与历史归档

| 字段 | 定义 |
| --- | --- |
| `task_id` | `JF-DOC-02` |
| `phase` | Documentation Governance |
| `summary` | 将四份 P0 文档的有效 JobFit 内容归入当前六文档体系，修复活动链接并归档原文件。 |
| `status_initial` | `pending` |
| `depends_on` | `JF-DOC-01` |
| `execution_lane` | `documentation-governance`，必须串行。 |
| `source_requirement` | 项目负责人 2026-09-06 批准的 P0 内容归纳、链接迁移与历史归档指令。 |
| `source_decision` | `D-007`、`D-008`。 |
| `expected_result` | 根 `docs/` 不再有活动 `p0-*.md`；六文档体系吸收有效内容；归档文件保留历史说明和可读链接。 |
| `changed_files` | `README.md`、`docs/architecture.md`、六份当前主文档、四份移动到 `docs/archive/legacy-p0/` 的归档文档。 |
| `acceptance_criteria` | 契约、任务、风险和实现事实已归入正确主源；Plan/Progress Task ID 集匹配；活动链接无断链；旧功能不被写成当前能力；四份 P0 文件已归档且未删除。 |
| `validation` | 归档前后链接解析、Task-ID 集比较、关键词语义扫描、源码路径抽查、`git diff --check` 和完整后端 pytest。 |
| `required_verification_level` | 文档迁移 V1；当前受测后端路径的支持证据为本地 V2。 |
| `gate` | A1：文档权威和归档范围已由项目负责人批准；A2：验证后确认无未批准用户可见行为；A3：不适用。 |
| `risk` | 归档导致活动链接失效、历史内容被误写为当前事实、未提交用户文档被覆盖。 |
| `rollback` | 用逐文件反向补丁和精确移动操作恢复本任务路径；不重置或覆盖既有用户改动。 |

## P2 占位规则

P2 当前没有获批任务、代码边界或验收标准。除非新的产品决策明确批准，P2 不得承接 AI 内推网络、企业人才运营、HR 招聘 CRM、ATS、真人面试、数字人、视频、反作弊或岗位能力试炼等已排除方向。

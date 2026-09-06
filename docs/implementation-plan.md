# JobFit 实施计划

> 本文是当前可执行工程任务的唯一计划主源。它定义任务、依赖、完成条件、验证和风险；不记录实时
> 状态，也不替代产品需求、决策登记、路线图或实现状态。经 `D-008` 批准，本文同时承载当前
> JobFit P0 接口与契约基线，替代已归档的 `p0-contracts.md` 活动入口。
>
> 建立日期：2026-09-06。当前计划基线：项目负责人于 2026-09-06 批准的 P0 内容归纳、链接迁移
> 与历史归档范围。

## 使用规则

- 新任务必须先在本文定义，再由 [progress.md](./progress.md) 记录运行状态。
- `status_initial` 是任务的初始规划元数据，不能被当作当前状态。
- `JF-P1-*` 已作为正式 `pending` 任务登记；在 Progress 中只能显示其真实 pending 状态，不得表述为已启动或已实现。
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
| JF-P1-01 | P1 | JF-P0-04 | after approval | 与 P1-02 仅在边界不重叠时可并行 | pending |
| JF-P1-02 | P1 | JF-P0-04 | after approval | 与 P1-01 仅在边界不重叠时可并行 | pending |
| JF-P1-03 | P1 | JF-P0-02 | after approval | 触及画像/契约/迁移，默认串行 | pending |
| JF-P1-04 | P1 | JF-P0-06 | after approval | 只验证候选人路径，不改评分语义 | pending |

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
| 报告 | `POST .../report`、`GET /reports`、`GET /reports/{id}` | 仅 `COMPLETED` 会话可生成；重复生成返回同一报告。 |

### 会话、并发、错误与实体

- 会话状态为 `PREPARING`、`ASKING`、`WAITING_FOR_ANSWER`、`EVALUATING`、`DECIDING`、`COMPLETED`、`REPORT_GENERATION`、`FAILED`。
- 同一会话与 `client_request_id` 的重复答案不得重复写入；版本、问题或状态不匹配时返回 `INTERVIEW_CONFLICT` 或 `INTERVIEW_INVALID_STATE`。
- `speech_to_text` 仅标记用户确认文本的来源，不表示音频上传、录制、保存或回放。
- 关键错误包括 `AUTH_UNAUTHORIZED`、`AUTH_FORBIDDEN`、`FILE_TOO_LARGE`、`FILE_UNSUPPORTED_TYPE`、`FILE_MIME_MISMATCH`、`FILE_TEXT_NOT_EXTRACTABLE`、`INTERVIEW_INVALID_STATE`、`INTERVIEW_CONFLICT` 与 `REPORT_INVALID_STATE`。
- 当前聚合为 `resumes`、`candidate_competency_profiles`、`job_competency_profiles`、`job_competencies`、`assessment_cases`、`interview_sessions`、`interview_messages`、`answer_assessments`、`competency_evidence`、`interview_memories`、`retrieval_traces`、`assessment_reports`。

### 配置与可追溯性

- 新部署使用 `JOBFIT_*`。`HIRELINK_ENVIRONMENT`、`HIRELINK_LOG_LEVEL`、`HIRELINK_DATABASE_URL`、`HIRELINK_SQLITE_BUSY_TIMEOUT_MS`、`HIRELINK_JWT_SECRET`、`HIRELINK_AUTH_COOKIE_NAME` 和前端 `VITE_HIRELINK_API_BASE_URL` 仅为 legacy 兼容读取。
- `JOBFIT_LLM_PROVIDER`、`JOBFIT_LLM_BASE_URL`、`JOBFIT_LLM_API_KEY`、`JOBFIT_LLM_MODEL`、`JOBFIT_LLM_TIMEOUT_SECONDS`、`JOBFIT_ALLOW_DEMO_PROVIDER` 只约束配置校验；不构成真实 Provider 调用。
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

## P1 正式 pending 任务

| Task ID | 任务名称 | 输入依赖 | 输出产物 | 验收标准 | 对应代码区域 | 风险 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JF-P1-01 | 真实 LLM Provider | P0-04、Provider 决策、密钥策略 | 可测试的 Provider 调用、失败处理、模型/Prompt 版本记录 | 实际调用、失败语义、版本记录和受控测试存在；配置校验不能单独视为完成 | `core/config.py`、Provider 边界、`jobfit/service.py`、测试 | 外部成本、密钥、超时与不可复现输出 | P1 |
| JF-P1-02 | 可维护岗位知识库 | P0-04、资料治理决策 | 可版本化知识来源、导入审计、检索轨迹 | 保留 source ID、知识版本、导入审计和回滚边界 | `jobfit/retrieval.py`、知识源模块、测试 | 资料质量、版权与版本漂移 | P1 |
| JF-P1-03 | 自由 JD 语义建模 | P0-02、模型/审核决策 | 可审核能力项、权重和 Rubric | 任意 JD 可生成独立版本，且不覆盖现有模板/岗位画像 | profiles、schemas、service、migration、测试 | 架构/契约/迁移影响 | P1 |
| JF-P1-04 | 前端端到端验证 | P0-06、浏览器测试环境 | 候选人主链路 E2E 套件 | 覆盖上传、评估、面试、报告、语音回退和会话冲突 | `src/routes/`、浏览器测试配置 | 浏览器能力差异与测试环境稳定性 | P1 |

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

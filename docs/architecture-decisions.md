# JobFit 决策登记

> 本文记录项目负责人已经批准、且会影响 JobFit 产品边界或文档权威关系的结论。
> 它不替代产品需求、架构、路线图、实施计划、运行进度或代码事实；当前 P0 接口与契约基线由
> [implementation-plan.md](./implementation-plan.md) 按 `D-008` 维护。
>
> 登记日期：2026-09-06。批准来源：项目负责人于 2026-09-06 对 JobFit 文档治理范围和产品边界的明确指示。

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
- **影响**：`JF-DOC-01` 是首个文档治理任务；三个 P0 辅助文档正式废弃但保留文件和追溯入口；`p0-contracts.md` 因既有链接兼容而继续作为活动契约文件。
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

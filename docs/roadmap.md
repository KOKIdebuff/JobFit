# JobFit 路线图

> 本文只定义阶段、里程碑、依赖、规划顺序和任务准入。
> 它不证明当前代码是否存在，也不记录任务的实时执行状态；相应事实分别见
> [implementation-status.md](./implementation-status.md) 与 [progress.md](./progress.md)。

## 1. 路线图规则

- P0/P1 表示产品阶段与规划身份，不等同于 `implemented`、`partial` 或任何代码完成度。
- 每个 Roadmap 项在进入开发前必须获得具体批准，并在 [implementation-plan.md](./implementation-plan.md) 中形成独立任务、完成条件、验证与风险边界。
- 当前 JobFit 路线只强化岗位胜任力评估闭环；被 [architecture-decisions.md](./architecture-decisions.md) 标为 `legacy` 或 `out_of_scope` 的能力不得重新进入阶段计划。

## 2. P0：岗位胜任力评估基线

P0 是已关闭的规划阶段，保留 `JF-P0-*` 标识以便追溯；这些条目不是当前代码事实的来源。各能力的源码、迁移与测试证据见 [implementation-status.md](./implementation-status.md)。

| Task ID | 里程碑结果 | 主要依赖 |
| --- | --- | --- |
| JF-P0-01 | 受控简历解析与 Candidate Competency Profile。 | 认证、受控文件处理。 |
| JF-P0-02 | 岗位胜任力模板与 Job Competency Profile。 | 岗位模板与版本化能力项。 |
| JF-P0-03 | Assessment、可恢复会话与固定面试编排。 | P0-01、P0-02。 |
| JF-P0-04 | 动态追问、Evidence Ledger、BM25 与三层记忆。 | P0-03。 |
| JF-P0-05 | 能力边界、匹配度、报告与可视化。 | P0-04。 |
| JF-P0-06 | 候选人评估、面试记录和报告路径。 | P0-01 至 P0-05。 |

## 3. P1：已批准的分阶段智能化升级协议

`D-010` 批准了 P1-01 至 P1-09 的阶段身份、顺序和执行准入。完整阶段目标、P0 Freeze、LLM / Runtime
边界与 Decision Protocol 见 [p1-implementation-protocol.md](./p1-implementation-protocol.md)。本表只定义路线图
顺序；代码事实与实时状态仍分别以 Implementation Status 和 Progress 为准。

| Task ID | 阶段方向 | 当前规划位置 | 进入实施计划的最低条件 |
| --- | --- | --- | --- |
| JF-P1-01 | Controlled LLM Follow-up Provider | 已完成的受控实现见 Progress：V2（local/mock）；真实外部验证仍 pending。 | 保留 D-009 的 Provider、失败、审计与 P0 Freeze 边界；真实外部运行证据另行取得。 |
| JF-P1-02 | LLM Semantic Answer Evaluation | pending，未开始。 | 形成 Semantic Judgment 的严格结构化语义、Runtime 控制权和验证范围。 |
| JF-P1-03 | Intelligent Adaptive Follow-up | pending，未开始。 | 明确 Candidate Answer、Semantic Judgment、Evidence、Memory 与 Competency Context 的受控使用边界。 |
| JF-P1-04 | RAG Integration into Interview Reasoning | pending，未开始。 | 明确 RAG 如何参与 Interview Reasoning，且不只作为 Prompt Context。 |
| JF-P1-05 | Evidence + Boundary Hardening | pending，未开始。 | 明确 Evidence Strength、Contradiction Detection、Ownership Verification 与 Competency Boundary 的可追溯规则。 |
| JF-P1-06 | Semantic Long-term Memory | pending，未开始。 | 在 Working / Summary / Evidence Memory 的现有边界内定义结构化升级方案，不创建第四套 Memory System。 |
| JF-P1-07 | Assessment Report Quality | pending，未开始。 | 明确 Evidence Traceability、客观性和 Improvement Recommendation 的验证标准。 |
| JF-P1-08 | Interviewer Persona | pending，未开始。 | 明确 Text Interview 的专业表达边界；不引入 Avatar、数字人或 Video Interview。 |
| JF-P1-09 | Browser E2E / Demo Validation | pending，未开始。 | 定义完整 Browser E2E Candidate Journey 的环境、覆盖范围和证据标准。 |

## 4. P2：未批准的未来占位

P2 当前没有获批任务、输入依赖、代码区域、验收标准或执行计划。它只保留为未来在 P1 获得运行、质量和用户价值证据后可能使用的路线图占位。

P2 不能自动承接 AI 内推网络、企业人才运营、HR 招聘 CRM、智能招聘工作台、ATS、真人面试、数字人、视频、反作弊或岗位能力试炼等已明确排除的方向；任何新能力都必须先获得新的产品与架构决策。

## 5. 规划顺序与质量门

1. 保持 P0 的 Evidence、能力边界与确定性可追溯边界。
2. 对每个拟启动的 P1 Phase，先依 P1 Protocol 每轮只解决 1–2 个真正阻塞的 Decision，再补齐可执行 Plan、验证范围和必要 Gate。
3. 涉及 API、数据模型、评分语义、Provider、知识源或兼容性的工作，必须在实施前同步其对应 Contract、Architecture 或 Decision。
4. 状态变化必须由代码、配置、迁移、测试或运行证据支持，并同步到 Implementation Status；Progress 只记录任务运行状态与证据引用。

## 6. 明确不排期

AI 内推网络、企业人才运营、HR 招聘 CRM、智能招聘工作台、ATS 对接、真人面试预约、数字人、虚拟面试官、视频面试、WebRTC、摄像头监考、录音录像、音视频回放、高级反作弊、行为分析、可信面试强判定和岗位能力试炼不属于当前路线图。

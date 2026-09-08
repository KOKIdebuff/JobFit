# JobFit 代码与文档一致性审计

> 审计范围：代码提交 `d736b7e` 加当前工作区的 JF-P1-01 Provider、审计 migration、测试与文档同步。
> 当前事实源：docs/implementation-status.md。
> 目的：防止产品目标、代码事实与比赛叙事互相夸大。

## 1. 已消除的主要漂移

| 旧文档冲突                         | 当前代码事实                                                       | 本次处理                                        |
| ---------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| 旧招聘平台被描述为 HR 双端 CRM     | 当前导航与 Runtime 已收敛到候选人岗位评估。                        | 全部活动文档改为 JobFit 单一评估主线。          |
| 旧 demo 路由被描述为主 API         | 当前 main 只挂载 auth 与 JobFit Router。                           | README、架构、契约和状态文档改为 JobFit API。   |
| 动态追问、记忆、检索被描述为未实现 | 当前 JobFitService、RetrievalTrace、InterviewMemory 与测试已存在。 | 标为 implemented，并注明确定性边界。            |
| PDF/DOCX 上传被描述为前端 mock     | 当前 JobFitService 已受控解析并创建持久化简历。                    | 标为 implemented 的受控解析，不夸大为模型解析。 |
| 视频/真人面试/反作弊被当作规划主线 | 当前产品已明确收敛，不在 JobFit Runtime。                          | 改为 out_of_scope 或 legacy。                   |

## 2. 仍存在的真实缺口

| 能力              | 当前状态      | 缺口                                                      |
| ----------------- | ------------- | --------------------------------------------------------- |
| 受控 LLM Follow-up Provider（JF-P1-01） | implemented；V2（local/mock） | 已观察到 deterministic / OpenAI-compatible Provider、受控 Prompt、非敏感审计与 local/mock Provider 测试。 |
| 真实外部 Provider / Production Validation | pending | 尚未观察到命名真实外部 Provider 的实际调用或生产运行；V2 local/mock 不等于真实集成或 Production Ready。 |
| 自由 JD 语义解析  | partial       | JD 文本仅持久化，岗位模型来自固定模板。                   |
| 外部岗位知识库    | partial       | 当前 BM25 只检索内置片段。                                |
| 浏览器语音        | frontend_demo | 依赖浏览器实现且仅产生文本，没有端到端语音质量证据。      |
| 浏览器 E2E        | not_started   | 当前没有覆盖完整候选人评估路径的浏览器测试。              |

## 3. 旧功能处理

以下名称在活动文档中只能以 legacy、兼容或 out_of_scope 说明出现：旧招聘平台、AI 内推网络、企业人才运营、HR CRM、ATS、真人面试预约、数字人、虚拟面试官、视频面试、WebRTC、摄像头监考、录音录像、音视频回放、高级反作弊、行为分析、岗位能力试炼。

历史归档和 design-qa 保留原始事实，不作为当前功能证据。

## 4. 后续同步规则

1. 增加 Router、迁移、Provider、知识源或评分规则时，先更新 implementation-status 的证据矩阵，并保持 [P1 Protocol](./p1-implementation-protocol.md) 的阶段边界不漂移。
2. PRD 只更新产品目标与边界；Architecture 只更新 Current/Target 结构；Roadmap 只更新任务与顺序。
3. 每次文档改动运行路径检查、关键词语义审计和 git diff --check。
4. 真实模型、在线知识库或浏览器 E2E 只有在相应运行证据出现后才能升级状态。

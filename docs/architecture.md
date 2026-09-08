# JobFit 技术架构

## 1. 阅读规则

- Current / As-Is 描述当前代码、迁移、配置与测试能证明的事实。
- Target / To-Be 仅描述已批准的后续方向，不得写成当前 Runtime。
- 当前实现状态以 [Implementation Status](./implementation-status.md) 为唯一文档事实源。
- P1 的阶段顺序、P0 Freeze 与执行准入以 [P1 Implementation Protocol](./p1-implementation-protocol.md) 为准。

## 2. Current / As-Is

JobFit 是 React/TanStack Start 前端与 FastAPI 模块化单体后端。当前业务 router 为认证和 JobFit 评估资源；旧招聘平台模块的代码或表可能仍存在于历史迁移中，但不属于已挂载 Runtime。

    Browser
      │
      ├─ React + TanStack Start
      │    ├─ /assessment
      │    ├─ /interviews
      │    └─ /reports
      │
      └─ FastAPI /api/v1
           ├─ auth
           └─ jobfit
                ├─ resume parsing
                ├─ competency profiles
                ├─ assessment and interview state machine
                ├─ Evidence Ledger and memories
                ├─ BM25 retrieval traces
                ├─ controlled follow-up Provider and LLM invocation audit
                └─ deterministic reports
                     │
                     └─ SQLite + SQLAlchemy + Alembic

## 3. 前端架构

| 页面                   | 当前职责                                   | 状态                              |
| ---------------------- | ------------------------------------------ | --------------------------------- |
| /assessment            | 上传简历、选择岗位模板、创建画像/评估/面试 | implemented                       |
| /interviews            | 浏览历史会话并继续面试                     | implemented                       |
| /interviews/:sessionId | 展示问题、回答、文字输入与浏览器语音转文字 | implemented；语音为 frontend_demo |
| /reports               | 查看报告列表                               | implemented                       |
| /reports/:reportId     | 雷达图、能力边界、Evidence 和提升建议      | implemented                       |

浏览器 SpeechRecognition 或 webkitSpeechRecognition 只将文本填入输入框。没有媒体上传、录制、摄像头、视频、WebRTC 或回放模块。

## 4. 后端模块

### 4.1 认证与资源所有权

认证模块使用 JWT HttpOnly Cookie 与 Argon2id。JobFitService 对简历、画像、评估、会话和报告按用户所有者或候选人 ID 校验访问权限。

旧 hr 角色可作为认证兼容数据存在，但当前前端统一进入岗位评估路径，角色不再决定产品主流程。

### 4.2 简历与画像

上传接口限制文件大小、扩展名、MIME 与基本文件签名。服务端通过 pypdf、python-docx 或 UTF-8 文本读取内容，再以受控规则生成技能、项目、经历和教育字段。

Candidate Competency Profile 保存简历结构化信息、能力标签和简历证据。该实现是已运行的受控解析，不是自由模型语义理解。

### 4.3 Job Competency Profile

岗位模板由代码中的能力配置定义，包含能力项、权重、Rubric、追问策略和 Evidence 要求。创建岗位画像时会保存模板版本、岗位标题、难度和用户输入的 JD 文本。

当前不把 JD 文本解析为任意新能力模型，因此自由 JD 语义建模为 partial。

### 4.4 固定 Interview Orchestrator

当前没有自由决策型多 Agent Runtime。JobFitService 实现固定的面试编排：

1. 创建会话并保存初始问题。
2. 校验客户端请求 ID、会话状态和 expected_session_version。
3. 对回答进行确定性相关性、深度、正确性、具体性和证据强度评估。
4. 决定追问策略、难度变化、能力维度切换或结束。
5. 对未结束的下一问，按显式 Provider 模式生成受约束问题：deterministic 保持既有模板；openai_compatible 只生成问题文本。
6. 保存消息、回答评估、Evidence、检索轨迹、Memory 和非敏感调用审计。

状态包括 PREPARING、ASKING、WAITING_FOR_ANSWER、EVALUATING、DECIDING、COMPLETED、REPORT_GENERATION 与 FAILED。回答评估、动作决定、能力切换、难度变化、Evidence 验证、Memory 更新和 Report 评分仍是确定性规则；Provider 不能改变这些决定。

### 4.5 RAG、记忆与报告

BM25 检索索引由内置岗位模板中的 Rubric、Evidence 要求和题目策略片段构建。它会按岗位和能力维度检索并保存 source ID、分数与知识版本；当显式选择 openai_compatible Provider 时，受长度限制的检索片段、source ID 和知识版本会进入后续追问 Prompt。当前没有外部知识库同步、向量数据库或在线题库管理。

| 记忆层          | 当前实现                                 |
| --------------- | ---------------------------------------- |
| Working Memory  | 返回最近六条消息。                       |
| Summary Memory  | 每四轮回答压缩摘要并限制长度。           |
| Evidence Memory | 持久化 Evidence 的能力维度、等级与强度。 |

报告根据已验证的 Evidence、岗位权重和能力等级计算匹配度，并生成雷达图数据、优势、缺口与练习建议。

### 4.6 JF-P1-01：受控 Provider 追问

`JF-P1-01` 是 Current / As-Is 的已实现路径：`DeterministicFollowUpProvider` 用于离线演示、回归测试和
显式 deterministic mode；`OpenAICompatibleFollowUpProvider` 只将已确定的 `NextAction` 生成自然、专业的
下一问。Provider 返回严格的 `{"question":"..."}` JSON，首个开场问题仍使用确定性模板。

固定 Interview Orchestrator 继续唯一决定回答评估、能力切换、难度变化、结束条件、Evidence 验证、Memory
更新和 Report 评分。候选人回答、Memory 和内置 BM25 片段均作为受限的不可信 Prompt Context；它们不能
改变 Runtime 的 Action、Difficulty、Competency、评分语义或输出 Schema，BM25 也不等同于外部知识库。

`LLMInvocation` 仅保存非敏感调用追溯字段。`openai_compatible` Provider 超时、网络/HTTP 失败或输出无效时
复用既有 `AI_*` 语义 fail-closed：不写入该轮 Candidate Answer、Evidence、Answer Assessment、Memory、
RetrievalTrace、Report 或 Session Version，只保存最小失败审计。`deterministic` 只能显式选择，不能成为静默
降级。

该路径完成于 V2（local/mock）范围。它不证明命名真实外部 Provider 的实际调用、生产环境验证或 Production
Ready；External Provider Validation 仍为 pending。完整技术与执行边界见
[P1 Implementation Protocol](./p1-implementation-protocol.md)。

## 5. 数据模型与迁移

当前 JobFit 迁移增加以下领域实体：

- CandidateCompetencyProfile、JobCompetencyProfile、JobCompetency。
- AssessmentCase、InterviewSession、InterviewMessage、AnswerAssessment。
- CompetencyEvidence、InterviewMemory、RetrievalTrace、LLMInvocation、AssessmentReport。

旧招聘平台的表和迁移不会被物理删除；文档将其标注为 legacy，避免误认为这些数据表仍由当前 Runtime 调用。

## 6. API 边界

当前 JobFit API 覆盖岗位模板、简历、候选人画像、岗位画像、评估、面试会话、Evidence、记忆、检索轨迹和报告。精确请求、响应、错误与并发语义见 [Implementation Plan 的 P0 接口与契约基线](./implementation-plan.md)。

## 7. 配置与 Provider 边界

后端主配置前缀为 JOBFIT。HIRELINK 前缀仅由 Settings 读取为兼容别名。

llm_provider 可取 deterministic 或 openai_compatible；后者要求 base URL、API key 和 model 均存在。Provider URL 仅允许 http(s)、不得含 userinfo、query 或 fragment，生产环境要求 HTTPS；请求关闭重定向跟随。Provider endpoint 和密钥只在服务端 Settings 中读取，浏览器不接收它们。

当前 Runtime 已具备受控调用路径：首个开场问题保持确定性模板；后续未结束问题由显式 Provider 生成。local/mock 测试已覆盖 OpenAI-compatible Chat Completions 请求、超时/Provider/无效输出、BM25 Prompt 注入、失败原子性和 deterministic 回归；尚未取得真实外部 Provider 运行证据。

## 8. 安全与隐私

- 文件按大小、类型、MIME、签名和可提取文本处理。
- 认证与资源访问使用 Cookie、密码哈希和所有权校验。
- Evidence 仅存储回答文本及其评估元数据。
- Provider Prompt 只携带受限的候选人回答、Summary / Evidence Memory 与 BM25 片段；这些内容均标记为不可信 data，超长内容显式标记截断。
- LLMInvocation 只保存会话、源回答轮次、目的、Provider、模型、Prompt/知识版本、状态、耗时和归类错误；不保存密钥、Authorization、完整 Prompt、完整 Provider 响应或错误正文。
- 不采集摄像头、音频、视频、浏览器行为或反作弊特征。
- 生产环境拒绝默认 JWT 密钥。

## 9. Target / To-Be

`JF-P1-01` 已属于 Current / As-Is，不是 Target 项。后续 `JF-P1-02` 至 `JF-P1-09` 的阶段目标为
Semantic Answer Evaluation、Intelligent Adaptive Follow-up、RAG Interview Reasoning、Evidence / Boundary
Hardening、Semantic Long-term Memory、Assessment Report Quality、Interviewer Persona 和 Browser E2E / Demo
Validation；它们全部仍为 pending，未形成当前 Runtime。

后续阶段不得以“补充 P1”为由改写 P0 的 Evidence、Memory、Report、评分公式或固定 State Machine。完整的
阶段定义、LLM / Deterministic Runtime 分工、Decision Protocol 和 Out of Scope 见
[p1-implementation-protocol.md](./p1-implementation-protocol.md)。

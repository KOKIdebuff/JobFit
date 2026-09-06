# JobFit 技术架构

## 1. 阅读规则

- Current / As-Is 描述当前代码、迁移、配置与测试能证明的事实。
- Target / To-Be 仅描述已批准的后续方向，不得写成当前 Runtime。
- 当前实现状态以 [Implementation Status](./implementation-status.md) 为唯一文档事实源。

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
5. 保存消息、回答评估、Evidence、检索轨迹和记忆。

状态包括 PREPARING、ASKING、WAITING_FOR_ANSWER、EVALUATING、DECIDING、COMPLETED、REPORT_GENERATION 与 FAILED。当前评估与决策是确定性规则，不应描述为真实 LLM 推理。

### 4.5 RAG、记忆与报告

BM25 检索索引由内置岗位模板中的 Rubric、Evidence 要求和题目策略片段构建。它会按岗位和能力维度检索并保存 source ID、分数与知识版本。当前没有外部知识库同步、向量数据库或在线题库管理。

| 记忆层          | 当前实现                                 |
| --------------- | ---------------------------------------- |
| Working Memory  | 返回最近六条消息。                       |
| Summary Memory  | 每四轮回答压缩摘要并限制长度。           |
| Evidence Memory | 持久化 Evidence 的能力维度、等级与强度。 |

报告根据已验证的 Evidence、岗位权重和能力等级计算匹配度，并生成雷达图数据、优势、缺口与练习建议。

## 5. 数据模型与迁移

当前 JobFit 迁移增加以下领域实体：

- CandidateCompetencyProfile、JobCompetencyProfile、JobCompetency。
- AssessmentCase、InterviewSession、InterviewMessage、AnswerAssessment。
- CompetencyEvidence、InterviewMemory、RetrievalTrace、AssessmentReport。

旧招聘平台的表和迁移不会被物理删除；文档将其标注为 legacy，避免误认为这些数据表仍由当前 Runtime 调用。

## 6. API 边界

当前 JobFit API 覆盖岗位模板、简历、候选人画像、岗位画像、评估、面试会话、Evidence、记忆、检索轨迹和报告。精确请求、响应、错误与并发语义见 [Implementation Plan 的 P0 接口与契约基线](./implementation-plan.md)。

## 7. 配置与 Provider 边界

后端主配置前缀为 JOBFIT。HIRELINK 前缀仅由 Settings 读取为兼容别名。

llm_provider 可取 deterministic 或 openai_compatible；后者要求 base URL、API key 和 model 均存在。但当前 JobFitService 不调用供应商 SDK 或远程模型，配置校验不构成真实模型集成证据。

## 8. 安全与隐私

- 文件按大小、类型、MIME、签名和可提取文本处理。
- 认证与资源访问使用 Cookie、密码哈希和所有权校验。
- Evidence 仅存储回答文本及其评估元数据。
- 不采集摄像头、音频、视频、浏览器行为或反作弊特征。
- 生产环境拒绝默认 JWT 密钥。

## 9. Target / To-Be

后续可在不改变当前证据模型的前提下增加真实 LLM Provider、可维护的岗位知识库、任意 JD 的语义建模和更完整的前端测试。任何此类能力在具备代码、配置、测试和运行证据前均保持 partial 或 not_started。

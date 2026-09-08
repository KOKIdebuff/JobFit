# JobFit P1 分阶段智能化升级协议

> 本文是 JobFit P1 的正式阶段协议与执行准入基线。它定义 P1 的阶段顺序、阶段目标、P0 Freeze、
> LLM / Deterministic Runtime 边界、Decision Protocol 和范围限制；它不替代代码事实或任务实时状态。
>
> 当前代码事实见 [implementation-status.md](./implementation-status.md)，任务状态与验证证据见
> [progress.md](./progress.md)，批准取舍见 [architecture-decisions.md](./architecture-decisions.md)，具体
> 可执行任务在进入对应 Phase 后由 [implementation-plan.md](./implementation-plan.md) 补充。

## 1. 协议地位与执行规则

- P1 在现有 P0 Runtime 上增量增强，不推倒重建岗位胜任力评估主线。
- 本文的 P1 阶段表是 P1-01 至 P1-09 的唯一阶段身份、顺序和目标基线。Roadmap 与 Implementation Plan
  只保留与其职责相符的索引、准入和任务信息，避免重复定义阶段语义。
- `implementation-status.md` 只依据代码、迁移、配置和测试说明已观察实现；`progress.md` 只记录任务
  当前状态、证据与不可变事件。本文引用状态快照时不替代这两个事实源。
- 除 `JF-P1-01` 外，所有 P1 阶段当前均为 `pending`。`pending` 不等于开始实施、已有接口、已有迁移或
  已有运行证据。
- 每个后续 Phase 进入实施前，必须先形成该 Phase 所需的具体 Decision、任务卡、边界、验证与 Gate；本
  协议本身不授权启动 P1-02 或任何更晚阶段。

## 2. P0 基线与 Freeze Rules

以下 P0 能力已经存在。P1 默认在其上增量增强，不重新实现：

- Resume Upload / Parsing。
- Candidate Competency Profile、Job Competency Profile 与 Competency Model。
- Interview Session 与 Interview State Machine。
- Adaptive Follow-up 基础能力。
- L0-L5 Boundary Model、Evidence Ledger 与 Answer Assessment。
- Working Memory、Summary Memory 与 Evidence Memory。
- BM25 Retrieval 与 Retrieval Trace。
- Competency Scoring、Job Fit Score、Assessment Report 与 Radar Chart。
- Text Interview UI 与 Browser Speech-to-Text Demo。

因此，P1 必须遵守以下 Freeze Rules：

1. 不重新设计全部 Competency Model。
2. 不重新创建 Interview Runtime 或 Evidence 系统。
3. 不重新创建 Memory 系统或 Report 数据模型。
4. 不为了接入 LLM 推倒当前 State Machine。
5. 只有直接证据证明当前设计阻塞某个后续 Phase 时，才可提出局部变更建议；建议本身不构成实现授权。

## 3. JF-P1-01：Controlled LLM Follow-up Provider

### 3.1 当前真实状态

| 项目 | 当前状态 |
| --- | --- |
| Task | `JF-P1-01 — Controlled LLM Follow-up Provider` |
| Status | `completed` |
| Validation | `V2（local/mock）` |
| External Provider Validation | `pending` |
| Production Validation | `pending` |

`completed` 只表示已完成受控 Provider 层、OpenAI-compatible 实现和本地 mock 验证范围；它不表示命名
真实外部 Provider 已被调用、生产环境已经验证或系统已经 Production Ready。

### 3.2 Controlled Provider Layer

当前 Provider Layer 包含：

| Provider | 职责 |
| --- | --- |
| `DeterministicFollowUpProvider` | Offline Demo、Regression Test 与显式 deterministic mode；返回既有确定性模板问题。 |
| `OpenAICompatibleFollowUpProvider` | 在既定控制上下文内生成自然、专业的下一道追问。 |

Provider 输出必须通过严格 JSON Schema：

```json
{
  "question": "..."
}
```

额外字段、非 JSON、空白问题、多题、Markdown 包裹或其他无效内容都会被拒绝。

### 3.3 LLM 不接管 P0 Runtime

以下能力继续由 deterministic Runtime 唯一控制：

- `_assess()`、`_decide()` 与 State Machine。
- Competency Switching、Difficulty 与 Interview End Condition。
- Evidence Validation、Memory Update 与 Report Scoring。

LLM 当前只负责将 Orchestrator / State Machine 已经决定的 `NextAction` 表达为更自然、专业的下一问。首个
开场问题保持确定性模板。

### 3.4 RAG、Prompt 与注入防护

现有 BM25 Retrieval 不再只用于 `RetrievalTrace`。当显式选择 `openai_compatible` Provider 时，下列
上下文可进入 Follow-up Prompt：

- Retrieved Knowledge、Source IDs、Retrieval Scores 与 Knowledge Version。
- Summary Memory、Evidence Memory 与 Candidate Answer。

Candidate Answer、Memory 与 BM25 Knowledge 都属于 **untrusted data**。它们受到长度限制，超长内容会以
明确的截断标记表示；它们不能覆盖 system rules、`NextAction`、Difficulty、Competency、Scoring semantics
或 Output Schema。

Prompt 明确禁止用户内容改变 Action、Difficulty、Competency、评分规则、Tool Calling 或 Output Schema。
内置 BM25 仍是岗位模板中的确定性资料，不等同于外部在线知识库或向量数据库。

### 3.5 Provider Security Boundary 与最小审计

Provider URL 只接受绝对 HTTP(S) URL，拒绝 userinfo、query 与 fragment；生产环境要求 HTTPS。Provider
Request 不跟随 HTTP Redirect。Provider endpoint 和密钥只从服务端 Settings 读取，浏览器不接收它们。

P1 专属、追加式 `LLMInvocation` 审计记录以下最小字段：

- Session、Source Answer Turn、Purpose、Provider、Model。
- Prompt Version、Knowledge Version、Status、Latency、Error Code。

审计不得记录 API Key、Authorization Header、完整 Prompt、完整 Candidate Answer、完整 Provider Response 或
错误正文。

### 3.6 Fail-Closed Atomicity 与旧题保护

| Provider 失败类型 | 对外错误语义 |
| --- | --- |
| Provider Timeout | `AI_TIMEOUT` |
| Network / Connection / HTTP Error | `AI_PROVIDER_ERROR` |
| Invalid JSON / Schema / Content | `AI_INVALID_OUTPUT` |

当配置为 `openai_compatible` 且 Provider 失败时，系统 fail-closed：不保存当前 Candidate Answer，不写入
Evidence、Answer Assessment、Memory、Retrieval Trace、Report 或 Session Version，只允许保存 minimal failure
audit。系统不得静默降级到 deterministic；只有显式
`JOBFIT_LLM_PROVIDER=deterministic` 才会使用 deterministic Provider。

已回答或过期的 `question_id` 必须返回 `INTERVIEW_CONFLICT`，防止旧题生成错误 Prompt、写入错误 Evidence
或触发错误数据库状态。

## 4. P1 阶段表

| Task ID | 阶段 | 当前状态 | 阶段目标 |
| --- | --- | --- | --- |
| JF-P1-01 | Controlled LLM Follow-up Provider | completed；V2（local/mock） | 以受控 Provider 将既定 `NextAction` 表达为专业追问；真实外部 Provider 验证仍 pending。 |
| JF-P1-02 | LLM Semantic Answer Evaluation | pending | 使用 LLM 对候选人回答进行语义理解，并输出严格结构化的 Semantic Judgment；LLM 不直接控制最终 Runtime。 |
| JF-P1-03 | Intelligent Adaptive Follow-up | pending | 根据 Candidate Answer、Semantic Judgment、Evidence、Memory 与 Competency Context 生成真正针对回答内容的专业追问。 |
| JF-P1-04 | RAG Integration into Interview Reasoning | pending | 让 RAG 不仅进入 Follow-up Prompt，还真正参与 Interview Reasoning。 |
| JF-P1-05 | Evidence + Boundary Hardening | pending | 进一步增强 Evidence Strength、Contradiction Detection、Ownership Verification 与 Competency Boundary。 |
| JF-P1-06 | Semantic Long-term Memory | pending | 将当前 Summary Memory 升级为语义结构化 Memory，同时保留 Working / Summary / Evidence Memory，不创建第四套 Memory System。 |
| JF-P1-07 | Assessment Report Quality | pending | 提升 Assessment Report 的 Evidence Traceability、客观性与 Improvement Recommendation 质量。 |
| JF-P1-08 | Interviewer Persona | pending | 提升 Text Interview 的专业性、自然承接能力与职业感；不增加 Avatar、Digital Human 或 Video Interview。 |
| JF-P1-09 | Browser E2E / Demo Validation | pending | 完整验证 Browser E2E Candidate Journey。 |

## 5. LLM 与 Deterministic Runtime 的职责边界

| LLM Responsibilities | Deterministic Runtime Responsibilities |
| --- | --- |
| Semantic Understanding | State Machine |
| Answer Interpretation | Session Lifecycle |
| Missing Point Identification | Schema Validation |
| Contradiction Signal Extraction | Session Version 与 Idempotency |
| Professional Question Generation | Evidence Persistence 与 Scoring Guardrails |
| Natural Language Expression | Failure Handling、Fallback Policy 与 Report Formula Boundary |

总体原则：**LLM 提供智能判断和语言能力；Deterministic Runtime 保持系统控制权。**

## 6. Decision Protocol

- 每个后续 Phase 的每一轮，最多询问用户 1–2 个真正阻塞该 Phase 的 Decision。
- 禁止一次罗列五个或更多不相干的决策问题。
- 不阻塞当前 Phase 的问题必须记录到 `Pending Decisions`，在进入对应 Phase 时再询问。
- 若某项 Decision 会改变 API、数据模型、评分语义、Provider、知识源、兼容性或系统边界，必须先同步相应
  Decision、Architecture、Contract、Roadmap 与 Implementation Plan，再开始实现。

## 7. Out of Scope

以下能力不属于当前 JobFit Scope，也不得借 P1 默认引入：

- 数字人、虚拟 Avatar、Video Interview、WebRTC、摄像头、录音录像。
- 高级反作弊、行为分析、人才库、人才雷达、AI 内推。
- HR CRM、ATS、Recruiter Pipeline、真人面试预约、岗位任务试炼。

Speech-to-Text 仅作为 **Text Interview Input Enhancement**：它只协助用户产生和确认文本输入，不代表音频采集、
录制、上传、回放或音视频面试能力。

## 8. Pending Work 与验证限制

- 命名真实外部 Provider 的实际调用证据与 Production Validation 均为 pending，必须另行在安全配置凭据的
  环境中取得相应运行证据。
- P1-02 至 P1-09 均未开始。它们的详细接口、数据模型、任务卡、验收条件、验证命令和 Gate 必须在进入
  对应 Phase 前再定义，不能由本协议预先伪装为已实施设计。
- 本协议不改变 P0 的 Evidence、Memory、Report、评分公式、公开 API 或历史数据。

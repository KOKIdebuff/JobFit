# Archived：JobFit / HireLink P0 契约历史快照

> 此文件为旧 HireLink P0 历史文档，内容已归纳进 docs/implementation-plan.md、docs/progress.md、docs/implementation-status.md 和 docs/architecture-decisions.md，不再作为当前 JobFit 主文档入口。
>
> 本文件后期曾包含 JobFit 对齐内容；活动接口基线已迁移至 [Implementation Plan](../../implementation-plan.md)，本归档副本只用于追溯，不能定义当前 API、并发、错误或配置语义。

## 1. 通用响应

所有当前 API 资源位于 `/api/v1`，成功与失败响应均使用统一 envelope：

    {
      "success": true,
      "data": {},
      "meta": {
        "request_id": "UUID",
        "timestamp": "UTC ISO-8601",
        "pagination": null
      }
    }

    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "用户可读信息",
        "details": null
      },
      "meta": {
        "request_id": "UUID",
        "timestamp": "UTC ISO-8601",
        "pagination": null
      }
    }

## 2. 认证与资源所有权

- 注册、登录、退出和当前用户资源位于 `/api/v1/auth`；会话令牌写入 HttpOnly Cookie。
- 简历、候选人画像、岗位画像、评估、面试会话和报告都必须经过资源所有者校验。
- 历史角色数据可以作为 `legacy` 兼容数据存在，但不会通过企业招聘流程或工作台定义当前 API 行为。

## 3. 归档快照中的资源契约

| 资源 | 当前接口边界 |
| --- | --- |
| 胜任力模板 | `GET /competency-profiles`、`GET /competency-profiles/{role}`；合法 role 为 `ai_engineer`、`java_engineer`、`product_manager`。 |
| 简历与候选人画像 | `POST /resumes/upload`、`GET /resumes`、`GET /resumes/{id}`、`POST /candidate-profiles`、`GET /candidate-profiles/{id}`。 |
| 岗位画像与评估 | `POST /job-profiles`、`GET /job-profiles/{id}`、`POST /assessments`、`GET /assessments/{id}`。 |
| 面试会话 | `POST /interview-sessions`、`GET /interview-sessions`、`GET /interview-sessions/{id}`，以及 `start`、`answers`、`complete` 子资源。 |
| Evidence 与上下文 | `GET /interview-sessions/{id}/evidence`、`memory`、`retrieval-traces`。 |
| 报告 | `POST /interview-sessions/{id}/report`、`GET /reports`、`GET /reports/{id}`。 |

### 3.1 岗位画像

`POST /job-profiles` 接受：

    {
      "job_role": "ai_engineer | java_engineer | product_manager",
      "title": "2–160 字符岗位名称",
      "jd_text": "最多 30000 字符，可为空",
      "difficulty": 1
    }

岗位画像保存模板版本、能力项、权重、Rubric 和输入 JD。JD 文本可持久化，但不会被当前契约解释为自定义能力模型生成请求。

### 3.2 简历与 Candidate Competency Profile

`POST /resumes/upload` 接受 multipart 文件，允许 PDF、DOCX、TXT，并检查文件大小、扩展名、MIME、基本签名和可提取文本。

`POST /candidate-profiles` 接受：

    { "resume_id": "resume_public_id" }

返回的画像包含技能、项目、经历、教育、能力标签和简历 Evidence。

### 3.3 Assessment 与 Interview Session

`POST /assessments` 接受：

    {
      "resume_id": "resume_public_id",
      "candidate_profile_id": "candidate_profile_public_id",
      "job_profile_id": "job_profile_public_id"
    }

每个 Assessment 通过 `POST /interview-sessions` 创建唯一会话；`POST /interview-sessions/{id}/start` 进入首个提问状态。

会话状态为：`PREPARING`、`ASKING`、`WAITING_FOR_ANSWER`、`EVALUATING`、`DECIDING`、`COMPLETED`、`REPORT_GENERATION`、`FAILED`。

### 3.4 回答幂等、版本与文本来源

`POST /interview-sessions/{id}/answers` 接受：

    {
      "question_id": "当前 assistant 问题 ID",
      "answer": "1–12000 字符文本",
      "input_method": "text | speech_to_text",
      "client_request_id": "8–80 字符客户端幂等键",
      "expected_session_version": 0
    }

- 同一会话和 `client_request_id` 的重复提交返回当前会话，不重复写入答案。
- `expected_session_version` 不匹配、问题不属于当前会话或当前状态不允许回答时，返回 `INTERVIEW_CONFLICT` 或 `INTERVIEW_INVALID_STATE`。
- `speech_to_text` 只标记确认文本的来源；它不表示上传、录制、保存或回放音频。

### 3.5 Evidence、记忆、检索与报告

- Evidence 按时间排序返回；Memory 返回 `working_memory`、`summary_memory`、`evidence_memory`、压缩轮次和版本。
- Retrieval traces 返回 BM25 的 source ID、分数、查询摘要和知识版本。
- 只有会话 `COMPLETED` 后才能生成报告；对同一会话重复生成报告返回已生成结果。
- 报告包含岗位匹配度、能力评分、能力边界、优势、缺口、提升建议和 Evidence 引用。

## 4. 领域实体边界

| 聚合 | 当前实体 |
| --- | --- |
| 简历与画像 | `resumes`、`candidate_competency_profiles` |
| 岗位模型 | `job_competency_profiles`、`job_competencies` |
| 评估与会话 | `assessment_cases`、`interview_sessions`、`interview_messages`、`answer_assessments` |
| 证据与上下文 | `competency_evidence`、`interview_memories`、`retrieval_traces` |
| 报告 | `assessment_reports` |

这些聚合由 JobFit migration 创建。历史招聘平台表和兼容错误码属于 `legacy`，不能替代上述接口语义。

## 5. 错误与文件边界

| 场景 | 错误码或 HTTP 语义 |
| --- | --- |
| 未登录或无资源所有权 | `AUTH_UNAUTHORIZED` / `AUTH_FORBIDDEN` |
| 文件超限、类型/MIME 不符或不可提取 | `FILE_TOO_LARGE`、`FILE_UNSUPPORTED_TYPE`、`FILE_MIME_MISMATCH`、`FILE_TEXT_NOT_EXTRACTABLE` |
| 资源不可见 | 资源相关 `NOT_FOUND` 或 `AUTH_FORBIDDEN` |
| 面试状态或版本冲突 | `INTERVIEW_INVALID_STATE` 或 `INTERVIEW_CONFLICT` |
| 未完成会话生成报告 | `REPORT_INVALID_STATE` |
| 生产环境默认密钥 | Settings 校验失败 |

## 6. 配置与兼容性

- 新部署使用 `JOBFIT_*` 配置前缀。
- `HIRELINK_ENVIRONMENT`、`HIRELINK_LOG_LEVEL`、`HIRELINK_DATABASE_URL`、`HIRELINK_SQLITE_BUSY_TIMEOUT_MS`、`HIRELINK_JWT_SECRET` 和 `HIRELINK_AUTH_COOKIE_NAME` 仅作为 `legacy` 读取别名。
- `JOBFIT_LLM_PROVIDER`、`JOBFIT_LLM_BASE_URL`、`JOBFIT_LLM_API_KEY`、`JOBFIT_LLM_MODEL`、`JOBFIT_LLM_TIMEOUT_SECONDS` 和 `JOBFIT_ALLOW_DEMO_PROVIDER` 约束 Provider 配置校验，不构成真实 Provider 调用契约。
- `VITE_JOBFIT_API_BASE_URL` 是前端 API 基地址。`VITE_JOBFIT_ENABLE_SPEECH_INPUT` 即使出现在示例文件中，也不是当前前端消费的功能开关。

## 7. 可追溯性边界

报告、追问和评分的当前 Runtime 为确定性实现。每个可追溯结论应保留模板/知识版本、会话版本、Evidence ID 或报告版本；不得仅凭最新模板重建历史评分，也不得把配置校验写成真实模型集成。

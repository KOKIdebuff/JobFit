# HireLink P0 公共契约

> 状态：Frozen v1（历史公共契约冻结，不代表当前实体/API 完整清单）\\
> 生效范围：所有 `/api/v1` API、模块间调用、AI Adapter、日志和错误处理  
> 变更规则：业务线程只能消费本契约，不得自行扩展公共响应、错误前缀或跨模块调用规则。
> 当前代码状态：本文仍保留 Frozen v1 历史契约价值，但当前迁移和 API 已扩展出 `notifications` 与 `human_interviews` 相关实体和接口；因此本文不能再作为完整当前实体/API 清单使用。当前完整事实以代码、迁移和 `docs/implementation-status.md` 为准。

## 1. API 通用规则

- API 根前缀固定为 `/api/v1`。
- 请求和响应 JSON 字段使用 `snake_case`。
- 时间使用 UTC ISO 8601 `Z` 格式。
- 资源 ID 使用 UUID4 字符串。
- Cookie 认证失败仍返回统一 JSON 错误，不重定向 HTML 登录页。
- 除文件下载和 OpenAPI 文档外，所有业务接口都返回统一 JSON 包装。
- 不返回裸数组、裸对象、裸字符串错误或框架默认校验错误。
- 业务接口不使用 `204 No Content`。删除成功返回被删除资源的 ID。
- `request_id` 优先接收合法的 `X-Request-ID`，否则由服务端生成；响应同时回写 `X-Request-ID` Header 和 `meta.request_id`。

## 2. 统一响应

### 2.1 成功响应

```json
{
  "success": true,
  "data": {
    "id": "7e725fe2-0a53-4a4a-8792-0d965d4b5d26"
  },
  "meta": {
    "request_id": "a738b50e-60fb-46bb-ad90-ae0e476778e5",
    "timestamp": "2026-06-13T08:30:00Z"
  }
}
```

`data` 可以是对象、数组、标量或 `null`，但包装层始终存在。创建资源使用 HTTP `201`；普通查询和修改使用 `200`。

删除响应：

```json
{
  "success": true,
  "data": {
    "deleted_id": "7e725fe2-0a53-4a4a-8792-0d965d4b5d26"
  },
  "meta": {
    "request_id": "a738b50e-60fb-46bb-ad90-ae0e476778e5",
    "timestamp": "2026-06-13T08:30:00Z"
  }
}
```

### 2.2 分页响应

```json
{
  "success": true,
  "data": [
    {
      "id": "7e725fe2-0a53-4a4a-8792-0d965d4b5d26",
      "status": "completed"
    }
  ],
  "meta": {
    "request_id": "a738b50e-60fb-46bb-ad90-ae0e476778e5",
    "timestamp": "2026-06-13T08:30:00Z",
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

分页参数默认 `page=1`、`page_size=20`，`page_size` 最大为 100。无结果时 `data=[]`，分页字段仍完整返回。

### 2.3 错误响应

```json
{
  "success": false,
  "error": {
    "code": "AUTH_UNAUTHORIZED",
    "message": "请先登录后再继续操作",
    "details": null
  },
  "meta": {
    "request_id": "a738b50e-60fb-46bb-ad90-ae0e476778e5",
    "timestamp": "2026-06-13T08:30:00Z"
  }
}
```

`message` 是可展示的中文说明，不包含堆栈、SQL、模型原始错误或敏感信息。`details` 仅用于安全的结构化补充。

参数错误示例：

```json
{
  "success": false,
  "error": {
    "code": "COMMON_VALIDATION_FAILED",
    "message": "请求参数校验失败",
    "details": {
      "fields": [
        {
          "field": "page_size",
          "reason": "must_be_less_than_or_equal_to_100"
        }
      ]
    }
  },
  "meta": {
    "request_id": "a738b50e-60fb-46bb-ad90-ae0e476778e5",
    "timestamp": "2026-06-13T08:30:00Z"
  }
}
```

## 3. HTTP 状态与错误码

错误码格式固定为 `DOMAIN_REASON`。冻结前缀：

`COMMON`、`AUTH`、`USER`、`RESUME`、`JOB`、`APPLICATION`、`MATCH`、`INTERVIEW`、`TRIAL`、`REPORT`、`AI`、`FILE`、`DEMO`。

| HTTP | 通用语义 | 基线错误码 |
|---|---|---|
| 400 | 请求语义错误 | `COMMON_BAD_REQUEST` |
| 401 | 未登录、凭证无效或过期 | `AUTH_UNAUTHORIZED`、`AUTH_TOKEN_EXPIRED` |
| 403 | 已登录但无资源权限 | `AUTH_FORBIDDEN` |
| 404 | 资源不存在或对当前用户不可见 | `<DOMAIN>_NOT_FOUND` |
| 409 | 唯一性、幂等或状态冲突 | `<DOMAIN>_CONFLICT`、`<DOMAIN>_INVALID_STATE` |
| 413 | 文件超过限制 | `FILE_TOO_LARGE` |
| 415 | 文件类型或 MIME 不支持 | `FILE_UNSUPPORTED_TYPE` |
| 422 | Pydantic 请求校验失败 | `COMMON_VALIDATION_FAILED` |
| 429 | 登录或敏感操作限流 | `AUTH_RATE_LIMITED` |
| 502 | 外部 AI 服务返回无效结果 | `AI_PROVIDER_ERROR`、`AI_INVALID_OUTPUT` |
| 503 | AI 服务暂不可用 | `AI_UNAVAILABLE` |
| 500 | 未分类内部异常 | `COMMON_INTERNAL_ERROR` |

P0 预留的领域错误码：

| 领域 | 错误码 |
|---|---|
| 用户 | `USER_NOT_FOUND`、`USER_CONFLICT`、`USER_INVALID_ROLE` |
| 简历 | `RESUME_NOT_FOUND`、`RESUME_INVALID_STATE`、`RESUME_TEXT_EXTRACTION_FAILED`、`RESUME_PARSE_FAILED` |
| 岗位 | `JOB_NOT_FOUND`、`JOB_INVALID_STATE`、`JOB_PROFILE_NOT_CONFIRMED`、`JOB_PARSE_FAILED` |
| 申请 | `APPLICATION_NOT_FOUND`、`APPLICATION_CONFLICT`、`APPLICATION_INVALID_STATE` |
| 匹配 | `MATCH_NOT_FOUND`、`MATCH_INPUT_NOT_READY`、`MATCH_RULE_FAILED` |
| 面试 | `INTERVIEW_NOT_FOUND`、`INTERVIEW_INVALID_STATE`、`INTERVIEW_SESSION_EXPIRED`、`INTERVIEW_IDEMPOTENCY_CONFLICT` |
| 岗位任务 | `TRIAL_NOT_FOUND`、`TRIAL_INVALID_STATE`、`TRIAL_DEADLINE_PASSED`、`TRIAL_SUBMISSION_LIMIT_REACHED` |
| 报告 | `REPORT_NOT_FOUND`、`REPORT_INVALID_STATE`、`REPORT_NOT_CONFIRMED` |
| AI | `AI_UNAVAILABLE`、`AI_PROVIDER_ERROR`、`AI_TIMEOUT`、`AI_INVALID_OUTPUT`、`AI_FALLBACK_REQUIRED` |
| 文件 | `FILE_TOO_LARGE`、`FILE_UNSUPPORTED_TYPE`、`FILE_MIME_MISMATCH`、`FILE_TEXT_NOT_EXTRACTABLE`、`FILE_ACCESS_DENIED` |
| 演示数据 | `DEMO_SNAPSHOT_NOT_FOUND`、`DEMO_RESET_FORBIDDEN`、`DEMO_IMPORT_FAILED` |

不得使用 HTTP `200` 包装业务失败。不得把同一错误码映射到多个 HTTP 状态。

### 3.1 错误场景示例矩阵

以下场景都使用 2.3 节的统一错误包装，仅替换 HTTP 状态和 `error` 内容：

| 场景 | HTTP | `error.code` | `error.message` | `details` 示例 |
|---|---:|---|---|---|
| 参数错误 | 422 | `COMMON_VALIDATION_FAILED` | 请求参数校验失败 | `{"fields":[{"field":"page_size","reason":"must_be_less_than_or_equal_to_100"}]}` |
| 未认证 | 401 | `AUTH_UNAUTHORIZED` | 请先登录后再继续操作 | `null` |
| 无权限 | 403 | `AUTH_FORBIDDEN` | 你无权访问该资源 | `null` |
| 资源不存在 | 404 | `RESUME_NOT_FOUND` | 简历不存在或不可见 | `{"resource_id":"..."}` |
| 状态冲突 | 409 | `JOB_INVALID_STATE` | 当前岗位状态不允许执行此操作 | `{"current_state":"draft","required_state":"confirmed"}` |
| AI 超时 | 502 | `AI_TIMEOUT` | AI 服务响应超时，请稍后重试 | `{"operation":"resume_parse","retryable":true}` |
| AI 输出非法 | 502 | `AI_INVALID_OUTPUT` | AI 返回结果未通过结构校验 | `{"operation":"job_parse","retryable":true}` |
| AI 不可用 | 503 | `AI_UNAVAILABLE` | AI 服务暂时不可用 | `{"fallback_available":true}` |
| 文件过大 | 413 | `FILE_TOO_LARGE` | 文件大小超过 10MB 限制 | `{"max_bytes":10485760}` |
| 文件类型不支持 | 415 | `FILE_UNSUPPORTED_TYPE` | 仅支持 PDF 和 DOCX 文件 | `{"allowed_extensions":["pdf","docx"]}` |
| MIME 不匹配 | 415 | `FILE_MIME_MISMATCH` | 文件扩展名与内容类型不一致 | `null` |

## 4. 核心实体名称

> 当前实现扩展：除本节 Frozen v1 实体外，迁移已新增 `notifications`、`human_interviewers`、`human_interview_location_templates`、`human_interview_meeting_information`、`human_interview_invitations`、`human_interview_availability_slots`、`human_interview_sessions`、`human_interview_bookings`、`human_interview_booking_participants`、`human_interview_booking_status_history`、`human_interview_reports` 和 `human_interview_audit_records`。这些表已属于当前代码事实，但尚未回写进 Frozen v1 原始实体表。

现有 architecture 实际列出 17 个持久化实体：16 个核心业务/运行实体，加 1 个演示快照实体。以下名称全部冻结：

| 模块 | 实体 |
|---|---|
| `auth_users` | `organizations`、`users` |
| `resumes` | `resumes` |
| `jobs` | `jobs` |
| `profiles` | `candidate_profiles` |
| `applications_matches` | `applications`、`match_results` |
| `interviews` | `interview_question_sets`、`interview_questions`、`interview_question_changes`、`interview_sessions`、`interview_answers` |
| `trials` | `trial_tasks`、`trial_submissions` |
| `reports` | `evaluation_reports` |
| `ai_runs` | `ai_runs` |
| `demo_data` | `demo_snapshots` |

禁止创建 `candidates`、`job_profiles`、`resume_versions`、`agent_runs`、`reports` 等同义表替代上述实体。版本信息作为既有实体字段表达，除非后续基线变更明确新增实体。

### 4.1 当前实际 API 摘要（2026-06-24）

当前 `/api/v1` 已挂载的主要接口包括：

| 模块 | 接口摘要 | 当前说明 |
|---|---|---|
| `auth` | `/auth/register`、`/auth/login`、`/auth/logout`、`/auth/me` | 已实现并有认证测试覆盖。 |
| `hirelink-core` | `/jobs`、`/jobs/{job_id}/parse`、`/resumes`、`/applications`、`/candidate/applications`、`/hr/jobs/{job_id}/candidates`、`/applications/{application_id}`、trial、report、decision、`/ai-runs` | 当前承载核心 demo 闭环，多数数据为 mock/demo。 |
| `human-interviews` | 邀约、撤回、档期、候选人预约、预约详情、pending confirmation、维护任务、取消、改期、状态标记、真人报告提交/发布/读取 | 后端已实现较完整基础闭环，前端尚未接入这些 API。 |
| `notifications` | `/notifications`、`/notifications/{notification_id}/read`、`/notifications/read-all` | 后端已实现，前端当前仍为 localStorage 服务。 |


## 5. 模块间接口

跨模块协作只允许三类输入输出：

1. UUID 实体 ID。
2. 定义在调用方 `schemas.py` 或公共 `app/contracts/` 中的 Pydantic DTO。
3. 定义在 `app/contracts/services.py` 中的显式 Service Protocol。

固定约束：

- Router 只调用本模块 Service。
- Service 可以通过依赖注入调用其他模块公开 Service Protocol。
- Repository 只能操作本模块拥有的 ORM Model。
- 禁止导入其他模块的 Repository、ORM Model 或私有函数。
- 跨模块读取必须由目标模块 Service 完成权限和状态校验。
- 发起方 Service 拥有事务边界；被调用 Service 不得隐式 commit。
- P0 不使用内部 HTTP、事件总线或消息队列完成模块通信。
- 下游结果必须保存实际使用的上游实体 ID 和规则/Schema 版本，禁止只按“当前最新”进行不可追溯关联。

最低公开 Service Protocol：

| Protocol | 最低职责 |
|---|---|
| `UserAccessService` | 获取当前用户角色和组织归属 |
| `ResumeReadService` | 返回已授权的结构化简历 DTO |
| `JobReadService` | 返回已确认岗位画像 DTO |
| `ApplicationAccessService` | 校验申请关系和岗位创建者授权 |
| `ProfileReadService` | 返回指定职业画像及其简历版本 |
| `MatchReadService` | 返回四维分、总分、规则版本和解释输入 |
| `InterviewEvidenceService` | 返回已确认题目和最终回答证据 |
| `TrialEvidenceService` | 返回最终任务提交和 AI 参考评价 |
| `ReportPublicationService` | 查询报告状态并执行确认发布 |

## 6. AI Adapter 契约

业务模块只依赖公共 AI Adapter，不得导入具体供应商 SDK。

结构化生成请求至少包含：

```json
{
  "operation": "resume_parse",
  "schema_version": "resume_parse_v1",
  "prompt_version": "resume_parse_prompt_v1",
  "input": {},
  "context": {
    "actor_id": "7e725fe2-0a53-4a4a-8792-0d965d4b5d26",
    "resource_type": "resume",
    "resource_id": "f7d6d94f-487d-4b20-ae93-952a5ea7451b"
  }
}
```

调用结果至少包含：

```json
{
  "status": "completed",
  "data": {},
  "provider": "mock",
  "model": "mock-structured-v1",
  "prompt_version": "resume_parse_prompt_v1",
  "schema_version": "resume_parse_v1",
  "duration_ms": 12,
  "fallback_source": null
}
```

状态固定为 `pending`、`running`、`completed`、`failed`。使用预置结果时业务结果仍明确记录 `data_source=demo_fallback`，`ai_runs` 记录 `fallback_source`，不得把 fallback 伪装成真实模型完成。

AI 错误分类固定为：

- `timeout`
- `unavailable`
- `provider_error`
- `invalid_output`
- `content_rejected`
- `configuration_error`

Mock Provider 必须：

- 按 `operation + schema_version` 返回确定性结果。
- 支持显式注入超时、失败、非法 JSON 和 fallback 场景。
- 不访问公网。
- 经过与真实 Provider 相同的 Pydantic 输出校验。
- 在调用前后触发 `ai_runs` 记录钩子。

`ai_runs` 摘要只保存脱敏、截断后的输入输出概述，不保存完整 Prompt、完整简历、电话、邮箱或 JWT。

## 7. 日志契约

每条应用日志至少包含：

| 字段 | 说明 |
|---|---|
| `timestamp` | UTC ISO 8601 时间 |
| `level` | `debug/info/warning/error/critical` |
| `event` | 稳定事件名，例如 `resume.parse.completed` |
| `request_id` | 请求追踪 ID；非请求任务使用 operation ID |
| `module` | 模块名 |
| `user_id` | 已认证用户 UUID；匿名请求为 `null` |
| `duration_ms` | 有耗时意义时填写，否则为 `null` |
| `error_code` | 发生业务错误时填写，否则为 `null` |

允许补充 `resource_type`、`resource_id`、`ai_run_id`、`http_method`、`http_path`、`http_status`。

禁止记录：

- 明文密码、密码哈希、JWT、Cookie、API Key。
- 完整简历、JD、面试回答、任务提交和报告正文。
- 电话、邮箱、身份证号等直接身份信息。
- 完整 Prompt、模型完整原始响应和文件二进制内容。
- SQL 参数中的敏感正文。

未知异常只在服务端日志记录安全堆栈，对外固定返回 `COMMON_INTERNAL_ERROR`。

## 8. 契约验收场景

契约测试必须覆盖：

1. 成功对象响应。
2. 成功分页响应和空列表。
3. `COMMON_VALIDATION_FAILED` 参数错误。
4. `AUTH_UNAUTHORIZED` 未认证。
5. `AUTH_FORBIDDEN` 无资源权限。
6. 领域 `NOT_FOUND`。
7. 领域 `INVALID_STATE` 或 `CONFLICT`。
8. `AI_TIMEOUT`、`AI_INVALID_OUTPUT` 和 `AI_UNAVAILABLE`。
9. `FILE_TOO_LARGE`、`FILE_UNSUPPORTED_TYPE` 和 `FILE_MIME_MISMATCH`。
10. 未知异常脱敏并映射为 `COMMON_INTERNAL_ERROR`。

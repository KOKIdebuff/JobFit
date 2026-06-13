from dataclasses import dataclass
from enum import StrEnum


class ErrorCode(StrEnum):
    COMMON_BAD_REQUEST = "COMMON_BAD_REQUEST"
    COMMON_VALIDATION_FAILED = "COMMON_VALIDATION_FAILED"
    COMMON_INTERNAL_ERROR = "COMMON_INTERNAL_ERROR"
    AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED"
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    AUTH_FORBIDDEN = "AUTH_FORBIDDEN"
    AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    USER_CONFLICT = "USER_CONFLICT"
    USER_INVALID_ROLE = "USER_INVALID_ROLE"
    RESUME_NOT_FOUND = "RESUME_NOT_FOUND"
    RESUME_INVALID_STATE = "RESUME_INVALID_STATE"
    RESUME_TEXT_EXTRACTION_FAILED = "RESUME_TEXT_EXTRACTION_FAILED"
    RESUME_PARSE_FAILED = "RESUME_PARSE_FAILED"
    JOB_NOT_FOUND = "JOB_NOT_FOUND"
    JOB_CONFLICT = "JOB_CONFLICT"
    JOB_INVALID_STATE = "JOB_INVALID_STATE"
    JOB_PROFILE_NOT_CONFIRMED = "JOB_PROFILE_NOT_CONFIRMED"
    JOB_PARSE_FAILED = "JOB_PARSE_FAILED"
    APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND"
    APPLICATION_CONFLICT = "APPLICATION_CONFLICT"
    APPLICATION_INVALID_STATE = "APPLICATION_INVALID_STATE"
    MATCH_NOT_FOUND = "MATCH_NOT_FOUND"
    MATCH_CONFLICT = "MATCH_CONFLICT"
    MATCH_INPUT_NOT_READY = "MATCH_INPUT_NOT_READY"
    MATCH_RULE_FAILED = "MATCH_RULE_FAILED"
    INTERVIEW_NOT_FOUND = "INTERVIEW_NOT_FOUND"
    INTERVIEW_CONFLICT = "INTERVIEW_CONFLICT"
    INTERVIEW_INVALID_STATE = "INTERVIEW_INVALID_STATE"
    INTERVIEW_SESSION_EXPIRED = "INTERVIEW_SESSION_EXPIRED"
    INTERVIEW_IDEMPOTENCY_CONFLICT = "INTERVIEW_IDEMPOTENCY_CONFLICT"
    TRIAL_NOT_FOUND = "TRIAL_NOT_FOUND"
    TRIAL_CONFLICT = "TRIAL_CONFLICT"
    TRIAL_INVALID_STATE = "TRIAL_INVALID_STATE"
    TRIAL_DEADLINE_PASSED = "TRIAL_DEADLINE_PASSED"
    TRIAL_SUBMISSION_LIMIT_REACHED = "TRIAL_SUBMISSION_LIMIT_REACHED"
    REPORT_NOT_FOUND = "REPORT_NOT_FOUND"
    REPORT_CONFLICT = "REPORT_CONFLICT"
    REPORT_INVALID_STATE = "REPORT_INVALID_STATE"
    REPORT_NOT_CONFIRMED = "REPORT_NOT_CONFIRMED"
    AI_UNAVAILABLE = "AI_UNAVAILABLE"
    AI_PROVIDER_ERROR = "AI_PROVIDER_ERROR"
    AI_TIMEOUT = "AI_TIMEOUT"
    AI_INVALID_OUTPUT = "AI_INVALID_OUTPUT"
    AI_FALLBACK_REQUIRED = "AI_FALLBACK_REQUIRED"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    FILE_UNSUPPORTED_TYPE = "FILE_UNSUPPORTED_TYPE"
    FILE_MIME_MISMATCH = "FILE_MIME_MISMATCH"
    FILE_TEXT_NOT_EXTRACTABLE = "FILE_TEXT_NOT_EXTRACTABLE"
    FILE_ACCESS_DENIED = "FILE_ACCESS_DENIED"
    DEMO_SNAPSHOT_NOT_FOUND = "DEMO_SNAPSHOT_NOT_FOUND"
    DEMO_CONFLICT = "DEMO_CONFLICT"
    DEMO_RESET_FORBIDDEN = "DEMO_RESET_FORBIDDEN"
    DEMO_IMPORT_FAILED = "DEMO_IMPORT_FAILED"


@dataclass(frozen=True, slots=True)
class ErrorDefinition:
    status_code: int
    message: str


ERROR_DEFINITIONS: dict[ErrorCode, ErrorDefinition] = {
    ErrorCode.COMMON_BAD_REQUEST: ErrorDefinition(400, "请求无法处理"),
    ErrorCode.COMMON_VALIDATION_FAILED: ErrorDefinition(422, "请求参数校验失败"),
    ErrorCode.COMMON_INTERNAL_ERROR: ErrorDefinition(500, "服务内部错误，请稍后重试"),
    ErrorCode.AUTH_UNAUTHORIZED: ErrorDefinition(401, "请先登录后再继续操作"),
    ErrorCode.AUTH_TOKEN_EXPIRED: ErrorDefinition(401, "登录状态已过期，请重新登录"),
    ErrorCode.AUTH_FORBIDDEN: ErrorDefinition(403, "你无权访问该资源"),
    ErrorCode.AUTH_RATE_LIMITED: ErrorDefinition(429, "操作过于频繁，请稍后重试"),
    ErrorCode.USER_NOT_FOUND: ErrorDefinition(404, "用户不存在或不可见"),
    ErrorCode.USER_CONFLICT: ErrorDefinition(409, "用户信息存在冲突"),
    ErrorCode.USER_INVALID_ROLE: ErrorDefinition(400, "用户角色无效"),
    ErrorCode.RESUME_NOT_FOUND: ErrorDefinition(404, "简历不存在或不可见"),
    ErrorCode.RESUME_INVALID_STATE: ErrorDefinition(409, "当前简历状态不允许执行此操作"),
    ErrorCode.RESUME_TEXT_EXTRACTION_FAILED: ErrorDefinition(400, "简历文本提取失败"),
    ErrorCode.RESUME_PARSE_FAILED: ErrorDefinition(400, "简历解析失败"),
    ErrorCode.JOB_NOT_FOUND: ErrorDefinition(404, "岗位不存在或不可见"),
    ErrorCode.JOB_CONFLICT: ErrorDefinition(409, "岗位信息存在冲突"),
    ErrorCode.JOB_INVALID_STATE: ErrorDefinition(409, "当前岗位状态不允许执行此操作"),
    ErrorCode.JOB_PROFILE_NOT_CONFIRMED: ErrorDefinition(409, "岗位画像尚未确认"),
    ErrorCode.JOB_PARSE_FAILED: ErrorDefinition(400, "岗位解析失败"),
    ErrorCode.APPLICATION_NOT_FOUND: ErrorDefinition(404, "申请记录不存在或不可见"),
    ErrorCode.APPLICATION_CONFLICT: ErrorDefinition(409, "申请记录存在冲突"),
    ErrorCode.APPLICATION_INVALID_STATE: ErrorDefinition(409, "当前申请状态不允许执行此操作"),
    ErrorCode.MATCH_NOT_FOUND: ErrorDefinition(404, "匹配结果不存在或不可见"),
    ErrorCode.MATCH_CONFLICT: ErrorDefinition(409, "匹配结果存在冲突"),
    ErrorCode.MATCH_INPUT_NOT_READY: ErrorDefinition(409, "匹配输入尚未准备完成"),
    ErrorCode.MATCH_RULE_FAILED: ErrorDefinition(500, "匹配规则执行失败"),
    ErrorCode.INTERVIEW_NOT_FOUND: ErrorDefinition(404, "面试记录不存在或不可见"),
    ErrorCode.INTERVIEW_CONFLICT: ErrorDefinition(409, "面试记录存在冲突"),
    ErrorCode.INTERVIEW_INVALID_STATE: ErrorDefinition(409, "当前面试状态不允许执行此操作"),
    ErrorCode.INTERVIEW_SESSION_EXPIRED: ErrorDefinition(409, "面试会话已过期"),
    ErrorCode.INTERVIEW_IDEMPOTENCY_CONFLICT: ErrorDefinition(409, "面试请求幂等键冲突"),
    ErrorCode.TRIAL_NOT_FOUND: ErrorDefinition(404, "岗位任务不存在或不可见"),
    ErrorCode.TRIAL_CONFLICT: ErrorDefinition(409, "岗位任务存在冲突"),
    ErrorCode.TRIAL_INVALID_STATE: ErrorDefinition(409, "当前岗位任务状态不允许执行此操作"),
    ErrorCode.TRIAL_DEADLINE_PASSED: ErrorDefinition(409, "岗位任务已超过截止时间"),
    ErrorCode.TRIAL_SUBMISSION_LIMIT_REACHED: ErrorDefinition(409, "岗位任务提交次数已达上限"),
    ErrorCode.REPORT_NOT_FOUND: ErrorDefinition(404, "报告不存在或不可见"),
    ErrorCode.REPORT_CONFLICT: ErrorDefinition(409, "报告存在冲突"),
    ErrorCode.REPORT_INVALID_STATE: ErrorDefinition(409, "当前报告状态不允许执行此操作"),
    ErrorCode.REPORT_NOT_CONFIRMED: ErrorDefinition(403, "报告尚未确认发布"),
    ErrorCode.AI_UNAVAILABLE: ErrorDefinition(503, "AI 服务暂时不可用"),
    ErrorCode.AI_PROVIDER_ERROR: ErrorDefinition(502, "AI 服务返回异常"),
    ErrorCode.AI_TIMEOUT: ErrorDefinition(502, "AI 服务响应超时，请稍后重试"),
    ErrorCode.AI_INVALID_OUTPUT: ErrorDefinition(502, "AI 返回结果未通过结构校验"),
    ErrorCode.AI_FALLBACK_REQUIRED: ErrorDefinition(503, "AI 服务失败，需要使用兜底结果"),
    ErrorCode.FILE_TOO_LARGE: ErrorDefinition(413, "文件大小超过限制"),
    ErrorCode.FILE_UNSUPPORTED_TYPE: ErrorDefinition(415, "文件类型不受支持"),
    ErrorCode.FILE_MIME_MISMATCH: ErrorDefinition(415, "文件扩展名与内容类型不一致"),
    ErrorCode.FILE_TEXT_NOT_EXTRACTABLE: ErrorDefinition(415, "文件不包含可提取文本"),
    ErrorCode.FILE_ACCESS_DENIED: ErrorDefinition(403, "你无权访问该文件"),
    ErrorCode.DEMO_SNAPSHOT_NOT_FOUND: ErrorDefinition(404, "演示数据快照不存在"),
    ErrorCode.DEMO_CONFLICT: ErrorDefinition(409, "演示数据状态存在冲突"),
    ErrorCode.DEMO_RESET_FORBIDDEN: ErrorDefinition(403, "当前环境不允许重置演示数据"),
    ErrorCode.DEMO_IMPORT_FAILED: ErrorDefinition(500, "演示数据导入失败"),
}

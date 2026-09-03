export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta: {
    request_id: string;
    timestamp: string;
    pagination?: unknown;
  };
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  };
  meta?: {
    request_id: string;
    timestamp: string;
  };
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown> | null;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown> | null,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const NETWORK_ERROR_MESSAGE =
  "无法连接到 HireLink API，请确认后端 http://127.0.0.1:8000 已启动并已完成数据库迁移。";

export function getApiBaseUrl() {
  const envBaseUrl = import.meta.env.VITE_HIRELINK_API_BASE_URL as string | undefined;
  return (envBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch (error) {
    throw new ApiError(NETWORK_ERROR_MESSAGE, "COMMON_NETWORK_ERROR", 0, {
      path,
      reason: error instanceof Error ? error.message : "network_error",
    });
  }

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok || !payload || payload.success === false) {
    const failure = payload && payload.success === false ? payload : null;
    throw new ApiError(
      failure?.error.message || "请求失败，请稍后重试",
      failure?.error.code || "COMMON_BAD_REQUEST",
      response.status,
      failure?.error.details,
    );
  }

  return payload.data;
}

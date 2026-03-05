export interface ApiErrorPayload {
  error?: string;
  message?: string;
}

export interface AuthUser {
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  is_email_verified?: boolean;
  is_2fa_enabled?: boolean;
  has_password?: boolean;
  oauth_provider?: string;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user?: AuthUser;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  organization?: string;
}

export interface RegisterResponse {
  message?: string;
  user?: AuthUser;
}

export interface OAuthCallbackResponse {
  access_token: string;
  refresh_token: string;
  is_new_user: boolean;
}

const resolveApiBase = (): string => {
  const env =
    typeof globalThis !== "undefined"
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
      : undefined;

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocal) {
    return "http://localhost:5000";
  }

  const envBase = (env?.REACT_APP_API_BASE || env?.REACT_APP_API_URL || "").trim();
  return (envBase || "https://cursa.onrender.com").replace(/\/+$/, "");
};

export const API_BASE = resolveApiBase();

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") || "";

  let parsed: unknown = null;
  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const payload = (parsed as ApiErrorPayload | null) || null;
    const apiMessage = payload?.error || payload?.message;
    if (apiMessage) {
      throw new ApiError(apiMessage, response.status);
    }

    const looksLikeHtml = /<!doctype|<html/i.test(rawBody.trim());
    if (looksLikeHtml || !contentType.includes("application/json")) {
      throw new ApiError(
        "Сервер вернул HTML вместо JSON. Проверьте REACT_APP_API_BASE/REACT_APP_API_URL и доступность backend API.",
        response.status,
      );
    }

    throw new ApiError(`Ошибка запроса (${response.status})`, response.status);
  }

  if (!parsed) {
    throw new ApiError("Сервер вернул пустой или некорректный JSON-ответ", response.status);
  }

  return parsed as T;
};

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
  baseUrl: string = API_BASE,
): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, init);
  return parseJsonResponse<T>(response);
};

const isFallbackEligibleError = (error: unknown): boolean => {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // Fallback for legacy backends where the new endpoint path is missing.
  return error.status === 404 || /html вместо json|html instead of json/i.test(error.message);
};

const apiFetchWithFallback = async <T>(
  paths: string[],
  init?: RequestInit,
  baseUrl: string = API_BASE,
): Promise<T> => {
  let lastError: unknown;

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    try {
      return await apiFetch<T>(path, init, baseUrl);
    } catch (error) {
      lastError = error;
      const hasMoreFallbacks = index < paths.length - 1;
      if (!hasMoreFallbacks || !isFallbackEligibleError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError("Не удалось выполнить запрос к API");
};

const blobFetchWithFallback = async (
  paths: string[],
  init?: RequestInit,
  baseUrl: string = API_BASE,
): Promise<Blob> => {
  let lastStatus: number | undefined;

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    const response = await fetch(`${baseUrl}${path}`, init);
    if (response.ok) {
      return response.blob();
    }

    lastStatus = response.status;
    const hasMoreFallbacks = index < paths.length - 1;
    if (!hasMoreFallbacks || response.status !== 404) {
      throw new ApiError(`Ошибка загрузки документа (${response.status})`, response.status);
    }
  }

  throw new ApiError(`Ошибка загрузки документа (${lastStatus ?? 500})`, lastStatus ?? 500);
};

export const authApi = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  me: (accessToken: string): Promise<{ user?: AuthUser } | AuthUser> =>
    apiFetch<{ user?: AuthUser } | AuthUser>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  refresh: (refreshToken: string): Promise<RefreshResponse> =>
    apiFetch<RefreshResponse>("/api/auth/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),

  register: (payload: RegisterRequest): Promise<RegisterResponse> =>
    apiFetch<RegisterResponse>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  oauthCallback: (provider: string, code: string): Promise<OAuthCallbackResponse> =>
    apiFetch<OAuthCallbackResponse>(`/api/auth/oauth/${provider}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }),
};

// ============================================================================
// Documents API
// ============================================================================

export interface DocumentProfile {
  id: string;
  name: string;
  description?: string;
  rules?: Record<string, unknown>;
}

export interface ValidationIssueDetail {
  line?: number;
  column?: number;
  severity: "low" | "medium" | "high";
  message: string;
  rule_id?: string;
  suggestion?: string;
}

export interface ValidationResponse {
  status: "success" | "error";
  document_id: string;
  profile_id: string;
  score: number;
  issues: ValidationIssueDetail[];
  corrected_document_url?: string;
  analysis_time_ms: number;
  message?: string;
}

export const documentsApi = {
  /**
   * Upload and validate a document
   */
  validate: (file: File, profileId: string, accessToken?: string): Promise<ValidationResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("profile_id", profileId);
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    return apiFetchWithFallback<ValidationResponse>(
      ["/api/documents/validate", "/api/document/analyze"],
      {
        method: "POST",
        headers,
        body: formData,
      },
    );
  },

  /**
   * Get all profiles available for validation
   */
  getProfiles: (accessToken?: string): Promise<DocumentProfile[]> =>
    apiFetchWithFallback<DocumentProfile[]>(["/api/documents/profiles", "/api/profiles/"], {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }),

  /**
   * Get specific profile by ID
   */
  getProfile: (profileId: string, accessToken?: string): Promise<DocumentProfile> =>
    apiFetchWithFallback<DocumentProfile>(
      [`/api/documents/profiles/${profileId}`, `/api/profiles/${profileId}`],
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      },
    ),

  /**
   * Download corrected document
   */
  downloadCorrected: async (documentId: string, accessToken?: string): Promise<Blob> => {
    return blobFetchWithFallback(
      [
        `/api/documents/${documentId}/corrected`,
        `/api/document/download-corrected?path=${encodeURIComponent(documentId)}`,
      ],
      { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined },
    );
  },
};

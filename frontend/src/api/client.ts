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

export interface UpdateAccountProfileRequest {
  first_name: string;
  last_name?: string;
  organization?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface Setup2FAResponse {
  qr_code: string;
  secret: string;
}

export interface Enable2FARequest {
  secret: string;
  token: string;
}

export interface Enable2FAResponse {
  backup_codes: string[];
}

export interface ProfileHistoryVersion {
  filename: string;
  timestamp?: string;
  version?: string | number;
  [key: string]: unknown;
}

export interface ProfileHistoryResponse<TVersion = ProfileHistoryVersion> {
  versions?: TVersion[];
}

export interface ProfileTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  [key: string]: unknown;
}

export interface AdminSuccessResponse {
  success: boolean;
  [key: string]: unknown;
}

export interface AiKeyStatus {
  has_key?: boolean;
  masked_key?: string | null;
  configured_at?: string | null;
  [key: string]: unknown;
}

export interface AiKeyResponse<TStatus = AiKeyStatus> extends AdminSuccessResponse {
  status?: TStatus;
}

export interface AdminNotification {
  id: string | number;
  message: string;
  level?: string;
  timestamp?: string;
  read?: boolean;
  source?: string;
  [key: string]: unknown;
}

export interface NotificationsResponse<
  TNotification = AdminNotification,
> extends AdminSuccessResponse {
  notifications?: TNotification[];
  unread_count?: number;
  total_count?: number;
}

export interface PreviewResponse {
  html?: string;
  [key: string]: unknown;
}

export interface MemeResponse {
  url?: string;
  title?: string;
  postLink?: string;
  author?: string;
  [key: string]: unknown;
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

export const getApiErrorMessage = (error: unknown, fallback = "Unknown error"): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

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

/**
 * Выполняет запрос с автоматическим повтором при rate limiting (429).
 * Использует exponential backoff: 500ms, 1s, 2s, 4s, 8s.
 */
const apiFetchWithRetry = async <T>(
  path: string,
  init?: RequestInit,
  baseUrl: string = API_BASE,
  maxRetries: number = 5,
): Promise<T> => {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      return await parseJsonResponse<T>(response);
    } catch (error) {
      // Если это не ApiError или не 429, бросаем сразу
      if (!(error instanceof ApiError) || error.status !== 429) {
        throw error;
      }

      attempt++;

      // Если достигли максимума попыток, бросаем ошибку
      if (attempt >= maxRetries) {
        throw error;
      }

      // Exponential backoff: 500ms * 2^attempt
      const delay = 500 * Math.pow(2, attempt - 1);

      console.warn(
        `[API] Rate limit exceeded (429). Retry ${attempt}/${maxRetries - 1} after ${delay}ms...`,
      );

      // Ждем перед следующей попыткой
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // На всякий случай, хотя сюда не должны попасть
  throw new ApiError("Превышено максимальное количество попыток запроса", 429);
};

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
  baseUrl: string = API_BASE,
): Promise<T> => {
  return apiFetchWithRetry<T>(path, init, baseUrl);
};

const buildJsonHeaders = (accessToken?: string, extraHeaders?: HeadersInit): HeadersInit => {
  const baseHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    baseHeaders.Authorization = `Bearer ${accessToken}`;
  }

  if (!extraHeaders) {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    ...(extraHeaders as Record<string, string>),
  };
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
  const maxRetries = 5;

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(`${baseUrl}${path}`, init);

        if (response.ok) {
          return response.blob();
        }

        lastStatus = response.status;

        // Если 429, пытаемся повторить с backoff
        if (response.status === 429 && attempt < maxRetries - 1) {
          attempt++;
          const delay = 500 * Math.pow(2, attempt - 1);
          console.warn(
            `[API] Rate limit exceeded (429) for blob download. Retry ${attempt}/${maxRetries - 1} after ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Если есть fallback пути и это 404, пробуем следующий путь
        const hasMoreFallbacks = index < paths.length - 1;
        if (hasMoreFallbacks && response.status === 404) {
          break; // Переходим к следующему пути
        }

        throw new ApiError(`Ошибка загрузки документа (${response.status})`, response.status);
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        // Сетевая ошибка - тоже пытаемся повторить
        if (attempt < maxRetries - 1) {
          attempt++;
          const delay = 500 * Math.pow(2, attempt - 1);
          console.warn(
            `[API] Network error for blob download. Retry ${attempt}/${maxRetries - 1} after ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new ApiError("Ошибка сети при загрузке документа", lastStatus);
      }
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

export const accountApi = {
  updateMe: <TUser extends AuthUser>(
    payload: UpdateAccountProfileRequest,
    accessToken: string,
  ): Promise<{ user: TUser }> =>
    apiFetch<{ user: TUser }>("/api/auth/me", {
      method: "PUT",
      headers: buildJsonHeaders(accessToken),
      body: JSON.stringify(payload),
    }),

  changePassword: (
    payload: ChangePasswordRequest,
    accessToken: string,
  ): Promise<Record<string, unknown>> =>
    apiFetch<Record<string, unknown>>("/api/auth/change-password", {
      method: "POST",
      headers: buildJsonHeaders(accessToken),
      body: JSON.stringify(payload),
    }),

  setup2fa: (accessToken: string): Promise<Setup2FAResponse> =>
    apiFetch<Setup2FAResponse>("/api/auth/2fa/setup", {
      method: "POST",
      headers: buildJsonHeaders(accessToken),
      body: JSON.stringify({}),
    }),

  enable2fa: (payload: Enable2FARequest, accessToken: string): Promise<Enable2FAResponse> =>
    apiFetch<Enable2FAResponse>("/api/auth/2fa/enable", {
      method: "POST",
      headers: buildJsonHeaders(accessToken),
      body: JSON.stringify(payload),
    }),

  disable2fa: (accessToken: string): Promise<Record<string, unknown>> =>
    apiFetch<Record<string, unknown>>("/api/auth/2fa/disable", {
      method: "POST",
      headers: buildJsonHeaders(accessToken),
      body: JSON.stringify({}),
    }),

  resendVerification: (accessToken: string): Promise<Record<string, unknown>> =>
    apiFetch<Record<string, unknown>>("/api/auth/resend-verification", {
      method: "POST",
      headers: buildJsonHeaders(accessToken),
      body: JSON.stringify({}),
    }),
};

export const profilesApi = {
  list: <TProfile>(): Promise<TProfile[]> => apiFetch<TProfile[]>("/api/profiles/"),

  getById: <TProfile>(id: string): Promise<TProfile> => apiFetch<TProfile>(`/api/profiles/${id}`),

  listHistory: <TResponse = ProfileHistoryResponse>(id: string): Promise<TResponse> =>
    apiFetch<TResponse>(`/api/profiles/${id}/history`),

  getHistoryVersion: <TResponse>(id: string, filename: string): Promise<TResponse> =>
    apiFetch<TResponse>(`/api/profiles/${id}/history/${encodeURIComponent(filename)}`),

  restoreVersion: <TResponse = Record<string, unknown>>(
    id: string,
    filename: string,
  ): Promise<TResponse> =>
    apiFetch<TResponse>(`/api/profiles/${id}/restore/${encodeURIComponent(filename)}`, {
      method: "POST",
    }),

  getTemplates: <TTemplate = ProfileTemplate>(): Promise<TTemplate[]> =>
    apiFetch<TTemplate[]>("/api/profiles/templates"),

  validate: <TResponse>(id: string): Promise<TResponse> =>
    apiFetch<TResponse>(`/api/profiles/${id}/validate`, {
      method: "POST",
    }),

  create: <TResponse, TBody>(payload: TBody): Promise<TResponse> =>
    apiFetch<TResponse>("/api/profiles/", {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
    }),

  update: <TResponse, TBody>(id: string, payload: TBody): Promise<TResponse> =>
    apiFetch<TResponse>(`/api/profiles/${id}`, {
      method: "PUT",
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
    }),

  duplicate: <TResponse>(id: string): Promise<TResponse> =>
    apiFetch<TResponse>(`/api/profiles/${id}/duplicate`, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({}),
    }),

  remove: (id: string): Promise<Record<string, unknown>> =>
    apiFetch<Record<string, unknown>>(`/api/profiles/${id}`, {
      method: "DELETE",
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
  status?: "success" | "error";
  success?: boolean;
  document_id?: string;
  document_token?: string;
  profile_id?: string;
  score?: number;
  issues?: ValidationIssueDetail[];
  corrected_document_url?: string;
  corrected_file_path?: string;
  temp_path?: string;
  filename?: string;
  analysis_time_ms?: number;
  check_results?: {
    score?: number;
    total_issues_count?: number;
    issues?: Array<{
      severity?: string;
      description?: string;
      location?: string;
      auto_fixable?: boolean;
      type?: string;
      rule_name?: string;
    }>;
    profile?: {
      id?: string;
      name?: string;
    };
  };
  message?: string;
}

export interface AutocorrectResponse {
  success: boolean;
  corrected_file_path?: string;
  corrected_path?: string;
  original_preview_path?: string;
  filename?: string;
  original_filename?: string;
  correction_id?: string;
  multipass?: boolean;
  improvement?: {
    before_total_issues?: number;
    after_total_issues?: number;
    resolved_total_issues?: number;
    before_font_issues?: number;
    after_font_issues?: number;
    resolved_font_issues?: number;
  };
  report?: {
    passes_completed?: number;
    total_issues_found?: number;
    total_issues_fixed?: number;
    remaining_issues?: number;
    success_rate?: number;
    duration_seconds?: number;
    actions_by_phase?: Record<string, number>;
    actions_by_type?: Record<string, number>;
    verification_results?: Record<string, { passed?: boolean; message?: string }>;
  };
  check_results?: ValidationResponse["check_results"];
}

export const documentsApi = {
  upload: (file: File, profileId = "default_ghost", accessToken?: string): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("profile_id", profileId);
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

    return apiFetch<unknown>("/api/document/upload", {
      method: "POST",
      headers,
      body: formData,
    });
  },

  uploadBatch: (
    files: File[],
    profileId = "default_ghost",
    accessToken?: string,
  ): Promise<unknown> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("profile_id", profileId);
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

    return apiFetch<unknown>("/api/document/upload-batch", {
      method: "POST",
      headers,
      body: formData,
    });
  },

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

  autocorrect: (
    documentToken: string,
    originalFilename: string,
    accessToken?: string,
  ): Promise<AutocorrectResponse> => {
    const headers = buildJsonHeaders(accessToken);
    const body = JSON.stringify({
      document_token: documentToken,
      original_filename: originalFilename,
      max_passes: 3,
      verbose: false,
    });

    return apiFetch<AutocorrectResponse>("/api/document/autocorrect", {
      method: "POST",
      headers,
      body,
    });
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

export const aiApi = {
  saveKey: <TStatus = AiKeyStatus>(apiKey: string): Promise<AiKeyResponse<TStatus>> =>
    apiFetch<AiKeyResponse<TStatus>>("/api/document/ai/key", {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ api_key: apiKey }),
    }),

  clearKey: <TStatus = AiKeyStatus>(): Promise<AiKeyResponse<TStatus>> =>
    apiFetch<AiKeyResponse<TStatus>>("/api/document/ai/key", {
      method: "DELETE",
    }),
};

export const notificationsApi = {
  list: <TNotification = AdminNotification>(
    limit = 10,
  ): Promise<NotificationsResponse<TNotification>> =>
    apiFetch<NotificationsResponse<TNotification>>(
      `/api/document/admin/alerts/notifications?limit=${encodeURIComponent(String(limit))}`,
    ),

  markAsRead: (notificationId: string | number): Promise<AdminSuccessResponse> =>
    apiFetch<AdminSuccessResponse>(
      `/api/document/admin/alerts/notifications/${encodeURIComponent(String(notificationId))}/read`,
      {
        method: "POST",
      },
    ),

  markAllAsRead: (): Promise<AdminSuccessResponse> =>
    apiFetch<AdminSuccessResponse>("/api/document/admin/alerts/notifications/read-all", {
      method: "POST",
    }),

  clearAll: (): Promise<AdminSuccessResponse> =>
    apiFetch<AdminSuccessResponse>("/api/document/admin/alerts/notifications/clear", {
      method: "POST",
    }),
};

export const previewsApi = {
  generate: (path: string): Promise<PreviewResponse> =>
    apiFetch<PreviewResponse>("/api/preview/generate", {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ path }),
    }),
};

export const healthApi = {
  getDetailed: <TResponse>(): Promise<TResponse> => apiFetch<TResponse>("/api/health/detailed"),
};

export const memeApi = {
  getRandom: <TResponse = MemeResponse>(): Promise<TResponse> =>
    apiFetch<TResponse>("/api/document/memes/random"),
};

export const adminApi = {
  listCorrections: <TFile>(): Promise<{ files?: TFile[] }> =>
    apiFetch<{ files?: TFile[] }>("/api/document/list-corrections"),

  deleteCorrection: (filename: string): Promise<AdminSuccessResponse> =>
    apiFetch<AdminSuccessResponse>(`/api/document/admin/files/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    }),

  cleanupCorrections: (
    days: number,
  ): Promise<
    AdminSuccessResponse & {
      deleted_count?: number;
      kept_count?: number;
    }
  > =>
    apiFetch<AdminSuccessResponse & { deleted_count?: number; kept_count?: number }>(
      "/api/document/admin/cleanup",
      {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify({ days }),
      },
    ),

  getLogs: (lines: number): Promise<{ logs?: string[] }> =>
    apiFetch<{ logs?: string[] }>(
      `/api/document/admin/logs?lines=${encodeURIComponent(String(lines))}`,
    ),

  backupLogs: (clearAfterBackup: boolean): Promise<AdminSuccessResponse> =>
    apiFetch<AdminSuccessResponse>("/api/document/admin/backup/logs", {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ clear_after_backup: clearAfterBackup }),
    }),

  listLogBackups: <TBackup>(): Promise<{ backups?: TBackup[] }> =>
    apiFetch<{ backups?: TBackup[] }>("/api/document/admin/backup/logs"),

  restoreLogs: <TRestoreResponse = AdminSuccessResponse, TPayload = Record<string, unknown>>(
    filename: string,
    payload: TPayload,
  ): Promise<TRestoreResponse> =>
    apiFetch<TRestoreResponse>(
      `/api/document/admin/backup/logs/restore/${encodeURIComponent(filename)}`,
      {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify(payload),
      },
    ),

  deleteLogBackup: (filename: string): Promise<AdminSuccessResponse> =>
    apiFetch<AdminSuccessResponse>(
      `/api/document/admin/backup/logs/${encodeURIComponent(filename)}`,
      {
        method: "DELETE",
      },
    ),

  getSystemInfo: <TSystemInfo>(): Promise<TSystemInfo> =>
    apiFetch<TSystemInfo>("/api/document/admin/system-info"),

  getStatistics: <TStatistics>(
    days: number,
  ): Promise<{ success: boolean; statistics: TStatistics }> =>
    apiFetch<{ success: boolean; statistics: TStatistics }>(
      `/api/document/admin/statistics?days=${encodeURIComponent(String(days))}`,
    ),

  getAlertsConfig: <TConfig>(): Promise<{ success: boolean; config: TConfig }> =>
    apiFetch<{ success: boolean; config: TConfig }>("/api/document/admin/alerts/config"),

  updateAlertsConfig: <TConfig>(payload: TConfig): Promise<AdminSuccessResponse> =>
    apiFetch<AdminSuccessResponse>("/api/document/admin/alerts/config", {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify(payload),
    }),

  getCorrectionDownloadUrl: (filename: string): string =>
    `${API_BASE}/corrections/${encodeURIComponent(filename)}`,

  getLogBackupDownloadUrl: (filename: string): string =>
    `${API_BASE}/api/document/admin/backup/logs/download/${encodeURIComponent(filename)}`,

  getSystemInfoExportUrl: (format: "txt" | "csv" = "txt"): string =>
    `${API_BASE}/api/document/admin/system-info/export?format=${encodeURIComponent(format)}`,

  getStatisticsExportUrl: (days: number, format: "txt" | "csv" = "txt"): string =>
    `${API_BASE}/api/document/admin/statistics/export?days=${encodeURIComponent(String(days))}&format=${encodeURIComponent(format)}`,
};

// ---------------------------------------------------------------------------
// Payments API
// ---------------------------------------------------------------------------

export interface PlanLimits {
  checks_per_day: number; // -1 = unlimited
  checks_per_month: number;
  max_file_size_mb: number;
  api_access: boolean;
  auto_correction: boolean;
  batch_processing: boolean;
  custom_profiles: number;
  team_members: number;
}

export interface Plan {
  key: string;
  id: string;
  name: string;
  price_rub: number;
  price_usd: number;
  role: string;
  limits: PlanLimits;
  features: string[];
}

export interface SubscriptionInfo {
  plan_key: string;
  plan_name: string;
  plan_limits: PlanLimits;
  plan_features: string[];
  price_rub: number;
  price_usd: number;
  role: string;
  subscription_id: number | null;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  auto_renew: boolean;
}

export interface PaymentRecord {
  id: number;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  transaction_id: string;
  description: string;
  created_at: string;
  completed_at: string | null;
}

export interface SubscribeRequest {
  plan_key: string;
  payment_method?: "mock" | "stripe" | "yookassa";
  payment_token?: string;
  billing_cycle?: "monthly" | "yearly";
  promo_code?: string;
}

export interface SubscribeResponse {
  subscription_id: number;
  plan_key: string;
  plan_name: string;
  status: string;
  expires_at: string;
  payment_id: string;
  billing_cycle: "monthly" | "yearly";
  original_amount: number;
  final_amount: number;
  discount_percent: number;
  promo_code_applied?: string | null;
  duration_days: number;
}

export const paymentsApi = {
  getPlans: (accessToken?: string): Promise<{ success: boolean; data: Plan[] }> =>
    apiFetch<{ success: boolean; data: Plan[] }>("/api/payments/plans", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }),

  getPlan: (planKey: string): Promise<{ success: boolean; data: Plan }> =>
    apiFetch<{ success: boolean; data: Plan }>(
      `/api/payments/plans/${encodeURIComponent(planKey)}`,
    ),

  getSubscription: (accessToken: string): Promise<{ success: boolean; data: SubscriptionInfo }> =>
    apiFetch<{ success: boolean; data: SubscriptionInfo }>("/api/payments/subscription", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  subscribe: (
    payload: SubscribeRequest,
    accessToken: string,
  ): Promise<{ success: boolean; data: SubscribeResponse }> =>
    apiFetch<{ success: boolean; data: SubscribeResponse }>("/api/payments/subscribe", {
      method: "POST",
      headers: buildJsonHeaders(accessToken),
      body: JSON.stringify(payload),
    }),

  cancelSubscription: (
    accessToken: string,
  ): Promise<{ success: boolean; data: { message: string } }> =>
    apiFetch<{ success: boolean; data: { message: string } }>("/api/payments/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  getHistory: (
    accessToken: string,
    limit = 20,
  ): Promise<{ success: boolean; data: PaymentRecord[] }> =>
    apiFetch<{ success: boolean; data: PaymentRecord[] }>(
      `/api/payments/history?limit=${encodeURIComponent(String(limit))}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ),
};

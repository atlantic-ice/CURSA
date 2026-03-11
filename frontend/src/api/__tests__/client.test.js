import {
  ApiError,
  accountApi,
  adminApi,
  aiApi,
  apiFetch,
  authApi,
  documentsApi,
  healthApi,
  notificationsApi,
  previewsApi,
  profilesApi,
} from "../client";

const createMockResponse = ({ ok, status, body, contentType = "application/json" }) => ({
  ok,
  status,
  text: jest.fn().mockResolvedValue(body),
  headers: {
    get: jest
      .fn()
      .mockImplementation((name) => (name.toLowerCase() === "content-type" ? contentType : null)),
  },
});

const createMockBlobResponse = ({ ok, status, blob }) => ({
  ok,
  status,
  blob: jest.fn().mockResolvedValue(blob),
});

describe("api client", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("apiFetch returns parsed JSON for success response", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ value: 42 }),
      }),
    );

    const data = await apiFetch("/health", undefined, "http://localhost:5000");

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/health", undefined);
    expect(data).toEqual({ value: 42 });
  });

  test("apiFetch throws ApiError for html error response", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 502,
        body: "<!doctype html><html><body>Bad Gateway</body></html>",
        contentType: "text/html",
      }),
    );

    await expect(
      apiFetch("/api/auth/me", undefined, "http://localhost:5000"),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      message: expect.stringContaining("HTML"),
    });
  });

  test("apiFetch throws ApiError for malformed success payload", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: "<not-json>",
        contentType: "application/json",
      }),
    );

    await expect(
      apiFetch("/api/auth/me", undefined, "http://localhost:5000"),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
      message: expect.stringContaining("JSON"),
    });
  });

  test("authApi.login sends credentials with POST", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ access_token: "token-1" }),
      }),
    );

    const result = await authApi.login("user@example.com", "secret");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      }),
    );
    expect(result).toEqual({ access_token: "token-1" });
  });

  test("authApi.refresh sends bearer token", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ access_token: "token-2" }),
      }),
    );

    const result = await authApi.refresh("refresh-123");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/refresh"),
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer refresh-123" },
      }),
    );
    expect(result).toEqual({ access_token: "token-2" });
  });

  test("authApi.register sends normalized payload", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 201,
        body: JSON.stringify({ message: "ok" }),
      }),
    );

    const payload = {
      email: "new@example.com",
      password: "StrongPass1",
      first_name: "Ivan",
      last_name: "Petrov",
      organization: "ITMO",
    };

    const result = await authApi.register(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/register"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual({ message: "ok" });
  });

  test("authApi.oauthCallback sends provider code", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({
          access_token: "access-1",
          refresh_token: "refresh-1",
          is_new_user: false,
        }),
      }),
    );

    const result = await authApi.oauthCallback("google", "oauth-code-123");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/oauth/google/callback"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "oauth-code-123" }),
      }),
    );
    expect(result).toEqual({
      access_token: "access-1",
      refresh_token: "refresh-1",
      is_new_user: false,
    });
  });

  test("accountApi.changePassword sends bearer token and JSON payload", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true }),
      }),
    );

    const payload = { old_password: "old-pass", new_password: "new-pass-123" };
    const result = await accountApi.changePassword(payload, "access-123");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/change-password"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer access-123",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual({ success: true });
  });

  test("profilesApi.list fetches profile collection", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify([{ id: "p-1", name: "ГОСТ" }]),
      }),
    );

    const result = await profilesApi.list();

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/profiles/"), undefined);
    expect(result).toEqual([{ id: "p-1", name: "ГОСТ" }]);
  });

  test("profilesApi.validate posts to validation endpoint", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ valid: true, issues: [], warnings: [] }),
      }),
    );

    const result = await profilesApi.validate("p-42");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/profiles/p-42/validate"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ valid: true, issues: [], warnings: [] });
  });

  test("profilesApi.listHistory requests version history", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ versions: [{ filename: "v1.json" }] }),
      }),
    );

    const result = await profilesApi.listHistory("p-42");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/profiles/p-42/history"),
      undefined,
    );
    expect(result).toEqual({ versions: [{ filename: "v1.json" }] });
  });

  test("profilesApi.getTemplates loads templates collection", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify([{ id: "minimal", name: "Минимальный профиль" }]),
      }),
    );

    const result = await profilesApi.getTemplates();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/profiles/templates"),
      undefined,
    );
    expect(result).toEqual([{ id: "minimal", name: "Минимальный профиль" }]);
  });

  test("adminApi.listCorrections fetches corrected files list", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ files: [{ name: "doc-1.docx" }] }),
      }),
    );

    const result = await adminApi.listCorrections();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/list-corrections"),
      undefined,
    );
    expect(result).toEqual({ files: [{ name: "doc-1.docx" }] });
  });

  test("adminApi.cleanupCorrections posts cleanup payload", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, deleted_count: 4, kept_count: 2 }),
      }),
    );

    const result = await adminApi.cleanupCorrections(30);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/admin/cleanup"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ days: 30 }),
      }),
    );
    expect(result).toEqual({ success: true, deleted_count: 4, kept_count: 2 });
  });

  test("adminApi.getStatistics sends days query parameter", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, statistics: { files: { total_count: 9 } } }),
      }),
    );

    const result = await adminApi.getStatistics(14);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/admin/statistics?days=14"),
      undefined,
    );
    expect(result).toEqual({ success: true, statistics: { files: { total_count: 9 } } });
  });

  test("adminApi.updateAlertsConfig posts config payload", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true }),
      }),
    );

    const payload = {
      disk_space: { enabled: true, threshold: 85 },
      error_rate: { enabled: true, threshold: 15 },
    };

    const result = await adminApi.updateAlertsConfig(payload);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/admin/alerts/config"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual({ success: true });
  });

  test("aiApi.saveKey posts AI key payload", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, status: { has_key: true } }),
      }),
    );

    const result = await aiApi.saveKey("gemini-secret-key");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/ai/key"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ api_key: "gemini-secret-key" }),
      }),
    );
    expect(result).toEqual({ success: true, status: { has_key: true } });
  });

  test("notificationsApi.list fetches latest notifications", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ success: true, notifications: [{ id: 1, message: "msg" }] }),
      }),
    );

    const result = await notificationsApi.list(10);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/admin/alerts/notifications?limit=10"),
      undefined,
    );
    expect(result).toEqual({ success: true, notifications: [{ id: 1, message: "msg" }] });
  });

  test("previewsApi.generate posts preview path", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ html: "<p>preview</p>" }),
      }),
    );

    const result = await previewsApi.generate("/tmp/doc.docx");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/preview/generate"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ path: "/tmp/doc.docx" }),
      }),
    );
    expect(result).toEqual({ html: "<p>preview</p>" });
  });

  test("healthApi.getDetailed requests detailed health endpoint", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ status: "healthy", version: "1.0.0" }),
      }),
    );

    const result = await healthApi.getDetailed();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/health/detailed"),
      undefined,
    );
    expect(result).toEqual({ status: "healthy", version: "1.0.0" });
  });

  test("documentsApi.upload posts multipart form data", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({ document_id: "doc-1" }),
      }),
    );

    const file = new File(["docx-content"], "report.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const result = await documentsApi.upload(file, "gost");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/upload"),
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
    expect(result).toEqual({ document_id: "doc-1" });
  });

  test("documentsApi.autocorrect posts document token to secure endpoint", async () => {
    global.fetch.mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        body: JSON.stringify({
          success: true,
          corrected_file_path: "report.docx",
          original_preview_path: "report_original.docx",
          check_results: {
            total_issues_count: 1,
            issues: [{ type: "spacing", severity: "medium" }],
          },
        }),
      }),
    );

    const result = await documentsApi.autocorrect("session-123", "report.docx", "token-123");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/document/autocorrect"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          document_token: "session-123",
          original_filename: "report.docx",
          max_passes: 3,
          verbose: false,
        }),
      }),
    );
    expect(result).toEqual({
      success: true,
      corrected_file_path: "report.docx",
      original_preview_path: "report_original.docx",
      check_results: {
        total_issues_count: 1,
        issues: [{ type: "spacing", severity: "medium" }],
      },
    });
  });

  test("documentsApi.downloadCorrected falls back to legacy endpoint on 404", async () => {
    const blob = new Blob(["docx-data"], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    global.fetch
      .mockResolvedValueOnce(createMockBlobResponse({ ok: false, status: 404, blob }))
      .mockResolvedValueOnce(createMockBlobResponse({ ok: true, status: 200, blob }));

    const result = await documentsApi.downloadCorrected("doc-123", "token-123");

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/documents/doc-123/corrected"),
      expect.objectContaining({ headers: { Authorization: "Bearer token-123" } }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/document/download-corrected?path=doc-123"),
      expect.objectContaining({ headers: { Authorization: "Bearer token-123" } }),
    );
    expect(result).toBe(blob);
  });

  test("ApiError keeps status code", () => {
    const error = new ApiError("failed", 401);

    expect(error.message).toBe("failed");
    expect(error.status).toBe(401);
    expect(error.name).toBe("ApiError");
  });
});

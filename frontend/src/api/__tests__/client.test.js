import { ApiError, apiFetch, authApi } from "../client";

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

  test("ApiError keeps status code", () => {
    const error = new ApiError("failed", 401);

    expect(error.message).toBe("failed");
    expect(error.status).toBe(401);
    expect(error.name).toBe("ApiError");
  });
});

import { documentsApi } from "../client";

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

describe("documents API", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("documentsApi.getProfiles returns profiles array", async () => {
    const mockProfiles = [
      { id: "gost", name: "GOST Standard", description: "Standard GOST rules" },
      { id: "custom", name: "Custom Profile", description: "Custom rules" },
    ];

    const mockResponse = createMockResponse({
      ok: true,
      status: 200,
      body: JSON.stringify(mockProfiles),
    });

    global.fetch.mockResolvedValueOnce(mockResponse);

    const result = await documentsApi.getProfiles("test-token-123");

    expect(result).toEqual(mockProfiles);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/documents/profiles",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token-123" },
      }),
    );
  });

  test("documentsApi.getProfile returns single profile", async () => {
    const mockProfile = { id: "gost", name: "GOST Standard" };

    const mockResponse = createMockResponse({
      ok: true,
      status: 200,
      body: JSON.stringify(mockProfile),
    });

    global.fetch.mockResolvedValueOnce(mockResponse);

    const result = await documentsApi.getProfile("gost", "test-token");

    expect(result).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/documents/profiles/gost",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token" },
      }),
    );
  });

  test("documentsApi.validate sends FormData with file", async () => {
    const mockValidationResponse = {
      status: "success",
      document_id: "doc-123",
      profile_id: "gost",
      score: 95.5,
      issues: [{ severity: "low", message: "Minor formatting issue on page 2" }],
      analysis_time_ms: 250,
    };

    const mockResponse = createMockResponse({
      ok: true,
      status: 200,
      body: JSON.stringify(mockValidationResponse),
    });

    global.fetch.mockResolvedValueOnce(mockResponse);

    const file = new File(["test content"], "document.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const result = await documentsApi.validate(file, "gost", "test-token");

    expect(result).toEqual(mockValidationResponse);
    expect(global.fetch).toHaveBeenCalled();

    const [path, options] = global.fetch.mock.calls[0];
    expect(path).toContain("/api/documents/validate");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });

  test("documentsApi handles validation errors", async () => {
    const mockResponse = createMockResponse({
      ok: false,
      status: 400,
      body: JSON.stringify({ error: "Invalid file format" }),
    });

    global.fetch.mockResolvedValueOnce(mockResponse);

    const file = new File(["test"], "file.txt");

    await expect(documentsApi.validate(file, "gost", "token")).rejects.toThrow(
      "Invalid file format",
    );
  });

  test("documentsApi.getProfiles falls back to legacy /api/profiles/ when new route returns 404", async () => {
    const html404 = createMockResponse({
      ok: false,
      status: 404,
      body: "<!doctype html><html><body>Not Found</body></html>",
      contentType: "text/html",
    });
    const legacySuccess = createMockResponse({
      ok: true,
      status: 200,
      body: JSON.stringify([{ id: "default_gost", name: "ГОСТ" }]),
    });

    global.fetch.mockResolvedValueOnce(html404).mockResolvedValueOnce(legacySuccess);

    const result = await documentsApi.getProfiles("legacy-token");

    expect(result).toEqual([{ id: "default_gost", name: "ГОСТ" }]);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/documents/profiles",
      expect.any(Object),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/profiles/",
      expect.any(Object),
    );
  });

  test("documentsApi.validate falls back to legacy /api/document/analyze when new route returns 404", async () => {
    const html404 = createMockResponse({
      ok: false,
      status: 404,
      body: "<!doctype html><html><body>Not Found</body></html>",
      contentType: "text/html",
    });
    const legacySuccess = createMockResponse({
      ok: true,
      status: 200,
      body: JSON.stringify({
        check_results: { total_issues_count: 2, score: 84 },
        total_issues_count: 2,
      }),
    });

    global.fetch.mockResolvedValueOnce(html404).mockResolvedValueOnce(legacySuccess);

    const file = new File(["test content"], "document.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const result = await documentsApi.validate(file, "default_gost", "legacy-token");

    expect(result).toEqual({
      check_results: { total_issues_count: 2, score: 84 },
      total_issues_count: 2,
    });
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/documents/validate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/document/analyze",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

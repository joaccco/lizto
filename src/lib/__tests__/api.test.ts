import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";

describe("apiFetch utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets Content-Type: application/json for standard JSON requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock;

    await apiFetch("/test-endpoint", {
      method: "POST",
      body: JSON.stringify({ key: "value" }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/test-endpoint");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers["Accept"]).toBe("application/json");
    expect(options.headers["X-Correlation-ID"]).toBeDefined();
  });

  it("omits Content-Type: application/json when body is FormData to allow browser multipart boundary", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ document_id: "doc-123" }),
    });
    global.fetch = fetchMock;

    const formData = new FormData();
    formData.append("document_type", "dni_front");
    formData.append("document_number", "38123456");

    await apiFetch("/kyc/documents", {
      method: "POST",
      body: formData,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/kyc/documents");
    // Crucial: Content-Type must NOT be application/json
    expect(options.headers["Content-Type"]).toBeUndefined();
    expect(options.headers["Accept"]).toBe("application/json");
    expect(options.headers["X-Correlation-ID"]).toBeDefined();
  });

  it("includes Authorization header when token exists in authStorage", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });
    global.fetch = fetchMock;

    vi.spyOn(authStorage, "getToken").mockReturnValue("mock-jwt-token");

    await apiFetch("/protected-endpoint");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer mock-jwt-token");
  });

  it("clears authStorage on 401 Unauthorized responses", async () => {
    const clearSpy = vi.spyOn(authStorage, "clear");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthenticated." }),
    });
    global.fetch = fetchMock;

    await expect(apiFetch("/kyc/status")).rejects.toEqual({
      message: "Unauthenticated.",
    });

    expect(clearSpy).toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";

describe("E2E Section F: Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * F1. Multipart FormData upload - omit Content-Type and reject invalid files
   */
  it("F1: multipart upload preserves boundary headers and handles validation errors", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-token-f1");

    // Caso archivo demasiado grande (>10MB) -> 422
    const fetchMockOversized = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: "El archivo supera el tamaño máximo permitido de 10MB.",
        errors: { document_file: ["El archivo supera el tamaño máximo permitido de 10MB."] },
      }),
    });
    global.fetch = fetchMockOversized;

    const formData = new FormData();
    formData.append("document_type", "identity");
    formData.append("document_number", "12345678");

    await expect(
      apiFetch("/kyc/documents", {
        method: "POST",
        body: formData,
      })
    ).rejects.toEqual({
      message: "El archivo supera el tamaño máximo permitido de 10MB.",
      errors: { document_file: ["El archivo supera el tamaño máximo permitido de 10MB."] },
    });

    const [, options] = fetchMockOversized.mock.calls[0];
    expect(options.headers["Content-Type"]).toBeUndefined();
    expect(options.headers["Authorization"]).toBe("Bearer provider-token-f1");
  });

  /**
   * F2. Concurrency - 2 providers aceptan simultáneamente el mismo trabajo
   */
  it("F2: handles concurrent accept requests with 1 winner and conflict for the other", async () => {
    // Simulamos respuesta concurrente: Promise.all con provider 1 y provider 2
    let requestCount = 0;
    const fetchConcurrentMock = vi.fn().mockImplementation(async () => {
      requestCount++;
      if (requestCount === 1) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: "Trabajo confirmado.",
            data: { status: "confirmed", provider_id: "provider-1" },
          }),
        };
      }
      return {
        ok: false,
        status: 409,
        json: async () => ({
          message: "Esta solicitud ya tiene una oferta aceptada activa.",
        }),
      };
    });
    global.fetch = fetchConcurrentMock;

    const callProvider1 = apiFetch<{ data: { status: string } }>(
      "/provider/work-requests/req-123/confirm",
      { method: "POST" }
    );
    const callProvider2 = apiFetch<{ data: { status: string } }>(
      "/provider/work-requests/req-123/confirm",
      { method: "POST" }
    );

    const [res1, res2] = await Promise.allSettled([callProvider1, callProvider2]);

    expect(res1.status).toBe("fulfilled");
    expect((res1 as PromiseFulfilledResult<any>).value.data.status).toBe("confirmed");

    expect(res2.status).toBe("rejected");
    expect((res2 as PromiseRejectedResult).reason).toEqual({
      message: "Esta solicitud ya tiene una oferta aceptada activa.",
    });
  });

  /**
   * F3. Signed URL expiry - valida que URL expira en ~5 minutos (300s)
   */
  it("F3: signed URL provides 300s expiration and protected access", async () => {
    authStorage.setToken("provider-token-f3");

    const mockSignedRes = {
      signed_url: "http://localhost:8000/api/v1/kyc/documents/doc-1/view?expiration=1788638021",
      expires_in_seconds: 300,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSignedRes,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockSignedRes>("/kyc/documents/doc-1/signed-url");

    expect(res.expires_in_seconds).toBe(300);
    expect(res.signed_url).toMatch(/(expiration|expires|token)/i);
  });
});

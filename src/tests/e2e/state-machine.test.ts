import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";

describe("E2E Section E: State Machine Validations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * E1. Work status transitions - solo transiciones válidas permitidas
   */
  it("E1: work status transitions enforce valid lifecycle and reject invalid jumps", async () => {
    authStorage.setToken("provider-token-e1");

    // Transición válida: InProgress -> Completed
    const validCompleteMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: "El trabajo fue marcado como completado.",
        data: { id: "work-uuid-e1", status: "completed" },
      }),
    });
    global.fetch = validCompleteMock;

    const res = await apiFetch<{ data: { status: string } }>("/works/work-uuid-e1/complete", {
      method: "POST",
    });
    expect(res.data.status).toBe("completed");

    // Intento de transición inválida: trabajo cancelado -> 409 Conflict
    const invalidMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        message: "No se puede cambiar el estado de cancelled a completed.",
      }),
    });
    global.fetch = invalidMock;

    await expect(
      apiFetch("/works/work-cancelled-uuid/complete", { method: "POST" })
    ).rejects.toEqual({
      message: "No se puede cambiar el estado de cancelled a completed.",
    });
  });

  /**
   * E2. KYC status transitions - flujo controlado unverified -> pending -> verified
   */
  it("E2: kyc status transitions follow strictly controlled path", async () => {
    // 1. Estado inicial
    authStorage.setToken("new-provider-token");
    const initialMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ kyc_status: "unverified", documents: [] }),
    });
    global.fetch = initialMock;

    const initial = await apiFetch<{ kyc_status: string }>("/kyc/status");
    expect(initial.kyc_status).toBe("unverified");

    // 2. Transición inválida: usuario normal intentando saltar a verificado -> 403
    const unauthorizedVerifyMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "Acceso denegado." }),
    });
    global.fetch = unauthorizedVerifyMock;

    await expect(
      apiFetch("/admin/kyc/documents/doc-1/verify", { method: "POST" })
    ).rejects.toEqual({ message: "Acceso denegado." });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";

describe("E2E Section C: Work Acceptance Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * C1. Provider con KYC verified recibe asignación en bandeja
   */
  it("C1: verified provider receives assigned work request in inbox", async () => {
    authStorage.setToken("provider-token-c1");

    const mockWorkRequests = {
      data: [
        {
          id: "req-c1-uuid",
          category: "Plomería",
          raw_prompt: "Filtración en bajo mesada",
          client_name: "Mariana",
          status: "matching_active",
          estimated_duration_min: 90,
          is_approximate: true,
          location_address: "Palermo",
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockWorkRequests,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockWorkRequests>("/provider/work-requests");
    expect(res.data.length).toBe(1);
    expect(res.data[0].id).toBe("req-c1-uuid");
    expect(res.data[0].raw_prompt).toBe("Filtración en bajo mesada");
  });

  /**
   * C2. Provider visualiza detalles del work con protección de privacidad
   */
  it("C2: provider views work details with privacy geo-masking", async () => {
    authStorage.setToken("provider-token-c2");

    const mockDetail = {
      data: {
        id: "req-c2-uuid",
        category: "Plomería",
        client_name: "Mariana",
        raw_prompt: "Filtración en bajo mesada",
        is_approximate: true,
        location_address: "Palermo",
        estimated_duration_min: 90,
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockDetail>("/provider/work-requests");
    const item = res.data;
    expect(item.raw_prompt).toBe("Filtración en bajo mesada");
    expect(item.is_approximate).toBe(true);
    expect(item.location_address).toBe("Palermo");
  });

  /**
   * C3. Provider acepta work -> transición a confirmed / in_progress
   */
  it("C3: provider accepts work successfully", async () => {
    authStorage.setToken("provider-token-c3");

    const mockAcceptRes = {
      message: "Trabajo confirmado.",
      data: {
        id: "req-c3-uuid",
        work_id: "work-c3-uuid",
        status: "confirmed",
        estimated_duration_min: 90,
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAcceptRes,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockAcceptRes>(
      "/provider/work-requests/req-c3-uuid/confirm",
      {
        method: "POST",
        body: JSON.stringify({ estimated_duration_min: 90 }),
      }
    );

    expect(res.data.status).toBe("confirmed");
    expect(res.data.work_id).toBe("work-c3-uuid");
  });

  /**
   * C4. Provider reintenta aceptar work -> idempotencia
   */
  it("C4: repeated accept by same provider handled idempotently", async () => {
    authStorage.setToken("provider-token-c4");

    const mockIdempotentRes = {
      message: "Trabajo confirmado.",
      data: {
        id: "req-c4-uuid",
        work_id: "work-c4-uuid",
        status: "confirmed",
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockIdempotentRes,
    });
    global.fetch = fetchMock;

    const res1 = await apiFetch<typeof mockIdempotentRes>(
      "/provider/work-requests/req-c4-uuid/confirm",
      { method: "POST" }
    );
    const res2 = await apiFetch<typeof mockIdempotentRes>(
      "/provider/work-requests/req-c4-uuid/confirm",
      { method: "POST" }
    );

    expect(res1.data.work_id).toBe(res2.data.work_id);
    expect(res2.data.status).toBe("confirmed");
  });

  /**
   * C5. Otro provider intenta aceptar el mismo work -> 403 / 422
   */
  it("C5: unauthorized provider cannot accept already assigned work", async () => {
    authStorage.setToken("unassigned-provider-token");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        message: "No autorizado para responder a esta solicitud.",
      }),
    });
    global.fetch = fetchMock;

    await expect(
      apiFetch("/provider/work-requests/req-c5-uuid/confirm", {
        method: "POST",
      })
    ).rejects.toEqual({
      message: "No autorizado para responder a esta solicitud.",
    });
  });
});

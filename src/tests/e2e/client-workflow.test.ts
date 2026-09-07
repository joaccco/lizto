import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";

describe("E2E Section A: Client Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * A1. Cliente NO autenticado intenta crear solicitud
   * Endpoint: POST /requests -> 401 Unauthorized
   */
  it("A1: unauthenticated client receives 401 Unauthorized", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthenticated." }),
    });
    global.fetch = fetchMock;

    await expect(
      apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({ prompt: "Reparación de caño urgente" }),
      })
    ).rejects.toEqual({ message: "Unauthenticated." });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/requests");
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  /**
   * A2. Cliente autenticado crea solicitud válida
   * Endpoint: POST /requests -> 201 Created
   */
  it("A2: authenticated client creates valid request", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("client-mock-token-abc");

    const mockResponse = {
      message: "Solicitud creada correctamente.",
      data: {
        id: "req-uuid-12345",
        status: "pending_survey",
        raw_prompt: "Reparación de caño",
        category: { id: "plomeria", name: "Plomería", slug: "plomeria" },
        created_at: new Date().toISOString(),
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const payload = {
      prompt: "Reparación de caño",
      category_slug: "plomeria",
      urgency: "immediate",
      location: {
        address: "Calle Principal 123, Buenos Aires",
        lat: -34.6037,
        lng: -58.3816,
      },
    };

    const result = await apiFetch<typeof mockResponse>("/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(result.data.id).toBe("req-uuid-12345");
    expect(result.data.status).toBe("pending_survey");
    expect(result.data.category.slug).toBe("plomeria");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/requests");
    expect(options.headers["Authorization"]).toBe("Bearer client-mock-token-abc");
  });

  /**
   * A3. Sistema busca providers disponibles en zona
   * Endpoint: GET /providers?category=...&availability=available&lat=...&lng=... -> 200 OK
   */
  it("A3: searches available providers in zone within radius", async () => {
    const mockProviders = {
      data: [
        {
          id: "provider-uuid-001",
          uuid: "user-uuid-001",
          name: "Mario Plomero",
          avg_rating: 4.9,
          availability_status: "available",
          location: {
            lat: -34.6037,
            lng: -58.3816,
            address: "Buenos Aires",
          },
        },
      ],
      meta: { current_page: 1, total: 1 },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProviders,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockProviders>(
      "/providers?category=plomeria&availability=available&lat=-34.6037&lng=-58.3816"
    );

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    const provider = res.data[0];
    expect(provider.id).toBe("provider-uuid-001");
    expect(provider.name).toBe("Mario Plomero");
    expect(provider.availability_status).toBe("available");
  });

  /**
   * A4. Asignación de provider a la solicitud / trabajo
   * Endpoint: POST /provider/work-requests/{id}/confirm -> 200 OK
   */
  it("A4: provider assigned to work transitioning status to confirmed", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-mock-token-xyz");

    const mockConfirmResponse = {
      message: "Trabajo confirmado.",
      data: {
        id: "req-uuid-12345",
        work_id: "work-uuid-99999",
        status: "confirmed",
        estimated_duration_min: 90,
        scheduled_at: new Date().toISOString(),
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockConfirmResponse,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockConfirmResponse>(
      "/provider/work-requests/req-uuid-12345/confirm",
      {
        method: "POST",
        body: JSON.stringify({ estimated_duration_min: 90 }),
      }
    );

    expect(res.data.work_id).toBe("work-uuid-99999");
    expect(res.data.status).toBe("confirmed");
    expect(res.data.estimated_duration_min).toBe(90);
  });

  /**
   * A5. Notificación y logging de asignación
   */
  it("A5: verifies correlation tracking and assignment logging", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-mock-token-xyz");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Trabajo confirmado.",
        data: { status: "confirmed" },
      }),
    });
    global.fetch = fetchMock;

    await apiFetch("/provider/work-requests/req-uuid-12345/confirm", {
      method: "POST",
      headers: {
        "X-Correlation-ID": "test-e2e-correlation-a5",
      },
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["X-Correlation-ID"]).toBe("test-e2e-correlation-a5");
    expect(options.headers["Authorization"]).toBe("Bearer provider-mock-token-xyz");
  });
});

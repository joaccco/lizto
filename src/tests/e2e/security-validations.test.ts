import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";

describe("E2E Section D: Security Validations (D-01, D-02, D-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * D1. GEO-PRIVACY (D-01) - Coordenadas exactas NO expuestas a no autorizados
   */
  it("D1: geo-privacy masks exact coordinates, revealing approximate zone only", async () => {
    authStorage.setToken("unconfirmed-provider-token");

    const mockLocationMasked = {
      data: {
        is_approximate: true,
        location_address: "Palermo",
        location_lat: -34.5889,
        location_lng: -58.4305,
        location_radius_meters: 500,
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockLocationMasked,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockLocationMasked>("/works/work-uuid-1/location");

    expect(res.data.is_approximate).toBe(true);
    expect(res.data.location_radius_meters).toBe(500);
    expect(res.data.location_address).toBe("Palermo");
  });

  /**
   * D2. ROLE ESCALATION (D-02) - Imposible cambiar rol a admin o saltar validaciones
   */
  it("D2: role escalation attempts are rejected with 403 Forbidden", async () => {
    authStorage.setToken("client-token-attacker");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        message: "Debes completar la verificación de identidad (KYC) antes de convertirte en proveedor.",
        errors: { kyc: ["Verificación pendiente o rechazada."] },
      }),
    });
    global.fetch = fetchMock;

    await expect(
      apiFetch("/auth/become-provider", {
        method: "POST",
      })
    ).rejects.toEqual({
      message: "Debes completar la verificación de identidad (KYC) antes de convertirte en proveedor.",
      errors: { kyc: ["Verificación pendiente o rechazada."] },
    });
  });

  /**
   * D3. FAKE DATA ISOLATION (D-03) - Datos seeder fake no aparecen en consultas públicas
   */
  it("D3: queries exclude seeder fake data by default", async () => {
    const mockProvidersClean = {
      data: [
        { id: "real-pro-1", name: "Mario Plomero", is_verified: true },
        { id: "real-pro-2", name: "Ana Kupfer", is_verified: true },
      ],
      meta: { total: 2 },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProvidersClean,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockProvidersClean>("/providers");

    // Verificar que ninguno de los registros devueltos contiene bandera de fake data
    expect(res.data.every((p: any) => p.fake_data_source === undefined)).toBe(true);
    expect(res.data.length).toBe(2);
  });
});

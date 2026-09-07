import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { emitProviderLocation, fetchProviderLocation } from "@/services/locationService";
import { calculateETA, formatETALabel, haversineDistance, isLocationStale } from "@/utils/geoUtils";

describe("E2E Task 3.4: Geo-Tracking & D-01 Geo-Privacy (Frontend)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * T1. Provider emits location -> payload formatting & headers
   */
  it("T1: provider emits location with proper coordinates and Bearer auth", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-geo-token");

    const mockResponse = {
      provider_id: 101,
      latitude: -34.6037,
      longitude: -58.3816,
      approximate_zone: "Balvanera",
      heading: 90,
      speed_kmh: 25.0,
      created_at: new Date().toISOString(),
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const res = await emitProviderLocation({
      latitude: -34.6037,
      longitude: -58.3816,
      heading: 90,
      speed_kmh: 25.0,
    });

    expect(res.provider_id).toBe(101);
    expect(res.approximate_zone).toBe("Balvanera");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/providers/me/location");
    expect(options.headers["Authorization"]).toBe("Bearer provider-geo-token");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  /**
   * T2. Client views provider location -> returns approximate zone and ETA only
   */
  it("T2: client fetches provider location receiving approximate zone without raw coordinates", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("client-geo-token");

    const mockTrackingData = {
      data: {
        provider_id: 101,
        approximate_zone: "Palermo",
        approximate_center: {
          latitude: -34.5889,
          longitude: -58.4305,
        },
        heading: 45,
        speed_kmh: 20.0,
        estimated_arrival_minutes: 8,
        last_update: new Date().toISOString(),
        is_approximate: true,
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTrackingData,
    });
    global.fetch = fetchMock;

    const res = await fetchProviderLocation("work-uuid-geo-1");

    expect(res.data.approximate_zone).toBe("Palermo");
    expect(res.data.is_approximate).toBe(true);
    expect(res.data.estimated_arrival_minutes).toBe(8);
    expect((res.data as any).raw_latitude).toBeUndefined();
    expect((res.data as any).raw_longitude).toBeUndefined();
  });

  /**
   * T3. Non-client receives 403 Forbidden
   */
  it("T3: unauthorized third party request returns 403 Forbidden", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("intruder-token");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        message: "No autorizado para ver la ubicación del proveedor para este trabajo.",
      }),
    });
    global.fetch = fetchMock;

    await expect(fetchProviderLocation("work-uuid-geo-1")).rejects.toEqual({
      message: "No autorizado para ver la ubicación del proveedor para este trabajo.",
    });
  });

  /**
   * T4. Distance & ETA calculation (haversine + speed)
   */
  it("T4: calculates distance and ETA accurately based on coordinates and speed", () => {
    // Palermo (-34.5889, -58.4305) to Recoleta (-34.5875, -58.3974) -> ~3.04 km
    const distanceKm = haversineDistance(-34.5889, -58.4305, -34.5875, -58.3974);
    expect(distanceKm).toBeGreaterThan(2.5);
    expect(distanceKm).toBeLessThan(4.0);

    // At 30 km/h, 3 km takes ~6 minutes
    const etaMinutes = calculateETA(distanceKm, 30.0);
    expect(etaMinutes).toBeGreaterThanOrEqual(5);
    expect(etaMinutes).toBeLessThanOrEqual(8);

    // Formatting test
    const label = formatETALabel(etaMinutes, 30.0);
    expect(label).toContain("minutos");

    // Stationary test
    const stationaryLabel = formatETALabel(5, 0.0);
    expect(stationaryLabel).toBe("Aguardando en zona...");
  });

  /**
   * T5. Stale location detection (> 2 minutes)
   */
  it("T5: correctly detects stale location updates older than 2 minutes", () => {
    const recentTimestamp = new Date(Date.now() - 30 * 1000).toISOString(); // 30s ago
    expect(isLocationStale(recentTimestamp)).toBe(false);

    const oldTimestamp = new Date(Date.now() - 180 * 1000).toISOString(); // 3 min ago
    expect(isLocationStale(oldTimestamp)).toBe(true);
  });

  /**
   * T6. Work not active (cancelled or completed) returns 404
   */
  it("T6: tracking inactive work returns 404 error", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("client-geo-token");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        message: "El seguimiento solo está disponible para trabajos en curso o confirmados.",
      }),
    });
    global.fetch = fetchMock;

    await expect(fetchProviderLocation("work-cancelled-uuid")).rejects.toEqual({
      message: "El seguimiento solo está disponible para trabajos en curso o confirmados.",
    });
  });

  /**
   * T7. Throttling error handling (429)
   */
  it("T7: handles emission rate limit (429) gracefully", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-geo-token");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        message: "Demasiadas actualizaciones. Espera unos segundos.",
        retry_after_seconds: 5,
      }),
    });
    global.fetch = fetchMock;

    await expect(
      emitProviderLocation({
        latitude: -34.6037,
        longitude: -58.3816,
      })
    ).rejects.toEqual({
      message: "Demasiadas actualizaciones. Espera unos segundos.",
      retry_after_seconds: 5,
    });
  });
});

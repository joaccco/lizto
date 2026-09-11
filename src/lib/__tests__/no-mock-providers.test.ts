import { describe, it, expect } from "vitest";
import {
  MOCK_PROVIDERS,
  getProvidersByCategorySlug,
  getRankedUrgentProviders,
  buildMockParseResponse,
} from "../mock-data";

describe("T3: No fabricated providers in frontend (anti-fictitious data policy)", () => {
  it("strictly prohibits fabricated providers in MOCK_PROVIDERS", () => {
    expect(MOCK_PROVIDERS).toEqual([]);
    expect(MOCK_PROVIDERS.length).toBe(0);
  });

  it("returns empty arrays for mock provider queries without fabricating data", () => {
    expect(getProvidersByCategorySlug("cerrajeria")).toEqual([]);
    expect(getProvidersByCategorySlug("electricidad")).toEqual([]);
    expect(getProvidersByCategorySlug("plomeria")).toEqual([]);
    expect(getRankedUrgentProviders()).toEqual([]);
    expect(getRankedUrgentProviders("electricidad")).toEqual([]);

    const parseResponse = buildMockParseResponse();
    expect(parseResponse.providers).toEqual([]);
  });
});

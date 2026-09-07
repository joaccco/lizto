import { apiFetch } from "@/lib/api";

export interface ProviderLocationPayload {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  heading?: number | null;
  speed_kmh?: number | null;
}

export interface ProviderLocationResponse {
  provider_id: number;
  latitude: number;
  longitude: number;
  approximate_zone: string;
  heading: number | null;
  speed_kmh: number | null;
  created_at: string;
}

export interface WorkTrackingData {
  provider_id: number;
  approximate_zone: string;
  approximate_center: {
    latitude: number;
    longitude: number;
  };
  heading: number | null;
  speed_kmh: number | null;
  estimated_arrival_minutes: number;
  last_update: string;
  is_approximate: boolean;
}

/**
 * Emits current provider GPS coordinates to the backend (throttled).
 */
export async function emitProviderLocation(
  payload: ProviderLocationPayload
): Promise<ProviderLocationResponse> {
  return apiFetch<ProviderLocationResponse>("/providers/me/location", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches real-time provider tracking data for an active work.
 * Returns privacy-masked approximate zone and calculated ETA.
 */
export async function fetchProviderLocation(
  workId: string
): Promise<{ data: WorkTrackingData }> {
  return apiFetch<{ data: WorkTrackingData }>(`/works/${workId}/provider-location`);
}

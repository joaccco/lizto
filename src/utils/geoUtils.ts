/**
 * Geo Utilities for Real-Time Provider Tracking and ETA Calculation
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate Haversine distance between two geographical points in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Calculate estimated arrival time in minutes.
 * Defaults to 30 km/h in urban environments if speed is unavailable or stationary.
 */
export function calculateETA(distanceKm: number, speedKmh?: number | null): number {
  const effectiveSpeed = speedKmh && speedKmh > 5 && speedKmh <= 150 ? speedKmh : 30.0;
  const minutes = (distanceKm / effectiveSpeed) * 60;
  return Math.max(1, Math.round(minutes));
}

/**
 * Human-friendly format for ETA badge.
 */
export function formatETALabel(minutes: number, speedKmh?: number | null): string {
  if (speedKmh !== undefined && speedKmh !== null && speedKmh < 3) {
    return "Aguardando en zona...";
  }
  if (minutes <= 1) {
    return "Llegando ahora (~1 min)";
  }
  return `Llegará en ~${minutes} minutos`;
}

/**
 * Check if a location timestamp is stale (> 2 minutes ago).
 */
export function isLocationStale(isoTimestamp: string, thresholdSeconds = 120): boolean {
  const timestamp = new Date(isoTimestamp).getTime();
  const now = Date.now();
  return now - timestamp > thresholdSeconds * 1000;
}

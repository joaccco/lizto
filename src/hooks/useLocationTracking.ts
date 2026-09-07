"use client";

import { useEffect, useRef, useState } from "react";
import { emitProviderLocation, ProviderLocationPayload } from "@/services/locationService";

interface UseLocationTrackingOptions {
  enabled?: boolean;
  intervalMs?: number; // Default 10000ms (10 seconds)
  onSuccess?: (coords: GeolocationCoordinates) => void;
  onError?: (error: GeolocationPositionError | Error) => void;
}

export function useLocationTracking({
  enabled = true,
  intervalMs = 10000,
  onSuccess,
  onError,
}: UseLocationTrackingOptions = {}) {
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [lastCoords, setLastCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const handlePosition = async (position: GeolocationPosition) => {
      const coords = position.coords;
      setLastCoords(coords);
      setPermissionStatus("granted");
      setError(null);
      setIsTracking(true);
      onSuccess?.(coords);

      const now = Date.now();
      if (now - lastEmitTimeRef.current >= intervalMs) {
        lastEmitTimeRef.current = now;
        try {
          const payload: ProviderLocationPayload = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy_meters: Math.round(coords.accuracy),
            heading: coords.heading !== null && !isNaN(coords.heading) ? Math.round(coords.heading) : null,
            speed_kmh: coords.speed !== null && !isNaN(coords.speed) ? Number((coords.speed * 3.6).toFixed(1)) : null,
          };
          await emitProviderLocation(payload);
        } catch (err: any) {
          // Graceful handling of network / throttling error
          onError?.(err);
        }
      }
    };

    const handleError = (posError: GeolocationPositionError) => {
      if (posError.code === posError.PERMISSION_DENIED) {
        setPermissionStatus("denied");
        setError("Permiso de ubicación denegado. Habilítalo en los ajustes del navegador.");
      } else {
        setError("No se pudo obtener la ubicación GPS.");
      }
      setIsTracking(false);
      onError?.(posError);
    };

    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    });
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
    };
  }, [enabled, intervalMs, onSuccess, onError]);

  const stopTracking = () => {
    if (watchIdRef.current !== null && typeof window !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  return {
    isTracking,
    permissionStatus,
    lastCoords,
    error,
    stopTracking,
  };
}

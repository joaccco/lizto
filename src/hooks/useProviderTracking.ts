"use client";

import { useEffect, useRef, useState } from "react";
import { fetchProviderLocation, WorkTrackingData } from "@/services/locationService";
import { formatETALabel, isLocationStale } from "@/utils/geoUtils";

interface UseProviderTrackingOptions {
  workId: string;
  enabled?: boolean;
  pollIntervalMs?: number; // Default 5000ms (5 seconds)
}

export function useProviderTracking({
  workId,
  enabled = true,
  pollIntervalMs = 5000,
}: UseProviderTrackingOptions) {
  const [data, setData] = useState<WorkTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !workId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const poll = async () => {
      try {
        const response = await fetchProviderLocation(workId);
        if (!isMounted) return;

        setData(response.data);
        setIsStale(isLocationStale(response.data.last_update));
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "No se pudo obtener la ubicación del profesional.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    poll();
    timerRef.current = setInterval(poll, pollIntervalMs);

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [workId, enabled, pollIntervalMs]);

  const etaLabel = data ? formatETALabel(data.estimated_arrival_minutes, data.speed_kmh) : null;

  return {
    trackingData: data,
    etaLabel,
    isStale,
    isLoading,
    error,
  };
}

"use client";

import { useState, useEffect, useRef } from "react";
import type { ActiveRequestItem } from "@/components/screens/DashboardScreen";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { ENDPOINTS } from "@/lib/endpoints";

export function useActiveRequest() {
  const [activeRequest, setActiveRequest] = useState<ActiveRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Solo correr una vez
    if (hasFetched.current) return;
    hasFetched.current = true;

    const token = authStorage.getToken();
    if (!token) {
      setActiveRequest(null);
      return;
    }

    const fetchActive = async () => {
      setIsLoading(true);
      try {
        const result = await apiFetch<{ data: ActiveRequestItem[] }>(
          `${ENDPOINTS.REQUESTS}?status=active&limit=1`
        );
        const requests = result?.data ?? [];
        setActiveRequest(requests.length > 0 ? requests[0] : null);
      } catch {
        setActiveRequest(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActive();
  }, []);

  return { activeRequest, isLoading };
}

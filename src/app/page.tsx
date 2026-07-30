"use client";

import { useEffect, useState } from "react";

import { DashboardScreen, type ActiveRequestItem } from "@/components/screens/DashboardScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { ENDPOINTS } from "@/lib/endpoints";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "María";
  const [activeRequest, setActiveRequest] = useState<ActiveRequestItem | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkActiveRequest = async () => {
    // FIX 3: Do not check active request if user has no token
    const token = authStorage.getToken();
    if (!token) {
      setActiveRequest(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const res = await apiFetch<{ data: ActiveRequestItem[] }>(
        `${ENDPOINTS.REQUESTS}?status=active&limit=1`,
        { headers: { "Cache-Control": "no-store" } }
      );
      if (res.data && res.data.length > 0) {
        const first = res.data[0];
        const validStatuses = [
          "provider_selected",
          "pending_confirmation",
          "confirmed",
          "in_progress",
          "pending_completion",
        ];
        if (validStatuses.includes(first.status)) {
          setActiveRequest(first);
        } else {
          setActiveRequest(null);
        }
      } else {
        setActiveRequest(null);
      }
    } catch {
      // FIX 2: Gracefully catch 401 or network errors without redirecting or throwing
      setActiveRequest(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkActiveRequest();
  }, []);

  if (isChecking) {
    return (
      <ScreenShell className="py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-10 w-3/4 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-48 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </ScreenShell>
    );
  }

  if (activeRequest) {
    return (
      <DashboardScreen
        userName={firstName}
        activeRequest={activeRequest}
        onRefresh={checkActiveRequest}
      />
    );
  }

  return <HomeScreen />;
}

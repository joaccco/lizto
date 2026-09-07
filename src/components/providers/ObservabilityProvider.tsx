"use client";

import { useEffect } from "react";
import { initFrontendErrorTracker } from "@/lib/errorTracker";

export function ObservabilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initFrontendErrorTracker();
  }, []);

  return <>{children}</>;
}

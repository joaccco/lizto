"use client";

import { RankedList } from "@/components/screens/fast-mode/RankedList";
import { UrgencyBanner } from "@/components/screens/fast-mode/UrgencyBanner";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
import { useFastModeSession } from "@/hooks/useSearchSession";

export function FastModeScreen() {
  const { parsedRequest, providers } = useFastModeSession();

  if (providers.length === 0) {
    return (
      <ScreenShell>
        <TopBar variant="back" title="Modo urgente" rightIcon="none" />
        <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          No encontramos profesionales disponibles ahora. Probá de nuevo en unos
          minutos.
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <TopBar
        variant="back"
        title={`${parsedRequest.category} ahora`}
        rightIcon="map"
      />

      <div className="space-y-4">
        <UrgencyBanner />
        <RankedList providers={providers} />
      </div>
    </ScreenShell>
  );
}

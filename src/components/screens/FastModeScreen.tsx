"use client";

import { useEffect, useMemo, useState } from "react";

import { RankedList } from "@/components/screens/fast-mode/RankedList";
import { UrgencyBanner } from "@/components/screens/fast-mode/UrgencyBanner";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
import { useProviders } from "@/hooks/useProviders";
import { useFastModeSession } from "@/hooks/useSearchSession";
import { MOCK_PROVIDERS } from "@/lib/mock-data";
import type { ParsedRequest } from "@/lib/types";

export function FastModeScreen() {
  const { parsedRequest: defaultParsedRequest } = useFastModeSession();
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [parsedRequest, setParsedRequest] = useState<ParsedRequest>(defaultParsedRequest);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("parsed_request");
      if (stored) {
        const parsed = JSON.parse(stored);
        const request: ParsedRequest = parsed.parsed_request || parsed;
        const slug =
          parsed.rawBackendData?.parsed_intent?.category_slug ||
          request.categorySlug ||
          request.category?.toLowerCase();

        if (slug) {
          setCategorySlug(slug);
        }
        if (request) {
          setParsedRequest(request);
        }
      }
    } catch {
      // Use defaults on error
    }
  }, []);

  const { providers: apiProviders } = useProviders({
    category: categorySlug,
    availability: "available",
  });

  const providers = useMemo(() => {
    if (apiProviders && apiProviders.length > 0) {
      return apiProviders;
    }
    return MOCK_PROVIDERS;
  }, [apiProviders]);

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
        title={`${parsedRequest.category || "Servicio"} ahora`}
        rightIcon="map"
      />

      <div className="space-y-4">
        <UrgencyBanner />
        <RankedList providers={providers} />
      </div>
    </ScreenShell>
  );
}

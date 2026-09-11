"use client";

import { useEffect, useMemo, useState } from "react";

import { RankedList } from "@/components/screens/fast-mode/RankedList";
import { UrgencyBanner } from "@/components/screens/fast-mode/UrgencyBanner";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
import { useProviders } from "@/hooks/useProviders";
import { useFastModeSession } from "@/hooks/useSearchSession";
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

  const providers = useMemo(() => apiProviders || [], [apiProviders]);

  if (providers.length === 0) {
    return (
      <ScreenShell>
        <TopBar variant="back" title="Modo urgente" rightIcon="none" />
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/5 p-4 text-sm text-zinc-300">
            No encontramos profesionales disponibles para atención inmediata en esta zona. Podés planificar tu pedido para otra fecha o ampliar tu búsqueda.
          </div>
          <button
            type="button"
            onClick={() => router.push("/survey")}
            className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#7C5CFF] text-sm font-semibold text-white transition hover:bg-[#6b47ff] cursor-pointer"
          >
            Planificar para otra fecha u horario
          </button>
          <button
            type="button"
            onClick={() => router.push("/search")}
            className="flex h-[52px] w-full items-center justify-center rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer"
          >
            Buscar otro servicio
          </button>
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

"use client";

import { SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  AIInterpretationBanner,
} from "@/components/screens/browse/AIInterpretationBanner";
import { CardStack } from "@/components/screens/browse/CardStack";
import {
  ParsedTags,
  buildParsedTags,
} from "@/components/screens/browse/ParsedTags";
import { SwipeActions } from "@/components/screens/browse/SwipeActions";
import { RecommendScreen } from "@/components/screens/RecommendScreen";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
import { useCardStack } from "@/hooks/useCardStack";
import { useProviders } from "@/hooks/useProviders";

import { useBrowseSession } from "@/hooks/useSearchSession";
import { useServiceRequest } from "@/hooks/useServiceRequest";
import { MOCK_PROVIDERS } from "@/lib/mock-data";
import type { ParsedRequest, Provider } from "@/lib/types";

interface StoredCard {
  card_id: number;
  rank_position: number;
  score_total: number;
  card_status: string;
  provider: Provider;
}

export function BrowseScreen() {
  const router = useRouter();
  const { parsedRequest: defaultParsedRequest } = useBrowseSession();
  const { acceptCard, rejectCard, recoverCard } = useServiceRequest();

  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [parsedRequest, setParsedRequest] = useState<ParsedRequest>(defaultParsedRequest);
  const [matchSessionId, setMatchSessionId] = useState<string | null>(null);
  const [sessionCards, setSessionCards] = useState<StoredCard[] | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

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

      const sId = sessionStorage.getItem("match_session_id");
      if (sId) {
        setMatchSessionId(sId);
      }

      const storedMatchCards = sessionStorage.getItem("match_cards");
      if (storedMatchCards) {
        const rawStored = JSON.parse(storedMatchCards);
        if (rawStored && rawStored.length > 0) {
          if (rawStored[0]?.card_id !== undefined) {
            setSessionCards(rawStored as StoredCard[]);
          } else {
            setSessionCards(null);
          }
        }
      }
    } catch {
      // Use defaults on parse error
    }
  }, []);

  const { providers: apiProviders, isLoading } = useProviders({ category: categorySlug });

  const providers = useMemo(() => {
    if (sessionCards && sessionCards.length > 0) {
      return sessionCards.map((sc) => ({
        ...sc.provider,
        card_id: sc.card_id,
        match_card_id: sc.card_id,
      })) as Provider[];
    }
    if (apiProviders && apiProviders.length > 0) {
      return apiProviders;
    }
    return MOCK_PROVIDERS;
  }, [sessionCards, apiProviders]);

  const {
    current,
    visibleCards,
    currentIndex,
    accept: advanceAccept,
    reject: advanceReject,
    undo: advanceUndo,
    canUndo,
    isEmpty,
  } = useCardStack(providers);

  const tags = useMemo(
    () => buildParsedTags(parsedRequest),
    [parsedRequest]
  );

  const handleAccept = async () => {
    if (!current) return;

    const targetCardId = (current as any)?.card_id || (current as any)?.match_card_id;

    if (matchSessionId && targetCardId) {
      await acceptCard(targetCardId);
    }

    sessionStorage.setItem("accepted_provider", JSON.stringify(current));
    advanceAccept();
    router.push("/work-confirmed");
  };

  const handleReject = async () => {
    if (!current) return;

    const targetCardId = (current as any)?.card_id || (current as any)?.match_card_id;

    if (matchSessionId && targetCardId) {
      await rejectCard(targetCardId);
    }

    advanceReject();
  };

  const handleUndo = async () => {
    if (!canUndo) return;

    if (matchSessionId) {
      await recoverCard();
    }

    advanceUndo();
  };

  // CAMBIO 3: If urgency is immediate, show RecommendScreen first
  const isImmediate = parsedRequest?.urgency === "immediate";
  if (isImmediate && !showAllOptions) {
    return (
      <RecommendScreen
        provider={providers[0] || null}
        onAccept={handleAccept}
        onShowAllOptions={() => setShowAllOptions(true)}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ScreenShell>
      <TopBar
        variant="back"
        title={isLoading ? "Cargando profesionales..." : `${providers.length} profesionales para vos`}
        rightIcon="filter"
      />

      <div className="space-y-3">
        <AIInterpretationBanner summary={parsedRequest.summary} />
        <ParsedTags tags={tags} />
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Mejor coincidencia primero
          </p>
          <p className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
            {Math.min(currentIndex + 1, providers.length)} de {providers.length}
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-[480px] items-center justify-center rounded-[24px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Buscando los mejores profesionales...
            </div>
          </div>
        ) : providers.length === 0 ? (
          /* CAMBIO 4: ESTADO VACÍO REDISEÑADO */
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-4">
            <SearchX className="size-12 text-zinc-400" />
            <h3 className="text-[20px] font-semibold text-zinc-950 dark:text-zinc-100">
              Todavía no tenemos este servicio en tu zona
            </h3>
            <p className="text-[16px] leading-6 text-zinc-500 dark:text-zinc-400 max-w-sm">
              Guardamos tu solicitud y te avisamos cuando tengamos profesionales disponibles cerca tuyo.
            </p>

            {savedNotice ? (
              <div className="w-full rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Listo. Te avisamos cuando tengamos alguien disponible.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSavedNotice(true)}
                className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-[#4F46E5] text-base font-semibold text-white transition hover:bg-indigo-700 shadow-sm"
              >
                Guardar y recibir aviso
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/search")}
              className="flex h-[52px] w-full items-center justify-center rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Buscar otro servicio
            </button>
          </div>
        ) : (
          <>
            <CardStack cards={visibleCards} onAccept={handleAccept} onReject={handleReject} />
            <SwipeActions
              onAccept={handleAccept}
              onReject={handleReject}
              onUndo={handleUndo}
              canUndo={canUndo}
              disabled={isEmpty || isLoading}
            />
          </>
        )}
      </div>
    </ScreenShell>
  );
}

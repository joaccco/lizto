"use client";

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
  // FIX 3: Store full card objects with card_id, not just providers
  const [sessionCards, setSessionCards] = useState<StoredCard[] | null>(null);

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
          // FIX 3: Support both old format (plain providers) and new format (objects with card_id)
          if (rawStored[0]?.card_id !== undefined) {
            // New format: array of { card_id, provider, ... }
            setSessionCards(rawStored as StoredCard[]);
          } else {
            // Old fallback: plain provider objects (no card_id available)
            setSessionCards(null);
          }
        }
      }
    } catch {
      // Use defaults on parse error
    }
  }, []);

  const { providers: apiProviders, isLoading } = useProviders({ category: categorySlug });

  // Build the providers list. When we have session cards, use their provider data.
  const providers = useMemo(() => {
    if (sessionCards && sessionCards.length > 0) {
      // Attach card_id directly on provider object so handleAccept/handleReject can read it
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

    // FIX 2: Debug logs
    console.log("=== ACCEPT ===");
    console.log("session uuid:", matchSessionId);
    console.log("card completa:", current);
    console.log("cardId a mandar:", targetCardId);

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

    // FIX 2: Debug logs
    console.log("=== REJECT ===");
    console.log("session uuid:", matchSessionId);
    console.log("card completa:", current);
    console.log("cardId a mandar:", targetCardId);

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
          <div className="flex flex-col items-center justify-center h-64 text-center px-6 mt-8">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              No encontramos profesionales
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              No hay profesionales disponibles para esta categoría en tu zona por el momento.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
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

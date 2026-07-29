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

export function BrowseScreen() {
  const router = useRouter();
  const { parsedRequest: defaultParsedRequest } = useBrowseSession();
  const { acceptCard, rejectCard, recoverCard } = useServiceRequest();

  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [parsedRequest, setParsedRequest] = useState<ParsedRequest>(defaultParsedRequest);
  const [matchSessionId, setMatchSessionId] = useState<string | null>(null);
  const [sessionProviders, setSessionProviders] = useState<Provider[] | null>(null);

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
        const parsedCards: Provider[] = JSON.parse(storedMatchCards);
        if (parsedCards && parsedCards.length > 0) {
          setSessionProviders(parsedCards);
        }
      }
    } catch {
      // Use defaults on parse error
    }
  }, []);

  const { providers: apiProviders, isLoading } = useProviders({ category: categorySlug });

  const providers = useMemo(() => {
    if (sessionProviders && sessionProviders.length > 0) {
      return sessionProviders;
    }
    if (apiProviders && apiProviders.length > 0) {
      return apiProviders;
    }
    return MOCK_PROVIDERS;
  }, [sessionProviders, apiProviders]);

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

    if (matchSessionId) {
      await acceptCard(current.id);
    }

    sessionStorage.setItem("accepted_provider", JSON.stringify(current));
    advanceAccept();
    router.push("/work-confirmed");
  };

  const handleReject = async () => {
    if (!current) return;

    if (matchSessionId) {
      await rejectCard(current.id);
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
        ) : (
          <CardStack cards={visibleCards} onAccept={handleAccept} onReject={handleReject} />
        )}

        <SwipeActions
          onAccept={handleAccept}
          onReject={handleReject}
          onUndo={handleUndo}
          canUndo={canUndo}
          disabled={isEmpty || isLoading}
        />
      </div>
    </ScreenShell>
  );
}

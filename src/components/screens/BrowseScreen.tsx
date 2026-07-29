"use client";

import { useMemo } from "react";

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
import { useBrowseSession } from "@/hooks/useSearchSession";

export function BrowseScreen() {
  const { parsedRequest, providers } = useBrowseSession();

  const {
    visibleCards,
    currentIndex,
    accept,
    reject,
    undo,
    canUndo,
    isEmpty,
  } = useCardStack(providers);

  const tags = useMemo(
    () => buildParsedTags(parsedRequest),
    [parsedRequest]
  );

  if (providers.length === 0) {
    return (
      <ScreenShell>
        <TopBar variant="back" title="Explorar" rightIcon="none" />
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No pudimos cargar los resultados. Volvé al inicio e intentá de nuevo.
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <TopBar
        variant="back"
        title={`${providers.length} profesionales para vos`}
        rightIcon="filter"
      />

      <div className="space-y-3">
        <AIInterpretationBanner summary={parsedRequest.summary} />
        <ParsedTags tags={tags} />
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs font-medium text-zinc-500">
            Mejor coincidencia primero
          </p>
          <p className="text-xs tabular-nums text-zinc-400">
            {Math.min(currentIndex + 1, providers.length)} de {providers.length}
          </p>
        </div>
        <CardStack cards={visibleCards} onAccept={accept} onReject={reject} />
        <SwipeActions
          onAccept={accept}
          onReject={reject}
          onUndo={undo}
          canUndo={canUndo}
          disabled={isEmpty}
        />
      </div>
    </ScreenShell>
  );
}

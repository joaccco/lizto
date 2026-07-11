"use client";

import { useCallback, useMemo, useState } from "react";

import type { Provider } from "@/lib/types";

type StackAction = "accept" | "reject";

interface UndoEntry {
  provider: Provider;
  action: StackAction;
}

interface UseCardStackResult {
  current: Provider | null;
  currentIndex: number;
  accepted: Provider[];
  rejected: Provider[];
  visibleCards: Provider[];
  isEmpty: boolean;
  canUndo: boolean;
  accept: () => void;
  reject: () => void;
  undo: () => void;
}

export function useCardStack(providers: Provider[]): UseCardStackResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepted, setAccepted] = useState<Provider[]>([]);
  const [rejected, setRejected] = useState<Provider[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);

  const current = providers[currentIndex] ?? null;

  const visibleCards = useMemo(
    () => providers.slice(currentIndex, currentIndex + 3),
    [providers, currentIndex]
  );

  const advance = useCallback(
    (provider: Provider, action: StackAction) => {
      setUndoStack((previous) => [...previous, { provider, action }]);

      if (action === "accept") {
        setAccepted((previous) => [...previous, provider]);
      } else {
        setRejected((previous) => [...previous, provider]);
      }

      setCurrentIndex((previous) => previous + 1);
    },
    []
  );

  const accept = useCallback(() => {
    if (!current) {
      return;
    }

    advance(current, "accept");
  }, [advance, current]);

  const reject = useCallback(() => {
    if (!current) {
      return;
    }

    advance(current, "reject");
  }, [advance, current]);

  const undo = useCallback(() => {
    setUndoStack((previous) => {
      const lastAction = previous.at(-1);

      if (!lastAction) {
        return previous;
      }

      setCurrentIndex((index) => Math.max(0, index - 1));

      if (lastAction.action === "accept") {
        setAccepted((items) => items.slice(0, -1));
      } else {
        setRejected((items) => items.slice(0, -1));
      }

      return previous.slice(0, -1);
    });
  }, []);

  return {
    current,
    currentIndex,
    accepted,
    rejected,
    visibleCards,
    isEmpty: currentIndex >= providers.length,
    canUndo: undoStack.length > 0,
    accept,
    reject,
    undo,
  };
}

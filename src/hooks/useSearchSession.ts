"use client";

import { useSyncExternalStore } from "react";

import {
  EXAMPLE_PARSED_REQUEST,
  getProvidersByCategorySlug,
  getRankedUrgentProviders,
} from "@/lib/mock-data";
import {
  loadSearchSession,
  subscribeSearchSession,
} from "@/lib/storage";
import type { ParsedRequest, Provider } from "@/lib/types";

interface BrowseSessionData {
  parsedRequest: ParsedRequest;
  providers: Provider[];
}

const BROWSE_FALLBACK: BrowseSessionData = {
  parsedRequest: EXAMPLE_PARSED_REQUEST,
  providers: getProvidersByCategorySlug(EXAMPLE_PARSED_REQUEST.categorySlug),
};

function getBrowseSnapshot(): BrowseSessionData {
  const storedSession = loadSearchSession();

  if (storedSession && storedSession.providers.length > 0) {
    return storedSession;
  }

  return BROWSE_FALLBACK;
}

function getBrowseServerSnapshot(): BrowseSessionData {
  return BROWSE_FALLBACK;
}

export function useBrowseSession(): BrowseSessionData {
  return useSyncExternalStore(
    subscribeSearchSession,
    getBrowseSnapshot,
    getBrowseServerSnapshot
  );
}

interface FastModeSessionData {
  parsedRequest: ParsedRequest;
  providers: Provider[];
}

const FAST_MODE_FALLBACK: ParsedRequest = {
  raw_intent: "cerrajero urgente",
  category_hints: ["cerrajería"],
  urgency: "immediate",
  is_remote: false,
  requires_presence: true,
  estimated_complexity: "low",
  ambiguity_level: "low",
  clarification_needed: [],
  confidence: 0.88,
  summary: "Cerrajero urgente en tu zona",
  category: "Cerrajería",
  categorySlug: "cerrajeria",
  location: "CABA",
};

const FAST_MODE_SERVER_SNAPSHOT: FastModeSessionData = {
  parsedRequest: FAST_MODE_FALLBACK,
  providers: getRankedUrgentProviders("cerrajeria"),
};

let cachedFastParsedRequest: ParsedRequest | null = null;
let cachedFastSnapshot: FastModeSessionData | null = null;

function getFastModeSnapshot(): FastModeSessionData {
  const storedSession = loadSearchSession();
  const storedParsed = storedSession?.parsedRequest;

  if (storedParsed) {
    if (storedParsed === cachedFastParsedRequest && cachedFastSnapshot) {
      return cachedFastSnapshot;
    }

    cachedFastParsedRequest = storedParsed;
    cachedFastSnapshot = {
      parsedRequest: storedParsed,
      providers: getRankedUrgentProviders(storedParsed.categorySlug),
    };
    return cachedFastSnapshot;
  }

  return FAST_MODE_SERVER_SNAPSHOT;
}

function getFastModeServerSnapshot(): FastModeSessionData {
  return FAST_MODE_SERVER_SNAPSHOT;
}

export function useFastModeSession(): FastModeSessionData {
  return useSyncExternalStore(
    subscribeSearchSession,
    getFastModeSnapshot,
    getFastModeServerSnapshot
  );
}

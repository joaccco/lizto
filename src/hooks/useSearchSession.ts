"use client";

import { useSyncExternalStore } from "react";

import {
  EXAMPLE_PARSED_REQUEST,
  getProvidersByCategorySlug,
  getRankedUrgentProviders,
} from "@/lib/mock-data";
import { loadParsedRequest, loadProviders } from "@/lib/storage";
import type { ParsedRequest, Provider } from "@/lib/types";

interface BrowseSessionData {
  parsedRequest: ParsedRequest;
  providers: Provider[];
}

function getBrowseSnapshot(): BrowseSessionData {
  const storedParsed = loadParsedRequest();
  const storedProviders = loadProviders();

  if (storedParsed && storedProviders.length > 0) {
    return {
      parsedRequest: storedParsed,
      providers: storedProviders,
    };
  }

  return {
    parsedRequest: EXAMPLE_PARSED_REQUEST,
    providers: getProvidersByCategorySlug(EXAMPLE_PARSED_REQUEST.categorySlug),
  };
}

function getBrowseServerSnapshot(): BrowseSessionData {
  return {
    parsedRequest: EXAMPLE_PARSED_REQUEST,
    providers: getProvidersByCategorySlug(EXAMPLE_PARSED_REQUEST.categorySlug),
  };
}

export function useBrowseSession(): BrowseSessionData {
  return useSyncExternalStore(
    () => () => undefined,
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

function getFastModeSnapshot(): FastModeSessionData {
  const storedParsed = loadParsedRequest();

  if (storedParsed) {
    return {
      parsedRequest: storedParsed,
      providers: getRankedUrgentProviders(storedParsed.categorySlug),
    };
  }

  return {
    parsedRequest: FAST_MODE_FALLBACK,
    providers: getRankedUrgentProviders("cerrajeria"),
  };
}

function getFastModeServerSnapshot(): FastModeSessionData {
  return {
    parsedRequest: FAST_MODE_FALLBACK,
    providers: getRankedUrgentProviders("cerrajeria"),
  };
}

export function useFastModeSession(): FastModeSessionData {
  return useSyncExternalStore(
    () => () => undefined,
    getFastModeSnapshot,
    getFastModeServerSnapshot
  );
}

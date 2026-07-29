"use client";

import { useCallback, useState } from "react";

import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import { buildMockParseResponse } from "@/lib/mock-data";
import { saveSearchSession } from "@/lib/storage";
import type {
  BackendParseRequestResponse,
  ParseRequestResponse,
  ParsedRequest,
  Provider,
  Urgency,
} from "@/lib/types";

interface UseParsedRequestResult {
  parsed: ParsedRequest | null;
  providers: Provider[];
  isLoading: boolean;
  error: string | null;
  mode: "fast" | "browse" | "professional" | null;
  parse: (prompt: string, urgency?: Urgency) => Promise<ParseRequestResponse>;
  resetError: () => void;
}

export function useParsedRequest(): UseParsedRequestResult {
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [mode, setMode] = useState<"fast" | "browse" | "professional" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (prompt: string, urgency: Urgency = "today") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<BackendParseRequestResponse>(
        ENDPOINTS.REQUEST_PARSE,
        {
          method: "POST",
          body: JSON.stringify({ prompt, urgency }),
        }
      );

      const intent = response.data.parsed_intent;
      const categorySlug = intent.category_slug || "general";
      const categoryName = categorySlug
        ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
        : "General";

      const parsedRequest: ParsedRequest = {
        raw_intent: intent.raw_intent || prompt,
        category_hints: intent.detected_keywords || [],
        urgency: (intent.urgency as Urgency) || urgency,
        is_remote: intent.is_remote ?? false,
        requires_presence: intent.requires_presence ?? true,
        estimated_complexity: (intent.estimated_complexity as any) || "medium",
        ambiguity_level: (intent.ambiguity_level as any) || "low",
        clarification_needed: intent.clarification_needed || [],
        confidence: intent.confidence ?? 0.9,
        summary: intent.raw_intent || prompt,
        category: categoryName,
        categorySlug: categorySlug,
        location: "CABA",
      };

      const parsedMode = response.data.mode || (urgency === "immediate" ? "fast" : "browse");

      const result: ParseRequestResponse = {
        parsed_request: parsedRequest,
        providers: [],
        mode: parsedMode,
        rawBackendData: response.data,
      };

      setParsed(parsedRequest);
      setMode(parsedMode);

      // Save into sessionStorage & searchStorage
      sessionStorage.setItem("parsed_request", JSON.stringify(result));
      saveSearchSession(parsedRequest, []);

      return result;
    } catch {
      // Fallback to mock data on network error
      const mockResult = buildMockParseResponse(prompt, urgency);
      const fallbackMode: "fast" | "browse" | "professional" =
        urgency === "immediate" ? "fast" : "browse";

      const result: ParseRequestResponse = {
        parsed_request: mockResult.parsed_request,
        providers: mockResult.providers,
        mode: fallbackMode,
      };

      setParsed(mockResult.parsed_request);
      setProviders(mockResult.providers);
      setMode(fallbackMode);

      sessionStorage.setItem("parsed_request", JSON.stringify(result));
      saveSearchSession(mockResult.parsed_request, mockResult.providers);

      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    parsed,
    providers,
    isLoading,
    error,
    mode,
    parse,
    resetError,
  };
}

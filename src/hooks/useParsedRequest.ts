"use client";

import { useCallback, useState } from "react";

import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import { buildMockParseResponse } from "@/lib/mock-data";
import { saveSearchSession } from "@/lib/storage";
import type {
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
  parse: (prompt: string, urgency: Urgency) => Promise<ParseRequestResponse>;
  resetError: () => void;
}

export function useParsedRequest(): UseParsedRequestResult {
  const [parsed, setParsed] = useState<ParsedRequest | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (prompt: string, urgency: Urgency) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch<ParseRequestResponse>(ENDPOINTS.REQUEST_PARSE, {
        method: "POST",
        body: JSON.stringify({ prompt, urgency }),
      });

      setParsed(data.parsed_request);
      setProviders(data.providers);
      saveSearchSession(data.parsed_request, data.providers);

      return data;
    } catch (parseError) {
      if (process.env.NODE_ENV !== "production") {
        const data = buildMockParseResponse();

        setParsed(data.parsed_request);
        setProviders(data.providers);
        saveSearchSession(data.parsed_request, data.providers);

        return data;
      }

      const message =
        parseError instanceof Error
          ? parseError.message
          : "Ocurrió un error inesperado.";
      setError(message);
      throw parseError;
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
    parse,
    resetError,
  };
}

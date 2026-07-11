"use client";

import { useCallback, useState } from "react";

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
      const response = await fetch("/api/parse-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, urgency }),
      });

      if (!response.ok) {
        throw new Error("No pudimos interpretar tu solicitud. Intentá de nuevo.");
      }

      const data = (await response.json()) as ParseRequestResponse;

      setParsed(data.parsed_request);
      setProviders(data.providers);
      saveSearchSession(data.parsed_request, data.providers);

      return data;
    } catch (parseError) {
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

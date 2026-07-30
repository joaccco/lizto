"use client";

import { useCallback, useState } from "react";

import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import { mapBackendProviderToFrontend } from "@/hooks/useProviders";
import type { ParsedRequest, Provider } from "@/lib/types";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id?: number | string;
  key: string;
  text: string;
  input_type: "single_select" | "multi_select" | "text" | "boolean" | "photo";
  options: QuestionOption[] | null;
  is_required: boolean;
}

export interface AnswerItem {
  question_key: string;
  question_text: string;
  answer_value: any;
  question_id?: number | string;
}

export interface MatchCardData {
  card_id: number;
  rank_position: number;
  score_total: number;
  score_breakdown: any;
  card_status: string;
  provider: Provider;
}

interface CreateRequestResponse {
  data: {
    id: string;
    status: string;
    urgency: string;
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
    suggested_questions: Question[];
    created_at: string;
  };
  message: string;
}

interface SubmitSurveyResponse {
  data: {
    request_id: string;
    status: string;
    structured_data: Record<string, any>;
  };
  message: string;
}

interface MatchSessionResponse {
  data: {
    session_id: string;
    total_providers: number;
    cards: Array<{
      card_id: number;
      rank_position: number;
      score_total: number;
      score_breakdown: any;
      card_status: string;
      provider: any;
    }>;
  };
}

export function useServiceRequest() {
  const [requestId, setRequestId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("service_request_id");
    }
    return null;
  });

  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("match_session_id");
    }
    return null;
  });

  const [status, setStatus] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<Question[]>([]);
  const [cards, setCards] = useState<MatchCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRequest = useCallback(async (parsedIntent: ParsedRequest) => {
    const existingId = sessionStorage.getItem("service_request_id");
    if (existingId) {
      setRequestId(existingId);
      return { id: existingId, status: "pending_survey", suggested_questions: [] };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<CreateRequestResponse>(ENDPOINTS.REQUESTS, {
        method: "POST",
        body: JSON.stringify({
          prompt: parsedIntent.raw_intent,
          urgency: parsedIntent.urgency,
          category_slug: parsedIntent.categorySlug,
          is_remote: parsedIntent.is_remote ?? false,
          location: {
            lat: -27.4692,
            lng: -58.8306,
            address: "Corrientes, Argentina",
          },
          parsed_intent: {
            raw_intent: parsedIntent.raw_intent,
            confidence: parsedIntent.confidence ?? 0.9,
            detected_keywords: parsedIntent.category_hints ?? [],
            ambiguity_level: parsedIntent.ambiguity_level ?? "low",
            clarification_needed: parsedIntent.clarification_needed ?? [],
          },
        }),
      });

      const newId = response.data.id;
      const questions = response.data.suggested_questions || [];

      setRequestId(newId);
      setStatus(response.data.status);
      setSuggestedQuestions(questions);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("service_request_id", newId);
      }

      return response.data;
    } catch (err: any) {
      console.warn("Failed to create service request:", err);
      const msg = err instanceof Error ? err.message : "Error al crear la solicitud";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitSurvey = useCallback(
    async (answers: AnswerItem[]) => {
      const activeRequestId = requestId || sessionStorage.getItem("service_request_id");
      if (!activeRequestId) {
        throw new Error("No hay una solicitud activa.");
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiFetch<SubmitSurveyResponse>(
          ENDPOINTS.REQUEST_SURVEY(activeRequestId),
          {
            method: "POST",
            body: JSON.stringify({ answers }),
          }
        );

        setStatus(response.data.status);
        return response.data;
      } catch (err: any) {
        console.warn("Failed to submit survey:", err);
        const msg = err instanceof Error ? err.message : "Error al enviar la encuesta";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [requestId]
  );

  const createMatchSession = useCallback(async () => {
    const activeRequestId = requestId || sessionStorage.getItem("service_request_id");
    if (!activeRequestId) {
      throw new Error("No hay una solicitud activa.");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<MatchSessionResponse>(
        ENDPOINTS.REQUEST_MATCH(activeRequestId),
        {
          method: "POST",
        }
      );

      const newSessionId = response.data.session_id;
      const rawCards = response.data.cards || [];

      const mappedCards: MatchCardData[] = rawCards.map((c) => {
        const pData = c.provider;
        let providerObj: Provider;

        if (pData.uuid && pData.categories) {
          providerObj = mapBackendProviderToFrontend(pData);
        } else {
          providerObj = {
            id: pData.uuid || String(c.card_id),
            name: pData.name || "Profesional",
            initials: (pData.name || "PR")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase(),
            photo: pData.avatar_url || "/providers/roberto-medina-v2.png",
            category: "Servicios",
            categorySlug: "general",
            specialties: ["Servicio calificado"],
            neighborhood: pData.distance_km ? `${pData.distance_km} km` : "CABA",
            rating: pData.avg_rating || 5.0,
            reviewCount: pData.total_reviews || 0,
            jobsCompleted: 45,
            responseTime: "< 15 min",
            isVerified: pData.is_verified ?? true,
            description: pData.bio || "Profesional verificado de Lizto.",
            priceMin: pData.price_from || 8000,
            priceMax: pData.price_from ? pData.price_from * 3 : 35000,
            priceFrom: pData.price_from || 8000,
            distanceKm: pData.distance_km || 1.5,
            etaMinutes: pData.eta_minutes || 15,
            availableNow: pData.availability_status === "available",
            nextAvailability:
              pData.availability_status === "available"
                ? "Disponible ahora"
                : "Disponible pronto",
          };
        }

        (providerObj as any).card_id = c.card_id;
        (providerObj as any).match_card_id = c.card_id;

        return {
          card_id: c.card_id,
          rank_position: c.rank_position,
          score_total: c.score_total,
          score_breakdown: c.score_breakdown,
          card_status: c.card_status,
          provider: providerObj,
        };
      });

      setSessionId(newSessionId);
      setCards(mappedCards);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("match_session_id", newSessionId);
        // FIX 3: Save full card objects (with card_id) not just the provider
        sessionStorage.setItem(
          "match_cards",
          JSON.stringify(
            mappedCards.map((mc) => ({
              card_id: mc.card_id,
              rank_position: mc.rank_position,
              score_total: mc.score_total,
              card_status: mc.card_status,
              provider: mc.provider,
            }))
          )
        );
      }

      return response.data;
    } catch (err: any) {
      console.warn("Failed to create match session:", err);
      const msg = err instanceof Error ? err.message : "Error al iniciar el matching";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  const acceptCard = useCallback(
    async (cardId: number | string) => {
      const activeSessionId = sessionId || sessionStorage.getItem("match_session_id");
      if (!activeSessionId) return;

      setIsLoading(true);
      try {
        await apiFetch(ENDPOINTS.CARD_ACCEPT(activeSessionId, String(cardId)), {
          method: "POST",
        });
      } catch (err) {
        console.warn("Failed to accept card:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const rejectCard = useCallback(
    async (cardId: number | string) => {
      const activeSessionId = sessionId || sessionStorage.getItem("match_session_id");
      if (!activeSessionId) return null;

      setIsLoading(true);
      try {
        const res = await apiFetch<{ data: { next_card: any } }>(
          ENDPOINTS.CARD_REJECT(activeSessionId, String(cardId)),
          {
            method: "POST",
          }
        );
        return res.data?.next_card || null;
      } catch (err) {
        console.warn("Failed to reject card:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  const recoverCard = useCallback(
    async (cardId?: number | string) => {
      const activeSessionId = sessionId || sessionStorage.getItem("match_session_id");
      if (!activeSessionId) return;

      setIsLoading(true);
      try {
        const targetId = cardId ? String(cardId) : "0";
        await apiFetch(ENDPOINTS.CARD_RECOVER(activeSessionId, targetId), {
          method: "POST",
        });
      } catch (err) {
        console.warn("Failed to recover card:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  return {
    requestId,
    sessionId,
    status,
    suggestedQuestions,
    cards,
    isLoading,
    error,
    createRequest,
    submitSurvey,
    createMatchSession,
    acceptCard,
    rejectCard,
    recoverCard,
  };
}

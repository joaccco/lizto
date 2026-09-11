import type { ParsedRequest, Provider } from "@/lib/types";

export const MOCK_USER_NAME = "";

export const MOCK_PARSED_REQUEST: ParsedRequest = {
  raw_intent: "cerrajero urgente, quedé afuera de mi casa",
  category_hints: ["cerrajería", "apertura"],
  urgency: "immediate",
  is_remote: false,
  requires_presence: true,
  estimated_complexity: "simple",
  ambiguity_level: "low",
  clarification_needed: [],
  confidence: 0.95,
  summary: "Cerrajero urgente para apertura de puerta",
  category: "Cerrajería",
  categorySlug: "cerrajeria",
  location: "CABA",
};

export const EXAMPLE_PARSED_REQUEST = MOCK_PARSED_REQUEST;

export const MOCK_PROVIDERS: Provider[] = [];

export function formatPriceRange(min: number, max: number): string {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(min)} – ${formatter.format(max)}`;
}

export function getProvidersByCategorySlug(slug: string): Provider[] {
  return [];
}

export function getRankedUrgentProviders(categorySlug?: string): Provider[] {
  return [];
}

export function buildMockParseResponse(
  prompt = MOCK_PARSED_REQUEST.raw_intent,
  urgency: ParsedRequest["urgency"] = MOCK_PARSED_REQUEST.urgency
): {
  parsed_request: ParsedRequest;
  providers: Provider[];
} {
  const parsedRequest = {
    ...MOCK_PARSED_REQUEST,
    raw_intent: prompt,
    urgency,
  };

  return {
    parsed_request: parsedRequest,
    providers: getRankedUrgentProviders(parsedRequest.categorySlug),
  };
}

import { NextResponse } from "next/server";

import {
  EXAMPLE_PARSED_REQUEST,
  MOCK_PROVIDERS,
  getProvidersByCategorySlug,
  getRankedUrgentProviders,
} from "@/lib/mock-data";
import type {
  ParseRequestPayload,
  ParseRequestResponse,
  ParsedRequest,
  Urgency,
} from "@/lib/types";

const CATEGORY_KEYWORDS: Record<string, { category: string; slug: string }> = {
  cerrajer: { category: "Cerrajería", slug: "cerrajeria" },
  electric: { category: "Electricista", slug: "electricista" },
  plom: { category: "Plomería", slug: "plomeria" },
  foto: { category: "Fotografía", slug: "fotografia" },
  fotograf: { category: "Fotografía", slug: "fotografia" },
  abogad: { category: "Abogado", slug: "abogado" },
  contad: { category: "Contador", slug: "contador" },
  dise: { category: "Diseño", slug: "diseno" },
};

function detectCategory(prompt: string) {
  const normalized = prompt.toLowerCase();

  for (const [keyword, value] of Object.entries(CATEGORY_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return value;
    }
  }

  return {
    category: EXAMPLE_PARSED_REQUEST.category,
    slug: EXAMPLE_PARSED_REQUEST.categorySlug,
  };
}

function buildParsedRequest(
  prompt: string,
  urgency: Urgency
): ParsedRequest {
  const detected = detectCategory(prompt);

  return {
    raw_intent: prompt,
    category_hints: [detected.category.toLowerCase()],
    urgency,
    is_remote: false,
    requires_presence: true,
    estimated_complexity: "medium",
    ambiguity_level: "low",
    clarification_needed: [],
    confidence: 0.9,
    summary: `${detected.category} para: ${prompt}`,
    category: detected.category,
    categorySlug: detected.slug,
    location: "CABA",
  };
}

function getProvidersForRequest(parsed: ParsedRequest, urgency: Urgency) {
  if (urgency === "immediate") {
    return getRankedUrgentProviders(parsed.categorySlug);
  }

  const matches = getProvidersByCategorySlug(parsed.categorySlug);

  return matches.length > 0 ? matches : MOCK_PROVIDERS;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ParseRequestPayload>;
    const prompt = body.prompt?.trim();
    const urgency = body.urgency;

    if (!prompt) {
      return NextResponse.json(
        { message: "El prompt es obligatorio." },
        { status: 400 }
      );
    }

    if (!urgency || !["immediate", "today", "scheduled"].includes(urgency)) {
      return NextResponse.json(
        { message: "La urgencia no es válida." },
        { status: 400 }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 900));

    const parsed_request = buildParsedRequest(prompt, urgency);
    const providers = getProvidersForRequest(parsed_request, urgency);

    const response: ParseRequestResponse = {
      parsed_request,
      providers,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { message: "No pudimos procesar la solicitud." },
      { status: 500 }
    );
  }
}

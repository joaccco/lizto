"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { getProvidersByCategorySlug } from "@/lib/mock-data";
import { saveSearchSession } from "@/lib/storage";
import type { ParsedRequest } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  cerrajeria: "Cerrajería",
  electricista: "Electricista",
  plomeria: "Plomería",
  fotografia: "Fotografía",
  abogado: "Abogado",
  contador: "Contador",
  diseno: "Diseño",
  "ver-mas": "Todos los servicios",
};

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") ?? "ver-mas";

  useEffect(() => {
    const category = CATEGORY_LABELS[categorySlug] ?? "Servicios";
    const providers = getProvidersByCategorySlug(categorySlug);

    const parsedRequest: ParsedRequest = {
      raw_intent: `Buscar ${category.toLowerCase()}`,
      category_hints: [category.toLowerCase()],
      urgency: "today",
      is_remote: false,
      requires_presence: true,
      estimated_complexity: "medium",
      ambiguity_level: "low",
      clarification_needed: [],
      confidence: 0.85,
      summary: `Profesionales de ${category} disponibles en CABA`,
      category,
      categorySlug,
      location: "CABA",
    };

    saveSearchSession(parsedRequest, providers);
    router.replace("/browse");
  }, [categorySlug, router]);

  return null;
}

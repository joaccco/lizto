import type { ParsedRequest, Provider } from "@/lib/types";

export const MOCK_USER_NAME = "María";

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

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: "1",
    name: "Roberto Medina",
    initials: "RM",
    category: "Cerrajería",
    categorySlug: "cerrajeria",
    rating: 4.9,
    reviewCount: 87,
    jobsCompleted: 124,
    responseTime: "< 8 min",
    isVerified: true,
    description:
      "Cerrajero con 12 años de experiencia. Especializado en apertura de puertas y reemplazo de cerraduras de seguridad.",
    priceFrom: 8000,
    priceTo: 35000,
    priceMin: 8000,
    priceMax: 35000,
    distanceKm: 1.2,
    etaMinutes: 12,
    availableNow: true,
    nextAvailability: "Disponible ahora",
  },
  {
    id: "2",
    name: "Diego Fernández",
    initials: "DF",
    category: "Cerrajería",
    categorySlug: "cerrajeria",
    rating: 4.6,
    reviewCount: 43,
    jobsCompleted: 67,
    responseTime: "< 15 min",
    isVerified: true,
    description: "Cerrajero automotor y de edificios. Trabajo las 24hs.",
    priceFrom: 7500,
    priceTo: 40000,
    priceMin: 7500,
    priceMax: 40000,
    distanceKm: 2.8,
    etaMinutes: 20,
    availableNow: false,
    nextAvailability: "~35 min",
  },
  {
    id: "3",
    name: "Ana Kupfer",
    initials: "AK",
    category: "Cerrajería",
    categorySlug: "cerrajeria",
    rating: 4.7,
    reviewCount: 61,
    jobsCompleted: 89,
    responseTime: "< 10 min",
    isVerified: true,
    description:
      "Cerrajera certificada. Especialista en cerraduras de seguridad.",
    priceFrom: 9000,
    priceTo: 45000,
    priceMin: 9000,
    priceMax: 45000,
    distanceKm: 3.5,
    etaMinutes: 28,
    availableNow: true,
    nextAvailability: "Disponible ahora",
  },
];

export function formatPriceRange(min: number, max: number): string {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return `${formatter.format(min)} – ${formatter.format(max)}`;
}

export function getProvidersByCategorySlug(slug: string): Provider[] {
  if (slug === "ver-mas") {
    return MOCK_PROVIDERS;
  }

  return MOCK_PROVIDERS.filter((provider) => provider.categorySlug === slug);
}

export function getRankedUrgentProviders(categorySlug?: string): Provider[] {
  const pool = categorySlug
    ? MOCK_PROVIDERS.filter((provider) => provider.categorySlug === categorySlug)
    : MOCK_PROVIDERS.filter((provider) => provider.availableNow);

  return [...pool]
    .sort((a, b) => {
      const scoreA = a.rating * 10 - a.distanceKm - a.etaMinutes * 0.1;
      const scoreB = b.rating * 10 - b.distanceKm - b.etaMinutes * 0.1;
      return scoreB - scoreA;
    })
    .slice(0, 3);
}

export function buildMockParseResponse(): {
  parsed_request: ParsedRequest;
  providers: Provider[];
} {
  return {
    parsed_request: MOCK_PARSED_REQUEST,
    providers: getRankedUrgentProviders(MOCK_PARSED_REQUEST.categorySlug),
  };
}

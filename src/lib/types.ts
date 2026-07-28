export type Urgency = "immediate" | "today" | "scheduled";

export interface Provider {
  id: string;
  name: string;
  initials: string;
  category: string;
  categorySlug: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  responseTime: string;
  isVerified: boolean;
  description: string;
  priceMin: number;
  priceMax: number;
  priceFrom?: number;
  priceTo?: number;
  distanceKm: number;
  etaMinutes: number;
  availableNow: boolean;
  nextAvailability: string;
}

export interface ParsedRequest {
  raw_intent: string;
  category_hints: string[];
  urgency: Urgency;
  is_remote: boolean;
  requires_presence: boolean;
  estimated_complexity: "simple" | "low" | "medium" | "high";
  ambiguity_level: "low" | "medium" | "high";
  clarification_needed: string[];
  confidence: number;
  summary: string;
  category: string;
  categorySlug: string;
  location: string;
}

export interface ParseRequestPayload {
  prompt: string;
  urgency: Urgency;
}

export interface ParseRequestResponse {
  parsed_request: ParsedRequest;
  providers: Provider[];
}

export interface ParsedTag {
  id: string;
  label: string;
  type: "category" | "location" | "urgency" | "work";
}

export type Urgency = "immediate" | "today" | "scheduled" | "flexible";

export interface Provider {
  id: string;
  name: string;
  initials: string;
  photo: string;
  category: string;
  categorySlug: string;
  specialties: string[];
  neighborhood: string;
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
  urgency?: Urgency;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface BackendParsedIntent {
  raw_intent: string;
  category_slug: string | null;
  category_id: number | null;
  urgency: string;
  is_remote: boolean;
  requires_presence: boolean;
  estimated_complexity: string;
  ambiguity_level: string;
  clarification_needed: string[];
  confidence: number;
  detected_keywords: string[];
}

export interface SuggestedQuestion {
  key: string;
  text: string;
  input_type: string;
  options: Array<{ value: string; label: string }> | null;
  is_required: boolean;
}

export interface BackendParseRequestResponse {
  data: {
    parsed_intent: BackendParsedIntent;
    suggested_questions: SuggestedQuestion[];
    mode: "fast" | "browse" | "professional";
  };
}

export interface ParseRequestResponse {
  parsed_request: ParsedRequest;
  providers: Provider[];
  mode?: "fast" | "browse" | "professional";
  rawBackendData?: BackendParseRequestResponse["data"];
}

export interface BackendCategoryItem {
  id: string;
  name: string;
  slug: string;
  specialties: string[];
  price_type: string;
  price_from: number | null;
  price_to: number | null;
}

export interface BackendProvider {
  uuid: string;
  name: string;
  avatar_url: string | null;
  bio: string;
  years_experience: number;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  price_from: number | null;
  availability_status: "available" | "busy" | "unavailable";
  busy_until: string | null;
  next_available_at: string | null;
  distance_km: number | null;
  categories: BackendCategoryItem[];
}

export interface BackendProvidersResponse {
  data: BackendProvider[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
  };
}

export interface BackendCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }>;
}

export interface BackendCategoriesResponse {
  data: BackendCategory[];
}

export interface ParsedTag {
  id: string;
  label: string;
  type: "category" | "location" | "urgency" | "work";
}

export interface User {
  id: string; // uuid
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  roles: string[];
  has_provider_profile: boolean;
  created_at: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
  message: string;
}



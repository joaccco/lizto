"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import { MOCK_PROVIDERS } from "@/lib/mock-data";
import type { BackendProvider, BackendProvidersResponse, Provider } from "@/lib/types";

interface UseProvidersOptions {
  category?: string;
  availability?: string;
}

export function mapBackendProviderToFrontend(bp: BackendProvider): Provider {
  const primaryCat = bp.categories?.[0];
  const categoryName = primaryCat?.name || "General";
  const categorySlug = primaryCat?.slug || "general";
  const specialties = primaryCat?.specialties || [];

  const initials =
    bp.name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .substring(0, 2)
      .toUpperCase() || "PR";

  const priceFrom = bp.price_from ?? primaryCat?.price_from ?? 0;
  const priceTo = primaryCat?.price_to ?? undefined;

  let responseTime = "< 15 min";
  let nextAvailability = "Disponible ahora";
  if (bp.availability_status === "busy") {
    nextAvailability = bp.next_available_at
      ? `Disponible a las ${bp.next_available_at}`
      : "Ocupado";
    responseTime = "~30 min";
  } else if (bp.availability_status === "unavailable") {
    nextAvailability = "No disponible";
    responseTime = "No disponible";
  }

  return {
    id: bp.uuid,
    name: bp.name,
    initials,
    photo: bp.avatar_url || "/providers/roberto-medina-v2.png",
    category: categoryName,
    categorySlug,
    specialties,
    neighborhood: bp.distance_km ? `${bp.distance_km} km` : "CABA",
    rating: bp.avg_rating || 5.0,
    reviewCount: bp.total_reviews || 0,
    jobsCompleted: bp.total_jobs_completed || 0,
    responseTime,
    isVerified: bp.is_verified ?? true,
    description: bp.bio || "",
    priceMin: priceFrom,
    priceMax: priceTo ?? (priceFrom ? priceFrom * 2 : 40000),
    priceFrom,
    priceTo,
    distanceKm: bp.distance_km ?? 1.5,
    etaMinutes: bp.availability_status === "available" ? 12 : 30,
    availableNow: bp.availability_status === "available",
    nextAvailability,
  };
}

export function useProviders(options: UseProvidersOptions = {}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (options.category) queryParams.set("category", options.category);
    if (options.availability) queryParams.set("availability", options.availability);

    const queryString = queryParams.toString();
    const endpoint = `${ENDPOINTS.PROVIDERS}${queryString ? `?${queryString}` : ""}`;

    apiFetch<BackendProvidersResponse>(endpoint)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map(mapBackendProviderToFrontend);
          setProviders(mapped);
        } else {
          // Fallback to mock providers if empty response or category match in mock
          const filteredMock = options.category
            ? MOCK_PROVIDERS.filter((p) => p.categorySlug === options.category)
            : MOCK_PROVIDERS;
          setProviders(filteredMock.length > 0 ? filteredMock : MOCK_PROVIDERS);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Error fetching providers from backend, fallback to mock data:", err);
        const filteredMock = options.category
          ? MOCK_PROVIDERS.filter((p) => p.categorySlug === options.category)
          : MOCK_PROVIDERS;
        setProviders(filteredMock.length > 0 ? filteredMock : MOCK_PROVIDERS);
        setError("No se pudieron cargar los datos en vivo. Mostrando datos de respaldo.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [options.category, options.availability]);

  return { providers, isLoading, error };
}

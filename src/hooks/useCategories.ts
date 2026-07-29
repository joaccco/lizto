"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { BackendCategoriesResponse, BackendCategory } from "@/lib/types";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  children?: Category[];
}

export const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", name: "Cerrajería", slug: "cerrajeria", icon: "lock" },
  { id: "2", name: "Electricidad", slug: "electricidad", icon: "zap" },
  { id: "3", name: "Plomería", slug: "plomeria", icon: "droplets" },
  { id: "4", name: "Fotografía", slug: "fotografia", icon: "camera" },
  { id: "5", name: "Abogacía", slug: "abogacia", icon: "scale" },
  { id: "6", name: "Contaduría", slug: "contaduria", icon: "calculator" },
  { id: "7", name: "Diseño", slug: "diseno", icon: "brush" },
  { id: "8", name: "Limpieza", slug: "limpieza", icon: "sparkles" },
];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    apiFetch<BackendCategoriesResponse>(ENDPOINTS.CATEGORIES)
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.length > 0) {
          const mapped: Category[] = res.data.map((cat: BackendCategory) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            children: cat.children?.map((child) => ({
              id: child.id,
              name: child.name,
              slug: child.slug,
              icon: child.icon,
            })),
          }));
          setCategories(mapped);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Error fetching categories from backend, using fallback:", err);
        setCategories(FALLBACK_CATEGORIES);
        setError("Error al cargar categorías del servidor.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, isLoading, error };
}

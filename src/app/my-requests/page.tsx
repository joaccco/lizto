"use client";

import {
  Brush,
  Calculator,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  Grid2x2,

  Loader2,
  Lock,
  Scale,
  Search,
  Sparkles,
  Star,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

const categoryIcons: Record<string, LucideIcon> = {
  cerrajeria: Lock,
  electricidad: Zap,
  electricista: Zap,
  plomeria: Droplets,
  fotografia: Camera,
  abogacia: Scale,
  abogado: Scale,
  contaduria: Calculator,
  contador: Calculator,
  diseno: Brush,
  limpieza: Sparkles,
};

interface RequestItem {
  uuid: string;
  raw_prompt: string;
  full_prompt: string;
  status: string;
  urgency: string;
  category: {
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  accepted_provider: {
    name: string;
    avg_rating: number;
    avatar_url: string | null;
  } | null;
  created_at: string;
}

const STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  pending_survey: {
    label: "En proceso",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  },
  pending_matching: {
    label: "Buscando",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  matching_active: {
    label: "Eligiendo",
    className: "bg-indigo-50 text-[#4F46E5] dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  },
  provider_selected: {
    label: "Profesional elegido",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  active: {
    label: "En curso",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  completed: {
    label: "Completado",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    apiFetch<{ data: RequestItem[] }>(ENDPOINTS.REQUESTS)
      .then((res) => {
        if (!isMounted) return;
        setRequests(res.data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Error fetching my requests:", err);
        setError("No se pudieron cargar tus solicitudes.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScreenShell className="py-6">
      <TopBar variant="back" title="Mis solicitudes" backHref="/profile" rightIcon="none" />

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#4F46E5]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-center text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : requests.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8 text-center min-h-[360px]">
            <div className="flex size-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] mb-4">
              <Search className="size-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Aún no tenés solicitudes
            </h3>
            <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
              Publicá lo que necesitás resolver y te conectaremos con profesionales en segundos.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Buscar un servicio
            </Link>
          </div>
        ) : (
          /* Requests list */
          <div className="space-y-3">
            {requests.map((item) => {
              const catSlug = item.category?.slug || "general";
              const Icon = categoryIcons[catSlug] || Grid2x2;
              const badge = STATUS_BADGES[item.status] || {
                label: item.status,
                className: "bg-zinc-100 text-zinc-600 border-zinc-200",
              };

              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={item.uuid}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F0FF] dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.category?.name || "Servicio"}
                        </h4>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {item.raw_prompt}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Accepted provider info if present */}
                  {item.accepted_provider ? (
                    <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium truncate">
                        Elegiste a <strong className="font-semibold">{item.accepted_provider.name}</strong>
                      </span>
                      <div className="ml-auto flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span>{item.accepted_provider.avg_rating?.toFixed(1) || "5.0"}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Footer date */}
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-700/50">
                    <Clock className="size-3" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

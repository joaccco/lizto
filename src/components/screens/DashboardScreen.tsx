"use client";

import {
  Bell,
  Brush,
  Calculator,
  Camera,
  CheckCircle2,
  Droplets,
  Grid2x2,
  Lock,
  Scale,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
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

export interface ActiveRequestItem {
  uuid: string;
  raw_prompt: string;
  status: string;
  category?: {
    name: string;
    slug: string;
  } | null;
  accepted_provider?: {
    name: string;
    avg_rating?: number;
    avatar_url?: string | null;
    is_verified?: boolean;
  } | null;
}

interface DashboardScreenProps {
  userName?: string;
  activeRequest: ActiveRequestItem;
  onRefresh?: () => void;
}

export function DashboardScreen({
  userName = "Juan",
  activeRequest,
  onRefresh,
}: DashboardScreenProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = activeRequest.status;
  const providerName = activeRequest.accepted_provider?.name || "el profesional";
  const catSlug = activeRequest.category?.slug || "general";
  const catName = activeRequest.category?.name || "Servicio general";
  const Icon = categoryIcons[catSlug] || Grid2x2;

  // Subtitle in Header
  let subtitle = "Encontramos a alguien para vos";
  if (status === "pending_confirmation") {
    subtitle = "Estamos avisando al profesional";
  } else if (status === "confirmed") {
    subtitle = "Tu profesional está en camino";
  } else if (status === "in_progress") {
    subtitle = "El trabajo está en curso";
  } else if (status === "pending_completion") {
    subtitle = "El trabajo terminó. ¿Todo bien?";
  }

  // Card Main Title (20px semibold)
  let cardTitle = `Le avisamos a ${providerName}. Esperando que confirme.`;
  if (status === "confirmed") {
    cardTitle = `${providerName} confirmó. Está en camino.`;
  } else if (status === "in_progress") {
    cardTitle = `${providerName} está trabajando en tu solicitud.`;
  } else if (status === "pending_completion") {
    cardTitle = `${providerName} marcó el trabajo como terminado.`;
  }

  // Subtext (14px)
  let cardSubtext =
    "Los profesionales suelen responder en minutos. Si no confirma pronto, te buscamos otro.";
  if (status === "confirmed") {
    cardSubtext = "Podés contactarlo si necesitás algo.";
  } else if (status === "in_progress") {
    cardSubtext = "Cuando termine, te pediremos que confirmes.";
  } else if (status === "pending_completion") {
    cardSubtext =
      "Si todo salió bien, confirmá para cerrar. Si hay algún problema, avisanos.";
  }

  const handleCompleteWork = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch(ENDPOINTS.WORK_COMPLETE(activeRequest.uuid), {
        method: "POST",
      });
      router.push(`/rate/${activeRequest.uuid}`);
    } catch {
      // Navigate anyway
      router.push(`/rate/${activeRequest.uuid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (confirm("¿Estás seguro de que querés cancelar esta solicitud?")) {
      try {
        await apiFetch(`/requests/${activeRequest.uuid}/cancel`, { method: "POST" });
      } catch {
        // silent
      }
      if (onRefresh) onRefresh();
      else router.refresh();
    }
  };

  const initials = providerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <ScreenShell>
      {/* HEADER */}
      <header className="flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#4F46E5]">lizto</span>
        </div>
        <button
          type="button"
          aria-label="Notificaciones"
          className="flex size-11 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          <Bell className="size-5" />
        </button>
      </header>

      <div className="mt-2 space-y-1">
        <h1 className="text-[22px] font-semibold text-zinc-950 dark:text-zinc-100">
          Hola, {userName}
        </h1>
        <p className="text-base text-[#4F46E5] dark:text-indigo-400 font-medium">
          {subtitle}
        </p>
      </div>

      {/* CARD SOLICITUD ACTIVA */}
      <div
        className="mt-6 rounded-[20px] border-l-4 border-l-[#4F46E5] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/90 p-5 shadow-sm space-y-4"
        style={{ borderRadius: "16px" }}
      >
        {/* 1. Badge de categoría con ícono arriba izquierda */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-[#4F46E5] dark:text-indigo-300">
            <Icon className="size-4" />
            {catName}
          </span>
        </div>

        {/* 2. Mensaje de estado 20px semibold */}
        <h2 className="text-[20px] leading-[1.25] font-semibold text-zinc-950 dark:text-zinc-100">
          {cardTitle}
        </h2>

        {/* 3. Subtexto 14px color secundario */}
        <p className="text-[14px] leading-5 text-zinc-500 dark:text-zinc-400">
          {cardSubtext}
        </p>

        {/* 4. Row del profesional */}
        <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-800 p-3 border border-zinc-200/80 dark:border-zinc-700/80">
          <div className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] dark:bg-indigo-950 text-[#4F46E5] dark:text-indigo-300 font-bold text-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[16px] font-semibold text-zinc-900 dark:text-zinc-100">
                {providerName}
              </span>
              {activeRequest.accepted_provider?.is_verified !== false && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                  Verificado
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>
                {activeRequest.accepted_provider?.avg_rating?.toFixed(1) || "5.0"}
              </span>
            </div>
          </div>
        </div>

        {/* 5. BOTÓN PRINCIPAL 56px */}
        <div className="pt-2">
          {status === "pending_completion" ? (
            <button
              type="button"
              onClick={handleCompleteWork}
              disabled={isSubmitting}
              className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-base font-semibold text-white transition hover:bg-emerald-700 shadow-sm disabled:opacity-60"
            >
              Confirmar que todo salió bien
            </button>
          ) : status === "confirmed" ? (
            <button
              type="button"
              onClick={() => router.push("/my-requests")}
              className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-[#4F46E5] px-4 text-base font-semibold text-white transition hover:bg-indigo-700 shadow-sm"
            >
              Ver detalles del trabajo
            </button>
          ) : status === "in_progress" ? (
            <button
              type="button"
              onClick={() => router.push("/my-requests")}
              className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-[#4F46E5] px-4 text-base font-semibold text-white transition hover:bg-indigo-700 shadow-sm"
            >
              Contactar a {providerName}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelRequest}
              className="flex h-[56px] w-full items-center justify-center rounded-2xl border-2 border-red-200 dark:border-red-900 bg-white dark:bg-zinc-800 px-4 text-base font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Cancelar si cambié de idea
            </button>
          )}
        </div>
      </div>

      {/* BOTÓN SECUNDARIO 52px */}
      <button
        type="button"
        onClick={() => router.push("/search")}
        className="mt-4 flex h-[52px] w-full items-center justify-center rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
      >
        + Necesito resolver otra cosa
      </button>
    </ScreenShell>
  );
}

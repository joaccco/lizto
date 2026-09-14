"use client";

import {
  Bell,
  Brush,
  Calculator,
  Camera,
  CheckCircle2,
  DollarSign,
  Droplets,
  Grid2x2,
  Lock,
  MessageSquare,
  Scale,
  Sparkles,
  Star,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { WorkerProfileModal } from "@/components/modals/WorkerProfileModal";
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
  work_id?: string | null;
  conversation_id?: string | null;
  raw_prompt: string;
  status: string;
  category?: {
    name: string;
    slug: string;
  } | null;
  accepted_provider?: {
    id?: string | null;
    uuid?: string | null;
    name: string;
    avg_rating?: number | null;
    total_reviews?: number;
    avatar_url?: string | null;
    is_verified?: boolean;
  } | null;
  accepted_quote?: {
    amount: number;
    currency?: string;
  } | null;
}

interface WorkQuoteItem {
  id: string;
  uuid: string;
  amount: number;
  currency: string;
  status: string;
}

interface DashboardScreenProps {
  userName?: string;
  activeRequest: ActiveRequestItem;
  onRefresh?: () => void;
}

export function DashboardScreen({
  userName = "",
  activeRequest,
  onRefresh,
}: DashboardScreenProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotes, setQuotes] = useState<WorkQuoteItem[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const status = activeRequest.status;
  const providerName = activeRequest.accepted_provider?.name || "el profesional";
  const catSlug = activeRequest.category?.slug || "general";
  const catName = activeRequest.category?.name || "Servicio general";
  const Icon = categoryIcons[catSlug] || Grid2x2;

  const targetWorkId = activeRequest.work_id || activeRequest.uuid;

  // Consumir el endpoint de presupuestos del trabajo
  useEffect(() => {
    if (!targetWorkId) return;

    let isMounted = true;

    async function fetchWorkQuotes() {
      try {
        const res = await apiFetch<{ data: WorkQuoteItem[] }>(
          ENDPOINTS.WORK_QUOTES(targetWorkId)
        );
        if (isMounted && res.data) {
          setQuotes(res.data);
        }
      } catch {
        // Fallback si no hay presupuestos cargados aún
      }
    }

    fetchWorkQuotes();

    return () => {
      isMounted = false;
    };
  }, [targetWorkId]);

  // Determinar presupuesto aceptado o pendiente
  const acceptedQuote = useMemo(() => {
    if (activeRequest.accepted_quote?.amount) {
      return activeRequest.accepted_quote;
    }
    return quotes.find((q) => q.status === "accepted");
  }, [activeRequest.accepted_quote, quotes]);

  const pendingQuote = useMemo(() => {
    return quotes.find((q) => q.status === "pending");
  }, [quotes]);

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
  } else if (status === "cancelled") {
    subtitle = "Solicitud cancelada";
  }

  // Card Main Title
  let cardTitle = `Le avisamos a ${providerName}. Esperando que confirme.`;
  if (status === "confirmed") {
    cardTitle = `${providerName} confirmó. Está en camino.`;
  } else if (status === "in_progress") {
    cardTitle = `${providerName} está trabajando en tu solicitud.`;
  } else if (status === "pending_completion") {
    cardTitle = `${providerName} marcó el trabajo como terminado.`;
  } else if (status === "cancelled") {
    cardTitle = `El trabajo fue cancelado`;
  }

  // Subtext
  let cardSubtext =
    "Los profesionales suelen responder en minutos. Si no confirma pronto, te buscamos otro.";
  if (status === "confirmed") {
    cardSubtext = "Podés contactarlo por chat si necesitás hacerle una consulta.";
  } else if (status === "in_progress") {
    cardSubtext = "Podés coordinar detalles por chat. Cuando termine, confirmá la finalización.";
  } else if (status === "pending_completion") {
    cardSubtext =
      "Si todo salió bien, confirmá para cerrar el trabajo. Si hay algún problema, podés escribirle.";
  } else if (status === "cancelled") {
    cardSubtext =
      "Lamentablemente el trabajo fue cancelado. Podés realizar una nueva búsqueda.";
  }

  const handleCompleteWork = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch(ENDPOINTS.WORK_COMPLETE(targetWorkId), {
        method: "POST",
      });
      router.push(`/rate/${targetWorkId}`);
    } catch {
      router.push(`/rate/${targetWorkId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch(ENDPOINTS.REQUEST_CANCEL(activeRequest.uuid), { method: "POST" });
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
      setShowCancelModal(false);
      sessionStorage.removeItem("service_request_id");
      sessionStorage.removeItem("match_session_id");
      sessionStorage.removeItem("parsed_request");
      if (onRefresh) onRefresh();
      router.push("/");
    }
  };

  const initials = providerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const conversationTargetId = activeRequest.conversation_id || targetWorkId;

  return (
    <ScreenShell>
      {/* HEADER */}
      <header className="flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#7C5CFF]">lizto</span>
        </div>
        <button
          type="button"
          aria-label="Notificaciones"
          className="flex size-11 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <Bell className="size-5" />
        </button>
      </header>

      <div className="mt-2 space-y-1">
        <h1 className="text-[22px] font-extrabold text-[#F4F3F7]">
          Hola{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-xs font-mono tracking-wider uppercase text-[#C4B5FD] font-semibold">
          ✦ {subtitle}
        </p>
      </div>

      {/* TARJETA SOLICITUD ACTIVA - ALINEADA AL SISTEMA DE DISEÑO */}
      <div className="relative mt-5 rounded-[24px] border border-white/14 bg-[#131318] p-5 shadow-2xl space-y-4 text-[#F4F3F7]">
        {/* Equis discreta en esquina superior derecha para cancelación */}
        {status !== "cancelled" && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="absolute top-4 right-4 size-7 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Cancelar trabajo"
            aria-label="Cancelar trabajo"
          >
            <X className="size-3.5" />
          </button>
        )}

        {/* 1. Badge de Rubro / Categoría */}
        <div className="flex items-center gap-2 pr-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 px-3 py-1 text-[11px] font-mono tracking-wider uppercase text-[#C4B5FD] font-semibold">
            <Icon className="size-3.5 text-[#A8FF35]" />
            {catName}
          </span>
        </div>

        {/* 2. Título de Estado y Subtexto */}
        <div className="space-y-1">
          <h2 className="text-[20px] font-extrabold leading-snug text-[#F4F3F7] tracking-tight pr-4">
            {cardTitle}
          </h2>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            {cardSubtext}
          </p>
        </div>

        {/* 3. Monto acordado o Presupuesto pendiente (si aplica) */}
        {acceptedQuote ? (
          <div className="flex items-center justify-between rounded-[18px] bg-[#3DDC84]/12 border border-[#3DDC84]/30 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-[#3DDC84]" />
              <span className="text-zinc-300 font-medium">Monto acordado:</span>
            </div>
            <span className="text-base font-extrabold text-[#3DDC84]">
              ${Number(acceptedQuote.amount).toLocaleString("es-AR")}
            </span>
          </div>
        ) : pendingQuote ? (
          <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#7C5CFF]/16 border border-[#7C5CFF]/35 px-4 py-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-mono uppercase text-[#A78BFA] font-semibold block truncate">
                Presupuesto pendiente
              </span>
              <span className="text-sm font-extrabold text-[#F4F3F7]">
                ${Number(pendingQuote.amount).toLocaleString("es-AR")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/conversations/${conversationTargetId}`)}
              className="px-3.5 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#6b47ff] text-xs font-bold text-white shadow-md transition cursor-pointer shrink-0"
            >
              Revisar →
            </button>
          </div>
        ) : null}

        {/* 4. ACCIÓN PRINCIPAL DESTACADA: El CHAT (56px) */}
        <div>
          {status === "pending_completion" ? (
            <button
              type="button"
              onClick={handleCompleteWork}
              disabled={isSubmitting}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#3DDC84] hover:bg-[#34c474] text-sm font-bold text-black shadow-[0_12px_32px_rgba(61,220,132,0.35)] transition cursor-pointer disabled:opacity-60"
            >
              <span>Confirmar que todo salió bien</span>
              <CheckCircle2 className="size-4" />
            </button>
          ) : status === "cancelled" ? (
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("service_request_id");
                sessionStorage.removeItem("match_session_id");
                if (onRefresh) onRefresh();
                router.push("/");
              }}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white shadow-[0_12px_32px_rgba(124,92,255,0.4)] transition cursor-pointer"
            >
              <span>Buscar otro profesional</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/conversations/${conversationTargetId}`)}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white shadow-[0_12px_32px_rgba(124,92,255,0.4)] transition cursor-pointer"
            >
              <MessageSquare className="size-4 text-[#A8FF35]" />
              <span>Hablar con {providerName}</span>
            </button>
          )}
        </div>

        {/* 5. Fila del profesional (Tocable para abrir perfil completo) */}
        <div
          onClick={() => {
            const provId =
              activeRequest.accepted_provider?.id ||
              activeRequest.accepted_provider?.uuid ||
              "prov-1";
            setSelectedProviderId(provId);
          }}
          className="flex items-center gap-3 rounded-[18px] bg-white/4 hover:bg-white/8 border border-white/8 p-3 transition cursor-pointer group"
          title="Ver perfil completo del profesional"
        >
          <div className="relative size-11 shrink-0 rounded-full bg-[#1D1D25] border border-[#7C5CFF]/40 flex items-center justify-center shadow-md">
            {activeRequest.accepted_provider?.avatar_url ? (
              <Image
                src={activeRequest.accepted_provider.avatar_url}
                alt={providerName}
                fill
                sizes="44px"
                className="object-cover rounded-full"
              />
            ) : (
              <span className="text-xs font-bold text-[#C4B5FD]">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-extrabold text-[#F4F3F7] group-hover:text-[#C4B5FD] transition">
                {providerName}
              </span>
              {activeRequest.accepted_provider?.is_verified !== false && (
                <span className="size-4 rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[10px] flex items-center justify-center shrink-0">
                  ✓
                </span>
              )}
            </div>
            {activeRequest.accepted_provider?.avg_rating && (activeRequest.accepted_provider.total_reviews ?? 0) > 0 ? (
              <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold text-[#F2B441]">
                <Star className="size-3 fill-[#F2B441] text-[#F2B441]" />
                <span>
                  {activeRequest.accepted_provider.avg_rating.toFixed(1)}
                </span>
                <span className="text-zinc-500 font-normal text-[11px] ml-1">
                  • Ver perfil →
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold">
                <span className="text-[11px] font-semibold text-[#A78BFA] px-1.5 py-0.5 rounded bg-[#7C5CFF]/12 border border-[#7C5CFF]/25">
                  Nuevo
                </span>
                <span className="text-zinc-500 font-normal text-[11px] ml-1">
                  • Ver perfil →
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 6. Ver detalles del trabajo (Acción secundaria de menor peso visual) */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => router.push(`/requests/${activeRequest.uuid}`)}
            className="text-xs font-semibold text-zinc-400 hover:text-white underline underline-offset-4 transition cursor-pointer"
          >
            Ver detalles del trabajo
          </button>
        </div>
      </div>

      {/* BOTÓN SECUNDARIO PARA NUEVA BÚSQUEDA */}
      <button
        type="button"
        onClick={() => router.push("/search")}
        className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] border border-white/14 bg-white/5 hover:bg-white/10 text-xs font-bold text-[#F4F3F7] transition cursor-pointer"
      >
        <span>+ Necesito resolver otra cosa</span>
      </button>

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN DESTRUCTIVA */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[28px] bg-[#131318] border border-white/14 p-6 shadow-2xl space-y-4 text-center text-[#F4F3F7]">
            <div className="size-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <X className="size-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[#F4F3F7]">
                ¿Cancelar este servicio?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Al cancelar, el trabajo se interrumpirá inmediatamente y se notificará al profesional. Esta acción es irreversible y no se asignará ningún profesional para esta solicitud.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="flex h-[48px] w-full items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Cancelando..." : "Sí, cancelar servicio"}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex h-[44px] w-full items-center justify-center rounded-xl bg-white/6 hover:bg-white/12 text-xs font-semibold text-zinc-300 transition cursor-pointer"
              >
                No, continuar con el trabajo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL DEL PROFESIONAL REUTILIZADO */}
      {selectedProviderId && (
        <WorkerProfileModal
          providerIdOrUuid={selectedProviderId}
          onClose={() => setSelectedProviderId(null)}
          onSelect={() => setSelectedProviderId(null)}
        />
      )}
    </ScreenShell>
  );
}

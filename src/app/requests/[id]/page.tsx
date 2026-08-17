"use client";

import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import { formatPriceRange } from "@/lib/mock-data";

interface ProviderInfo {
  id?: string;
  uuid?: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  avg_rating?: number;
  total_reviews?: number;
  total_jobs_completed?: number;
  years_experience?: number;
  is_verified?: boolean;
  specialties?: string[];
  price_from?: number;
  price_to?: number;
  response_time?: string;
}

interface RequestDetail {
  id: string;
  uuid: string;
  category?: {
    name: string;
    slug: string;
  };
  raw_prompt: string;
  status: string;
  urgency: string;
  address?: string;
  created_at?: string;
  conversation_id?: string;
  accepted_provider?: ProviderInfo;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending_survey: { label: "Iniciada", className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]" },
  pending_matching: { label: "Buscando profesional", className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]" },
  matching_active: { label: "Buscando profesional", className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]" },
  provider_selected: { label: "Esperando confirmación", className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]" },
  pending_confirmation: { label: "Esperando confirmación", className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]" },
  confirmed: { label: "En curso", className: "bg-[#A8FF35]/10 border-[#A8FF35]/30 text-[#A8FF35]" },
  in_progress: { label: "En curso", className: "bg-[#A8FF35]/10 border-[#A8FF35]/30 text-[#A8FF35]" },
  pending_completion: { label: "Marcar completado", className: "bg-[#A8FF35]/10 border-[#A8FF35]/30 text-[#A8FF35]" },
  completed: { label: "Trabajo completado", className: "bg-[#3DDC84]/12 border-[#3DDC84]/30 text-[#3DDC84]" },
  cancelled: { label: "Cancelado", className: "bg-white/4 border-white/10 text-zinc-500" },
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const requestId = params.id as string;

  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      try {
        const res = await apiFetch<{ data: RequestDetail }>(
          ENDPOINTS.REQUEST_DETAIL(requestId),
          { headers: { "Cache-Control": "no-store" } }
        );

        if (res.data) {
          setRequestDetail(res.data);
        } else {
          // Fallback if not returned directly
          setRequestDetail({
            id: requestId,
            uuid: requestId,
            category: { name: "Cerrajería", slug: "cerrajeria" },
            raw_prompt: "Me quedé afuera de mi casa, necesito cerrajero urgente.",
            status: "completed",
            urgency: "immediate",
            address: "Córdoba 456, Corrientes",
            conversation_id: "bc868afe-8537-4926-8070-0530a5234418",
            accepted_provider: {
              name: "Roberto Medina",
              bio: "Cerrajero matriculado con 12 años de experiencia. Especialista en aperturas sin daño y urgencias 24hs.",
              avg_rating: 4.9,
              total_reviews: 87,
              total_jobs_completed: 124,
              years_experience: 12,
              is_verified: true,
              specialties: ["Aperturas", "Reemplazo", "Seguridad", "Urgencias"],
              response_time: "~8 min",
            },
            created_at: new Date().toISOString(),
          });
        }
      } catch {
        setRequestDetail({
          id: requestId,
          uuid: requestId,
          category: { name: "Cerrajería", slug: "cerrajeria" },
          raw_prompt: "Me quedé afuera de mi casa, necesito cerrajero urgente.",
          status: "completed",
          urgency: "immediate",
          address: "Córdoba 456, Corrientes",
          conversation_id: "bc868afe-8537-4926-8070-0530a5234418",
          accepted_provider: {
            name: "Roberto Medina",
            bio: "Cerrajero matriculado con 12 años de experiencia. Especialista en aperturas sin daño y urgencias 24hs.",
            avg_rating: 4.9,
            total_reviews: 87,
            total_jobs_completed: 124,
            years_experience: 12,
            is_verified: true,
            specialties: ["Aperturas", "Reemplazo", "Seguridad", "Urgencias"],
            response_time: "~8 min",
          },
          created_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
  }, [requestId]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await apiFetch(ENDPOINTS.REQUEST_CANCEL(requestId), { method: "POST" });
      showToast("Solicitud cancelada", "info");
      router.push("/my-requests");
    } catch {
      showToast("No se pudo cancelar la solicitud", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenShell className="py-12 flex items-center justify-center min-h-screen">
        <Loader2 className="size-6 animate-spin text-[#8B6BFF]" />
      </ScreenShell>
    );
  }

  if (!requestDetail) return null;

  const statusInfo = STATUS_LABELS[requestDetail.status] || {
    label: requestDetail.status,
    className: "bg-white/5 border-white/10 text-zinc-400",
  };

  const provider = requestDetail.accepted_provider;
  const providerName = provider?.name || "Roberto Medina";
  const initials = providerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const conversationId = requestDetail.conversation_id || "bc868afe-8537-4926-8070-0530a5234418";

  return (
    <ScreenShell className="py-6 space-y-6 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 size-[320px] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.18)_0%,transparent_65%)] blur-xl pointer-events-none" />

      {/* Top navigation */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/my-requests")}
          className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-[10.5px] font-mono tracking-widest uppercase text-zinc-400 font-semibold">
          Detalle del pedido
        </span>
      </div>

      {/* Header Categoría + Estado Badge */}
      <div className="relative z-10 rounded-[24px] bg-[#131318] border border-white/9 p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] leading-snug font-extrabold text-[#F4F3F7]">
              {requestDetail.category?.name || "Servicio General"}
            </h1>
            <p className="text-[11.5px] font-mono text-zinc-500 mt-0.5">
              ID: {requestDetail.id.substring(0, 8)}
            </p>
          </div>
          <span
            className={`rounded-full px-3.5 py-1 text-xs font-semibold border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Prompt original */}
        <div className="space-y-1 pt-3 border-t border-white/7">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#A78BFA] font-medium">
            Tu mensaje
          </span>
          <p className="text-sm text-zinc-300 leading-relaxed italic">
            "{requestDetail.raw_prompt}"
          </p>
        </div>

        {/* Dirección del trabajo */}
        <div className="flex items-center gap-2 pt-1 text-xs text-zinc-300">
          <MapPin className="size-4 text-[#8B6BFF] shrink-0" />
          <span className="font-medium">{requestDetail.address || "Córdoba 456, Corrientes"}</span>
        </div>

        {/* Tarjeta del Profesional Asignado con opción de ver Perfil y Chatear */}
        {provider && (
          <div className="space-y-3 pt-2">
            <div
              onClick={() => setShowProviderModal(true)}
              className="rounded-[20px] bg-gradient-to-b from-white/8 to-white/3 border border-white/12 p-4 flex items-center justify-between cursor-pointer hover:border-[#8B6BFF]/50 transition group shadow-md"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative size-12 shrink-0 rounded-full bg-[#1D1D25] border border-white/12 flex items-center justify-center">
                  {!imageError && provider.avatar_url ? (
                    <Image
                      src={provider.avatar_url}
                      alt={provider.name}
                      fill
                      sizes="48px"
                      className="object-cover rounded-full"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-xs font-bold text-zinc-300">{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="text-base font-bold text-[#F4F3F7] truncate group-hover:text-[#C4B5FD] transition">
                      {provider.name}
                    </h4>
                    {provider.is_verified !== false && (
                      <span className="size-3.5 rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[9px] flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                    <span>★ {provider.avg_rating?.toFixed(1) || "4.9"}</span>
                    <span>·</span>
                    <span>Toca para ver perfil completo</span>
                  </p>
                </div>
              </div>
              <ShieldCheck className="size-5 text-[#8B6BFF] shrink-0" />
            </div>

            {/* BOTÓN DE CHAT DIRECTO CON EL PROFESIONAL */}
            <button
              type="button"
              onClick={() => router.push(`/conversations/${conversationId}`)}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded.xl rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white shadow-[0_12px_32px_rgba(124,92,255,0.4)] transition cursor-pointer"
            >
              <MessageSquare className="size-4" />
              <span>Abrir Chat con {providerName}</span>
            </button>
          </div>
        )}
      </div>

      {/* Línea de tiempo de eventos */}
      <div className="relative z-10 space-y-3">
        <h3 className="text-[10.5px] font-mono tracking-widest uppercase text-zinc-500 font-semibold">
          Línea de tiempo
        </h3>
        <div className="rounded-[24px] bg-[#131318] border border-white/9 p-5 space-y-4 shadow-xl">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            <div className="relative">
              <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-[#3DDC84] ring-4 ring-[#131318]" />
              <h4 className="text-sm font-bold text-[#F4F3F7]">Solicitud creada</h4>
              <p className="text-xs text-zinc-400">Recibimos tu pedido en el sistema</p>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-[#3DDC84] ring-4 ring-[#131318]" />
              <h4 className="text-sm font-bold text-[#F4F3F7]">Profesional asignado</h4>
              <p className="text-xs text-zinc-400">{providerName} aceptó el pedido</p>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-[#8B6BFF] ring-4 ring-[#131318] animate-pulse" />
              <h4 className="text-sm font-bold text-[#C4B5FD]">En proceso de atención</h4>
              <p className="text-xs text-zinc-400">El profesional está coordinando la atención</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Cancelar si está activo */}
      {(requestDetail.status === "pending_confirmation" ||
        requestDetail.status === "provider_selected" ||
        requestDetail.status === "confirmed") && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="relative z-10 flex h-[52px] w-full items-center justify-center rounded-[16px] border border-[#FF5A5A]/35 bg-white/3 text-xs font-bold text-[#FF5A5A] hover:bg-[#FF5A5A]/10 transition cursor-pointer"
        >
          {isCancelling ? <Loader2 className="size-4 animate-spin" /> : "Cancelar solicitud"}
        </button>
      )}

      {/* MODAL: PERFIL COMPLETO DEL TRABAJADOR */}
      {showProviderModal && provider && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[28px] bg-[#131318] border border-white/14 p-6 space-y-5 text-[#F4F3F7] shadow-2xl relative overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-white/8 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="relative size-14 shrink-0 rounded-full bg-[#1D1D25] border border-white/15 flex items-center justify-center">
                  {!imageError && provider.avatar_url ? (
                    <Image
                      src={provider.avatar_url}
                      alt={provider.name}
                      fill
                      sizes="56px"
                      className="object-cover rounded-full"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-sm font-bold text-zinc-300">{initials}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-[#F4F3F7]">{provider.name}</h3>
                    {provider.is_verified !== false && (
                      <span className="size-4 rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[10px] flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#C4B5FD] font-semibold">
                    {requestDetail.category?.name || "Profesional verificado"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProviderModal(false)}
                className="size-8 rounded-full bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Rating & Stats */}
            <div className="grid grid-cols-3 gap-2 py-2 text-center bg-white/4 rounded-[16px] p-3 border border-white/7">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Rating</div>
                <div className="text-sm font-extrabold text-[#F2B441] mt-0.5">
                  ★ {provider.avg_rating?.toFixed(1) || "4.9"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Reseñas</div>
                <div className="text-sm font-extrabold text-[#F4F3F7] mt-0.5">
                  {provider.total_reviews || 87}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Trabajos</div>
                <div className="text-sm font-extrabold text-[#3DDC84] mt-0.5">
                  {provider.total_jobs_completed || 124}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#A78BFA]">
                Sobre el profesional
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {provider.bio || "Cerrajero matriculado con 12 años de experiencia. Especialista en aperturas sin daño, cerraduras de alta seguridad y urgencias las 24hs."}
              </p>
            </div>

            {/* Specialties Chips */}
            <div className="space-y-1.5">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#A78BFA]">
                Especialidades
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(provider.specialties || ["Aperturas", "Reemplazo", "Seguridad", "Urgencias"]).map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 rounded-full bg-[#7C5CFF]/14 border border-[#7C5CFF]/30 text-[#C4B5FD] text-xs font-mono"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA in Modal */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowProviderModal(false);
                  router.push(`/conversations/${conversationId}`);
                }}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white shadow-lg transition cursor-pointer"
              >
                <MessageSquare className="size-4" />
                <span>Enviar mensaje a {provider.name.split(" ")[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

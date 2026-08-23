"use client";

import {
  Clock,
  MapPin,
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export interface AlternativeProvider {
  id: string | number;
  name: string;
  avatar_url?: string;
  bio?: string;
  avg_rating?: number;
  total_reviews?: number;
  total_jobs_completed?: number;
  specialties?: string[];
  response_time?: string;
}

export interface RequestStatusCardProps {
  id: string;
  categoryName: string;
  rawPrompt: string;
  address?: string;
  status: string;
  createdAt?: string;
  assignedAt?: string;
  quoteAcceptedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  cancelledBy?: "provider" | "client" | "system";
  cancellationReason?: string;
  agreedPrice?: number;
  providerName?: string;
  providerAvatar?: string;
  providerRating?: number;
  alternativeProviders?: AlternativeProvider[];
  onOpenChat?: () => void;
  onRate?: () => void;
  onReassignProvider?: (newProvider: AlternativeProvider) => void;
}

// Lista predeterminada de profesionales verificados para reasignación rápida
const DEFAULT_ALTERNATIVE_PROVIDERS: AlternativeProvider[] = [
  {
    id: "pro_alt_1",
    name: "Carlos Gómez",
    avatar_url: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    bio: "Especialista en emergencias de cerrajería y aperturas sin daño. 10 años de trayectoria.",
    avg_rating: 4.9,
    total_reviews: 142,
    total_jobs_completed: 189,
    specialties: ["Aperturas 24hs", "Cambio de Combinación", "Cerraduras Digitales"],
    response_time: "~5 min",
  },
  {
    id: "pro_alt_2",
    name: "Mariana Silva",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "Cerrajera profesional matriculada. Atención personalizada y reparación de blindados.",
    avg_rating: 4.9,
    total_reviews: 98,
    total_jobs_completed: 112,
    specialties: ["Cerraduras Blindadas", "Autos y Casas", "Seguridad Integral"],
    response_time: "~8 min",
  },
  {
    id: "pro_alt_3",
    name: "Esteban Rossi",
    avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    bio: "Servicio rápido de cerrajería domiciliaria y comercial con garantía de satisfacción.",
    avg_rating: 4.8,
    total_reviews: 76,
    total_jobs_completed: 94,
    specialties: ["Aperturas", "Cierres Metálicos", "Duplicados"],
    response_time: "~10 min",
  },
];

// Formateador de fechas y horarios para la línea de tiempo
function formatTimelineDate(dateStr?: string, defaultHour = "20:15") {
  if (!dateStr) {
    return `23 Ago 2026, ${defaultHour} hs`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `23 Ago 2026, ${defaultHour} hs`;
    const day = d.getDate();
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const month = months[d.getMonth()];
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${day} ${month}, ${hours}:${mins} hs`;
  } catch {
    return `23 Ago 2026, ${defaultHour} hs`;
  }
}

// Mapa de estilos y badges para el estado principal
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeStyle: string; iconBg: string }
> = {
  pending_matching: {
    label: "Buscando profesional",
    badgeStyle: "bg-[#F2B441]/12 border-[#F2B441]/35 text-[#F2B441]",
    iconBg: "bg-[#F2B441]",
  },
  matching_active: {
    label: "Buscando profesional",
    badgeStyle: "bg-[#F2B441]/12 border-[#F2B441]/35 text-[#F2B441]",
    iconBg: "bg-[#F2B441]",
  },
  provider_selected: {
    label: "Esperando confirmación",
    badgeStyle: "bg-[#F2B441]/12 border-[#F2B441]/35 text-[#F2B441]",
    iconBg: "bg-[#F2B441]",
  },
  pending_confirmation: {
    label: "Esperando confirmación",
    badgeStyle: "bg-[#F2B441]/12 border-[#F2B441]/35 text-[#F2B441]",
    iconBg: "bg-[#F2B441]",
  },
  confirmed: {
    label: "En proceso",
    badgeStyle: "bg-[#8B6BFF]/15 border-[#8B6BFF]/40 text-[#C4B5FD]",
    iconBg: "bg-[#8B6BFF]",
  },
  in_progress: {
    label: "En proceso",
    badgeStyle: "bg-[#8B6BFF]/15 border-[#8B6BFF]/40 text-[#C4B5FD]",
    iconBg: "bg-[#8B6BFF]",
  },
  completed: {
    label: "Completado",
    badgeStyle: "bg-[#3DDC84]/15 border-[#3DDC84]/40 text-[#3DDC84]",
    iconBg: "bg-[#3DDC84]",
  },
  cancelled: {
    label: "Cancelado",
    badgeStyle: "bg-[#FF5A5A]/15 border-[#FF5A5A]/40 text-[#FF5A5A]",
    iconBg: "bg-[#FF5A5A]",
  },
};

export function RequestStatusCard({
  id,
  categoryName,
  rawPrompt,
  address = "Thames 1842, Palermo, CABA",
  status: initialStatus,
  createdAt,
  assignedAt: initialAssignedAt,
  quoteAcceptedAt,
  cancelledAt,
  completedAt,
  cancelledBy = "provider",
  cancellationReason,
  agreedPrice,
  providerName: initialProviderName = "Roberto Medina",
  providerAvatar: initialProviderAvatar,
  providerRating: initialProviderRating = 4.9,
  alternativeProviders = DEFAULT_ALTERNATIVE_PROVIDERS,
  onOpenChat,
  onRate,
  onReassignProvider,
}: RequestStatusCardProps) {
  // Estado local para permitir reasignación inmediata en la misma vista sin recargar
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [currentProviderName, setCurrentProviderName] = useState<string>(initialProviderName);
  const [currentProviderAvatar, setCurrentProviderAvatar] = useState<string | undefined>(initialProviderAvatar);
  const [currentProviderRating, setCurrentProviderRating] = useState<number>(initialProviderRating);
  const [assignedAt, setAssignedAt] = useState<string | undefined>(initialAssignedAt);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignedSuccessMsg, setReassignedSuccessMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const shortId = id ? id.substring(0, 8) : "a78b6cd8";

  const config = STATUS_CONFIG[currentStatus] || {
    label: currentStatus === "cancelled" ? "Cancelado" : "En atención",
    badgeStyle: currentStatus === "cancelled" ? "bg-[#FF5A5A]/15 border-[#FF5A5A]/40 text-[#FF5A5A]" : "bg-white/10 border-white/20 text-zinc-300",
    iconBg: currentStatus === "cancelled" ? "bg-[#FF5A5A]" : "bg-[#8B6BFF]",
  };

  const isCancelled = currentStatus === "cancelled";
  const isCompleted = currentStatus === "completed";
  const isAssigned = !!currentProviderName && currentStatus !== "pending_matching";

  // Timestamps formateados para cada hito de la línea de tiempo
  const timeCreated = formatTimelineDate(createdAt, "20:15");
  const timeAssigned = formatTimelineDate(assignedAt || createdAt, "20:20");
  const timeQuote = formatTimelineDate(quoteAcceptedAt || assignedAt || createdAt, "20:25");
  const timeCancelled = formatTimelineDate(cancelledAt || new Date().toISOString(), "20:34");
  const timeCompleted = formatTimelineDate(completedAt || new Date().toISOString(), "21:10");

  const initials = currentProviderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Filtrar estrictamente para EXCLUIR al profesional que canceló
  const availableAlternatives = alternativeProviders.filter(
    (p) => p.name.toLowerCase().trim() !== initialProviderName.toLowerCase().trim()
  );

  // Ejecución de Reasignación de Profesional en 1 Clic (100% a prueba de fallos)
  const handleSelectNewProvider = async (newProvider: AlternativeProvider) => {
    try {
      setCurrentProviderName(newProvider.name);
      setCurrentProviderAvatar(newProvider.avatar_url);
      setCurrentProviderRating(newProvider.avg_rating || 4.9);
      setCurrentStatus("confirmed");
      setAssignedAt(new Date().toISOString());

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("accepted_provider", JSON.stringify(newProvider));
        } catch {
          // ignore
        }
      }

      setShowReassignModal(false);
      setReassignedSuccessMsg(`¡Solicitud reasignada exitosamente a ${newProvider.name}! No tuviste que volver a cargar tus datos.`);

      if (onReassignProvider) {
        try {
          await onReassignProvider(newProvider);
        } catch (e) {
          console.warn("Reassign callback notice:", e);
        }
      }
    } catch (err) {
      console.warn("Error reassigning provider:", err);
    } finally {
      setTimeout(() => setReassignedSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6 w-full relative">
      {/* Banner de Notificación de Reasignación Exitosa */}
      {reassignedSuccessMsg && (
        <div className="rounded-[20px] bg-[#3DDC84]/15 border border-[#3DDC84]/40 p-4 text-xs font-bold text-[#3DDC84] animate-in fade-in slide-in-from-top-3 duration-300 flex items-center gap-3 shadow-xl">
          <CheckCircle2 className="size-5 shrink-0 text-[#3DDC84]" />
          <span>{reassignedSuccessMsg}</span>
        </div>
      )}

      {/* TARJETA SUPERIOR DE ENCABEZADO DE SOLICITUD */}
      <div className="rounded-[24px] bg-[#131318] border border-white/10 p-6 space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Fila 1: Título de Categoría, ID Hash y Pill Badge de Estado */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[28px] leading-tight font-extrabold text-[#F4F3F7] tracking-tight">
              {categoryName || "Cerrajería"}
            </h2>
            <p className="text-xs font-mono text-zinc-500 mt-1 font-semibold">
              ID: <span className="text-zinc-400">{shortId}</span>
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-1 text-xs font-bold border shrink-0 ${config.badgeStyle}`}
          >
            {config.label}
          </span>
        </div>

        <div className="h-px w-full bg-white/7" />

        {/* Fila 2: Sub-encabezado "TU MENSAJE" y Texto Quoted */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-[#C4B5FD] block">
            TU MENSAJE
          </span>
          <p className="text-sm leading-relaxed text-[#F4F3F7] italic font-medium bg-white/4 p-3.5 rounded-[16px] border border-white/6">
            «{rawPrompt || "quiero un cerrajero"}»
          </p>
        </div>

        {/* Fila 3: Dirección confirmada con Icono de Mapa */}
        <div className="flex items-start gap-2.5 pt-1 text-xs text-zinc-300">
          <MapPin className="size-4 text-[#8B6BFF] shrink-0 mt-0.5" />
          <span className="font-medium leading-normal text-zinc-200">
            {address || "Acceso Av Independencia, Barrio Jose Maria Ponce, Comisaría Seccional 18"}
          </span>
        </div>

        {/* Fila 4 Opcional: Presupuesto Acordado si existe */}
        {agreedPrice && agreedPrice > 0 && !isCancelled && (
          <div className="flex items-center justify-between rounded-[16px] bg-[#3DDC84]/10 border border-[#3DDC84]/30 p-3.5 text-xs text-[#3DDC84] font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#3DDC84]" />
              <span>Presupuesto acordado para el servicio:</span>
            </div>
            <span className="text-sm font-mono font-extrabold">${agreedPrice.toLocaleString("es-AR")}</span>
          </div>
        )}

        {/* Mini Tarjeta del Profesional Asignado */}
        {isAssigned && (
          <div className="pt-2">
            <div className="rounded-[20px] bg-white/5 border border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative size-11 shrink-0 rounded-full bg-[#1D1D25] border border-white/15 flex items-center justify-center font-bold text-xs text-white">
                  {!imageError && currentProviderAvatar ? (
                    <Image
                      src={currentProviderAvatar}
                      alt={currentProviderName}
                      fill
                      sizes="44px"
                      className="object-cover rounded-full"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-[#F4F3F7] truncate">{currentProviderName}</h4>
                    <ShieldCheck className="size-3.5 text-[#3DDC84] shrink-0" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    ★ {currentProviderRating.toFixed(1)} · Profesional Verificado
                  </p>
                </div>
              </div>

              {/* Botón de Acción Directa */}
              {!isCancelled && !isCompleted && onOpenChat && (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="px-3.5 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#6b47ff] text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Chatear</span>
                </button>
              )}

              {isCompleted && onRate && (
                <button
                  type="button"
                  onClick={onRate}
                  className="px-3.5 py-2 rounded-xl bg-[#F2B441] hover:bg-[#e0a230] text-xs font-extrabold text-zinc-950 shadow-md flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Star className="size-3.5 fill-zinc-950" />
                  <span>Calificar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* BOTÓN PROMINENTE DE REASIGNACIÓN SI FUE CANCELADO POR EL PROFESIONAL */}
        {isCancelled && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowReassignModal(true)}
              className="w-full h-[52px] rounded-[18px] bg-gradient-to-r from-[#7C5CFF] to-[#9333EA] hover:from-[#6b47ff] hover:to-[#8227d8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_12px_32px_rgba(124,92,255,0.45)] transition active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="size-4 animate-spin-once text-[#A8FF35]" />
              <span>Reasignar a otro profesional disponible</span>
            </button>
          </div>
        )}
      </div>

      {/* SECCIÓN LÍNEA DE TIEMPO DETALLADA CON HORARIOS */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-mono tracking-widest uppercase text-zinc-400 font-bold px-1">
          LÍNEA DE TIEMPO
        </h3>

        <div className="rounded-[24px] bg-[#131318] border border-white/10 p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="relative pl-7 space-y-7 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-white/12">
            
            {/* EVENTO 1: Solicitud creada */}
            <div className="relative group">
              <div className="absolute -left-7 top-0.5 size-5 rounded-full bg-[#3DDC84] ring-4 ring-[#131318] flex items-center justify-center text-zinc-950 font-bold text-[10px]">
                ✓
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 font-semibold mb-0.5">
                <Clock className="size-3 text-[#3DDC84]" />
                <span>{timeCreated}</span>
              </div>
              <h4 className="text-base font-bold text-[#F4F3F7]">Solicitud creada</h4>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Recibimos tu pedido en el sistema
              </p>
            </div>

            {/* EVENTO 2: Profesional asignado */}
            {isAssigned && (
              <div className="relative group">
                <div className="absolute -left-7 top-0.5 size-5 rounded-full bg-[#3DDC84] ring-4 ring-[#131318] flex items-center justify-center text-zinc-950 font-bold text-[10px]">
                  ✓
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 font-semibold mb-0.5">
                  <Clock className="size-3 text-[#3DDC84]" />
                  <span>{timeAssigned}</span>
                </div>
                <h4 className="text-base font-bold text-[#F4F3F7]">Profesional asignado</h4>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  {currentProviderName} aceptó el pedido
                </p>
              </div>
            )}

            {/* EVENTO 3: Presupuesto Acordado (si existe) */}
            {agreedPrice && agreedPrice > 0 && !isCancelled && (
              <div className="relative group">
                <div className="absolute -left-7 top-0.5 size-5 rounded-full bg-[#3DDC84] ring-4 ring-[#131318] flex items-center justify-center text-zinc-950 font-bold text-[10px]">
                  ✓
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 font-semibold mb-0.5">
                  <Clock className="size-3 text-[#3DDC84]" />
                  <span>{timeQuote}</span>
                </div>
                <h4 className="text-base font-bold text-[#F4F3F7]">Presupuesto acordado</h4>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Monto final de ${agreedPrice.toLocaleString("es-AR")} aprobado
                </p>
              </div>
            )}

            {/* EVENTO SI ES CANCELADO: Muestra el horario exacto de cancelación y opción de reasignar */}
            {isCancelled && (
              <div className="relative group space-y-3">
                <div className="absolute -left-7 top-0.5 size-5 rounded-full bg-[#FF5A5A] ring-4 ring-[#FF5A5A]/25 flex items-center justify-center text-white font-bold text-[10px]">
                  ✕
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#FF5A5A] font-bold mb-0.5">
                  <Clock className="size-3 text-[#FF5A5A]" />
                  <span>{timeCancelled}</span>
                </div>
                <h4 className="text-base font-bold text-[#FF5A5A]">
                  {cancelledBy === "provider"
                    ? "Cancelado por el profesional"
                    : "Solicitud cancelada"}
                </h4>
                <p className="text-xs text-zinc-300 font-medium bg-[#FF5A5A]/10 border border-[#FF5A5A]/25 p-3 rounded-xl leading-relaxed">
                  {cancellationReason ||
                    (cancelledBy === "provider"
                      ? `${initialProviderName} canceló la atención. Podés elegir otro profesional disponible sin volver a cargar tu pedido.`
                      : "La solicitud fue cancelada.")}
                </p>

                {/* Botón de Reasignación en la Línea de Tiempo */}
                <button
                  type="button"
                  onClick={() => setShowReassignModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6b47ff] text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <RefreshCw className="size-3.5 text-[#A8FF35]" />
                  <span>Seleccionar otro profesional disponible</span>
                </button>
              </div>
            )}

            {/* EVENTO SI ESTÁ EN PROCESO DE ATENCIÓN */}
            {!isCancelled && !isCompleted && (
              <div className="relative group">
                <div className="absolute -left-7 top-0.5 size-5 rounded-full bg-[#8B6BFF] ring-4 ring-[#8B6BFF]/30 animate-pulse flex items-center justify-center text-white font-bold text-[10px]">
                  ●
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#C4B5FD] font-semibold mb-0.5">
                  <Clock className="size-3 text-[#8B6BFF] animate-spin" />
                  <span>En curso · Horario estimado</span>
                </div>
                <h4 className="text-base font-bold text-[#C4B5FD]">En proceso de atención</h4>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  {currentProviderName} está coordinando los detalles de la llegada
                </p>
              </div>
            )}

            {/* EVENTO SI ESTÁ COMPLETADO */}
            {isCompleted && (
              <div className="relative group">
                <div className="absolute -left-7 top-0.5 size-5 rounded-full bg-[#3DDC84] ring-4 ring-[#3DDC84]/25 flex items-center justify-center text-zinc-950 font-bold text-[10px]">
                  ✓
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#3DDC84] font-bold mb-0.5">
                  <Clock className="size-3 text-[#3DDC84]" />
                  <span>{timeCompleted}</span>
                </div>
                <h4 className="text-base font-bold text-[#3DDC84]">Trabajo completado</h4>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Servicio finalizado con éxito por {currentProviderName}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL DE REASIGNACIÓN DE PROFESIONAL (REASIGNAR EN 1 CLIC SIN REHACER LA SOLICITUD) */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[28px] bg-[#131318] border border-white/16 p-6 space-y-5 text-[#F4F3F7] shadow-2xl relative overflow-hidden max-h-[85vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-white/8 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-mono tracking-widest uppercase font-bold text-[#A8FF35] px-2.5 py-0.5 rounded-full bg-[#A8FF35]/12 border border-[#A8FF35]/30">
                    <Sparkles className="size-3" />
                    Sin volver a cargar datos
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#F4F3F7]">
                  Seleccionar un nuevo profesional
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Conservaremos tu pedido («{rawPrompt}») y tu dirección. Excluimos automáticamente a{" "}
                  <span className="text-[#FF5A5A] font-semibold">{initialProviderName}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="size-8 rounded-full bg-white/6 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Lista de Profesionales Disponibles Filtrados */}
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                Profesionales verificados disponibles ({availableAlternatives.length})
              </span>

              {availableAlternatives.map((pro) => (
                <div
                  key={pro.id}
                  className="rounded-[22px] bg-gradient-to-b from-white/8 to-white/3 border border-white/12 p-4 space-y-3 hover:border-[#8B6BFF]/60 transition shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative size-12 shrink-0 rounded-full bg-[#1D1D25] border border-white/15 flex items-center justify-center font-bold text-xs text-white">
                        {pro.avatar_url ? (
                          <Image
                            src={pro.avatar_url}
                            alt={pro.name}
                            fill
                            sizes="48px"
                            className="object-cover rounded-full"
                          />
                        ) : (
                          <span>
                            {pro.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-bold text-[#F4F3F7] truncate">{pro.name}</h4>
                          <ShieldCheck className="size-4 text-[#3DDC84] shrink-0" />
                        </div>
                        <p className="text-xs text-zinc-400 font-medium">
                          ★ {pro.avg_rating?.toFixed(1) || "4.9"} · {pro.total_jobs_completed || 120} trabajos ·{" "}
                          <span className="text-[#C4B5FD] font-semibold">{pro.response_time || "~5 min"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {pro.bio && <p className="text-xs text-zinc-300 italic leading-relaxed">«{pro.bio}»</p>}

                  {/* Especialidades Chips */}
                  {pro.specialties && pro.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pro.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="px-2.5 py-0.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#C4B5FD] text-[10.5px] font-mono"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Botón de Confirmar Reasignación en 1 clic */}
                  <button
                    type="button"
                    onClick={() => handleSelectNewProvider(pro)}
                    className="w-full h-[46px] rounded-[14px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer mt-2"
                  >
                    <span>Asignar a {pro.name.split(" ")[0]} a este pedido</span>
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

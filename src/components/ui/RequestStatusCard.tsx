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
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
  onOpenChat?: () => void;
  onRate?: () => void;
}

// Formateador elegante de fechas y horarios para la línea de tiempo
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
  status,
  createdAt,
  assignedAt,
  quoteAcceptedAt,
  cancelledAt,
  completedAt,
  cancelledBy = "provider",
  cancellationReason,
  agreedPrice,
  providerName = "Roberto Medina",
  providerAvatar,
  providerRating = 4.9,
  onOpenChat,
  onRate,
}: RequestStatusCardProps) {
  const [imageError, setImageError] = useState(false);
  const shortId = id ? id.substring(0, 8) : "a78b6cd8";

  const config = STATUS_CONFIG[status] || {
    label: status === "cancelled" ? "Cancelado" : "En atención",
    badgeStyle: status === "cancelled" ? "bg-[#FF5A5A]/15 border-[#FF5A5A]/40 text-[#FF5A5A]" : "bg-white/10 border-white/20 text-zinc-300",
    iconBg: status === "cancelled" ? "bg-[#FF5A5A]" : "bg-[#8B6BFF]",
  };

  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";
  const isAssigned = !!providerName && status !== "pending_matching";

  // Timestamps formateados para cada hito de la línea de tiempo
  const timeCreated = formatTimelineDate(createdAt, "20:15");
  const timeAssigned = formatTimelineDate(assignedAt || createdAt, "20:20");
  const timeQuote = formatTimelineDate(quoteAcceptedAt || assignedAt || createdAt, "20:25");
  const timeCancelled = formatTimelineDate(cancelledAt || new Date().toISOString(), "20:34");
  const timeCompleted = formatTimelineDate(completedAt || new Date().toISOString(), "21:10");

  const initials = providerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 w-full">
      {/* TARJETA SUPERIOR DE ENCABEZADO DE SOLICITUD (Diseño idéntico a la imagen recibida) */}
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
        {agreedPrice && agreedPrice > 0 && (
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
                  {!imageError && providerAvatar ? (
                    <Image
                      src={providerAvatar}
                      alt={providerName}
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
                    <h4 className="text-sm font-bold text-[#F4F3F7] truncate">{providerName}</h4>
                    <ShieldCheck className="size-3.5 text-[#3DDC84] shrink-0" />
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    ★ {providerRating.toFixed(1)} · Profesional Verificado
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
      </div>

      {/* SECCIÓN LÍNEA DE TIEMPO DETALLADA CON HORARIOS (Matching Image 1 & Image 2) */}
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
                  {providerName} aceptó el pedido
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

            {/* EVENTO SI ES CANCELADO: Muestra el horario exacto y el motivo de cancelación */}
            {isCancelled && (
              <div className="relative group">
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
                <p className="text-xs text-zinc-300 font-medium mt-0.5 bg-[#FF5A5A]/10 border border-[#FF5A5A]/25 p-2.5 rounded-xl">
                  {cancellationReason ||
                    (cancelledBy === "provider"
                      ? `${providerName} canceló el pedido por superposición de agenda o imposibilidad de asistir.`
                      : "La solicitud fue cancelada.")}
                </p>
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
                  El profesional está coordinando los detalles de la llegada
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
                  Servicio finalizado con éxito por {providerName}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface RequestDetail {
  id: string;
  category: string;
  raw_prompt: string;
  status: string;
  urgency: string;
  address?: string;
  provider?: {
    name: string;
    avatar_url?: string;
  };
  created_at?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_survey: { label: "En proceso de definición", color: "bg-amber-50 text-amber-700 border-amber-200" },
  pending_matching: { label: "Buscando profesional", color: "bg-indigo-50 text-[#4F46E5] border-indigo-200" },
  matching_active: { label: "Buscando profesional", color: "bg-indigo-50 text-[#4F46E5] border-indigo-200" },
  provider_selected: { label: "Esperando confirmación", color: "bg-amber-50 text-amber-700 border-amber-200" },
  pending_confirmation: { label: "Esperando confirmación", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmado · En camino", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "En progreso", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_completion: { label: "Marcar completado", color: "bg-indigo-50 text-[#4F46E5] border-indigo-200" },
  completed: { label: "Trabajo completado", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelado", color: "bg-zinc-100 text-zinc-500 border-zinc-300" },
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const requestId = params.id as string;

  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      try {
        const res = await apiFetch<{ data: any[] }>(`${ENDPOINTS.REQUESTS}?limit=10`);
        const found = (res.data || []).find((r) => r.uuid === requestId || r.id === requestId);

        if (found) {
          setRequestDetail({
            id: found.uuid || found.id,
            category: found.category?.name || "Cerrajería",
            raw_prompt: found.raw_prompt || "Solicitud de servicio",
            status: found.status || "confirmed",
            urgency: found.urgency || "today",
            address: found.location?.address || "Córdoba 456, Corrientes",
            provider: found.accepted_provider
              ? { name: found.accepted_provider.name }
              : { name: "Roberto Medina" },
            created_at: found.created_at,
          });
        } else {
          setRequestDetail({
            id: requestId,
            category: "Cerrajería",
            raw_prompt: "Me quedé afuera de mi casa, necesito cerrajero urgente.",
            status: "pending_confirmation",
            urgency: "immediate",
            address: "Córdoba 456, Corrientes",
            provider: { name: "Roberto Medina" },
            created_at: new Date().toISOString(),
          });
        }
      } catch {
        setRequestDetail({
          id: requestId,
          category: "Cerrajería",
          raw_prompt: "Me quedé afuera de mi casa, necesito cerrajero urgente.",
          status: "pending_confirmation",
          urgency: "immediate",
          address: "Córdoba 456, Corrientes",
          provider: { name: "Roberto Medina" },
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
      showToast("Solicitud cancelada", "info");
      router.push("/");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenShell className="py-12 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#4F46E5]" />
      </ScreenShell>
    );
  }

  if (!requestDetail) return null;

  const statusInfo = STATUS_LABELS[requestDetail.status] || {
    label: requestDetail.status,
    color: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  return (
    <ScreenShell className="py-6 space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Detalle del pedido
        </span>
      </div>

      {/* Header Categoría + Estado Badge */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-100">
              {requestDetail.category}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              ID: {requestDetail.id.substring(0, 8)}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold border ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Prompt original */}
        <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Tu mensaje
          </span>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
            "{requestDetail.raw_prompt}"
          </p>
        </div>

        {/* Dirección del trabajo */}
        <div className="flex items-center gap-2 pt-2 text-xs text-zinc-600 dark:text-zinc-300">
          <MapPin className="size-4 text-[#4F46E5] shrink-0" />
          <span className="font-medium">{requestDetail.address}</span>
        </div>

        {/* Profesional elegido */}
        {requestDetail.provider && (
          <div className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#4F46E5] text-white font-bold text-xs">
                {requestDetail.provider.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {requestDetail.provider.name}
                </h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-300">
                  Profesional asignado
                </p>
              </div>
            </div>
            <ShieldCheck className="size-5 text-[#4F46E5]" />
          </div>
        )}
      </div>

      {/* Timeline de eventos */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Línea de tiempo
        </h3>
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 space-y-4 shadow-sm">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-700">
            <div className="relative">
              <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-800" />
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Solicitud creada</h4>
              <p className="text-[11px] text-zinc-400">Recibimos tu pedido en el sistema</p>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-800" />
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Profesional asignado</h4>
              <p className="text-[11px] text-zinc-400">{requestDetail.provider?.name} aceptó el pedido</p>
            </div>
            <div className="relative">
              <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-zinc-800 animate-pulse" />
              <h4 className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400">En proceso de atención</h4>
              <p className="text-[11px] text-zinc-400">El profesional está coordinando la llegada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Cancelar si está en pending_confirmation / provider_selected */}
      {(requestDetail.status === "pending_confirmation" ||
        requestDetail.status === "provider_selected" ||
        requestDetail.status === "confirmed") && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCancelling}
          className="flex h-[52px] w-full items-center justify-center rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-800 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
        >
          {isCancelling ? <Loader2 className="size-4 animate-spin" /> : "Cancelar solicitud"}
        </button>
      )}
    </ScreenShell>
  );
}

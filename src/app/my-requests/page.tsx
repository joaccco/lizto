"use client";

import {
  Clock,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

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

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending_survey: {
    label: "Iniciada",
    className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]",
  },
  pending_matching: {
    label: "Buscando",
    className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]",
  },
  matching_active: {
    label: "Eligiendo",
    className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]",
  },
  provider_selected: {
    label: "Esperando confirmación",
    className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]",
  },
  pending_confirmation: {
    label: "Esperando confirmación",
    className: "bg-[#F2B441]/10 border-[#F2B441]/28 text-[#F2B441]",
  },
  confirmed: {
    label: "En curso",
    className: "bg-[#A8FF35]/10 border-[#A8FF35]/30 text-[#A8FF35]",
  },
  in_progress: {
    label: "En curso",
    className: "bg-[#A8FF35]/10 border-[#A8FF35]/30 text-[#A8FF35]",
  },
  active: {
    label: "En curso",
    className: "bg-[#A8FF35]/10 border-[#A8FF35]/30 text-[#A8FF35]",
  },
  completed: {
    label: "Finalizado",
    className: "bg-white/5 border-white/10 text-zinc-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-white/3 border-white/8 text-zinc-500",
  },
  expired: {
    label: "Expirado",
    className: "bg-white/3 border-white/8 text-zinc-500",
  },
};

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  if (date >= startOfToday) return "Hoy";
  if (date >= startOfYesterday) return "Ayer";
  if (date >= startOfWeek) return "Esta semana";
  return "Anteriores";
}

function groupByDate(items: RequestItem[]): [string, RequestItem[]][] {
  const order = ["Hoy", "Ayer", "Esta semana", "Anteriores"];
  const groups: Record<string, RequestItem[]> = {};
  for (const item of items) {
    const group = getDateGroup(item.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  }
  return order.filter((g) => groups[g]).map((g) => [g, groups[g]]);
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isStaleRequest(item: RequestItem): boolean {
  const staleStatuses = ["pending_survey", "pending_matching"];
  if (!staleStatuses.includes(item.status)) return false;
  const ageMs = Date.now() - new Date(item.created_at).getTime();
  return ageMs > 60 * 60 * 1000;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const fetchRequests = () => {
    setIsLoading(true);
    apiFetch<{ data: RequestItem[] }>(ENDPOINTS.REQUESTS, {
      headers: { "Cache-Control": "no-store" },
    })
      .then((res) => setRequests(res.data || []))
      .catch(() => setError("No se pudieron cargar tus solicitudes."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const staleCount = requests.filter(isStaleRequest).length;
  const showCleanupButton = staleCount >= 3;

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      await apiFetch(ENDPOINTS.REQUESTS_CLEANUP, { method: "DELETE" });
      fetchRequests();
    } catch {
      // silently ignore
    } finally {
      setIsCleaning(false);
    }
  };

  const groups = groupByDate(requests);

  return (
    <ScreenShell className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] leading-tight font-extrabold text-[#F4F3F7]">
          Mis solicitudes
        </h1>
        {showCleanupButton && (
          <button
            onClick={handleCleanup}
            disabled={isCleaning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition disabled:opacity-60"
          >
            {isCleaning ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            Limpiar ({staleCount})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#8B6BFF]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900/80 bg-red-950/40 p-4 text-center text-sm text-red-400">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/12 bg-[#131318] p-8 text-center min-h-[340px] space-y-3">
          <div className="size-14 rounded-full bg-[#7C5CFF]/14 border border-[#7C5CFF]/30 text-[#8B6BFF] flex items-center justify-center mb-1">
            <Search className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-[#F4F3F7]">
            Aún no tenés solicitudes
          </h3>
          <p className="max-w-xs text-xs text-zinc-400">
            Publicá lo que necesitás resolver y te conectaremos con profesionales en segundos.
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center justify-center h-[48px] px-6 rounded-2xl bg-[#7C5CFF] text-sm font-bold text-white shadow-md hover:bg-[#6b47ff] transition"
          >
            Buscar un servicio
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-3">
              <div className="text-[10.5px] font-mono tracking-widest uppercase text-zinc-500 font-semibold">
                {groupLabel}
              </div>

              <div className="space-y-1 divide-y divide-white/6">
                {items.map((item) => {
                  const categoryName = item.category?.name ?? "Servicio general";
                  const badge = STATUS_BADGES[item.status] || {
                    label: item.status,
                    className: "bg-white/5 border-white/10 text-zinc-400",
                  };
                  const providerName = item.accepted_provider?.name;

                  return (
                    <div
                      key={item.uuid}
                      onClick={() => router.push("/")}
                      className="py-3.5 space-y-2 cursor-pointer hover:bg-white/[0.02] transition px-1 rounded-xl"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[15.5px] font-bold text-[#F4F3F7]">
                          {categoryName}
                        </span>
                        <span className="text-[11.5px] font-mono text-zinc-500">
                          {formatTime(item.created_at)}
                        </span>
                      </div>

                      <div className="text-[13.5px] text-zinc-400 leading-snug">
                        «{item.raw_prompt}» {providerName && `· ${providerName}`}
                      </div>

                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-semibold ${badge.className}`}
                        >
                          <span className="size-1.5 rounded-full bg-current animate-pulse" />
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScreenShell>
  );
}

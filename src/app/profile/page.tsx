"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, ChevronRight, Loader2, User, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface ActiveRequest {
  uuid: string;
  raw_prompt: string;
  status: string;
  category: { name: string; slug: string; icon: string | null } | null;
  accepted_provider: { name: string; avg_rating: number | null; avatar_url: string | null } | null;
}

// La API devuelve el estado del Work cuando existe, y el de la ServiceRequest
// cuando no (ServiceRequestController:61). Por eso esta lista mezcla los dos
// enums a proposito. Origen: RequestStatus.php y WorkStatus.php.
const ACTIVE_STATUSES = [
  // RequestStatus — todavia no hay trabajo
  "pending_matching",
  "matching_active",
  "provider_selected",
  "pending_provider",
  "active",
  // WorkStatus — ya hay trabajo, y por lo tanto profesional asignado
  "pending_confirmation",
  "confirmed",
  "pending_diagnosis_quote",
  "in_progress",
  "pending_completion",
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingRequests(true);
    setRequestsError(false);
    apiFetch<{ data: ActiveRequest[] }>(ENDPOINTS.REQUESTS, {
      headers: { "Cache-Control": "no-store" },
    })
      .then((res) => {
        const active = (res.data || []).filter((r) =>
          ACTIVE_STATUSES.includes(r.status)
        );
        setActiveRequests(active);
      })
      .catch(() => {
        // Un error de red no es "no tenes pedidos": decirlo, no esconderlo.
        setRequestsError(true);
      })
      .finally(() => setIsLoadingRequests(false));
  }, [isAuthenticated]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const userName = user?.name || "";
  const userEmail = user?.email || "";

  // Todo lo de abajo depende del usuario autenticado, que en el servidor no
  // existe: el servidor dibujaba "U" y el cliente "RM". De ahi el error de
  // hidratacion. El estado `mounted` ya estaba declarado para esto y no se
  // estaba leyendo en ningun lado.
  if (!mounted) {
    return (
      <ScreenShell className="py-8 space-y-8">
        <div className="flex items-center gap-4" aria-hidden="true">
          <div className="size-[66px] rounded-full bg-[#1D1D25] border border-white/11 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-5 w-40 rounded bg-white/5" />
            <div className="h-3.5 w-52 rounded bg-white/5" />
          </div>
        </div>
        <span className="sr-only">Cargando tu perfil…</span>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="py-8 space-y-8">
      {/* Header Profile Section */}
      <div className="flex items-center gap-4">
        <div className="size-[66px] rounded-full bg-[#1D1D25] border border-white/11 flex items-center justify-center font-bold text-lg text-zinc-300 shrink-0">
          {getInitials(userName)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-[#F4F3F7] truncate">
            {userName || "Mi Perfil"}
          </h1>
          <p className="text-[13.5px] text-zinc-400 truncate mt-0.5">
            {userEmail}
          </p>
        </div>
      </div>

      {/* Provider Mode Banner if Provider */}
      {isAuthenticated && user && (user.roles?.includes("provider") || user.has_provider_profile) && (
        <div className="rounded-[20px] border border-[#7C5CFF]/30 bg-[#7C5CFF]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#A78BFA] font-bold">
              Modo profesional
            </span>
            <ShieldCheck className="size-4 text-[#8B6BFF]" />
          </div>
          <p className="text-xs text-zinc-300">
            Gestioná tu disponibilidad, trabajos recibidos y configurá tu perfil profesional.
          </p>
          <Link
            href="/provider"
            className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#7C5CFF] text-xs font-bold text-white hover:bg-[#6b47ff] transition"
          >
            Ir a mi panel de trabajo
          </Link>
        </div>
      )}

      {/* Pedidos activos — profesional asignado */}
      {isAuthenticated && (
        <div className="space-y-3">
          <div className="text-[10.5px] font-mono tracking-widest uppercase text-zinc-500 font-semibold">
            Pedidos activos
          </div>

          {isLoadingRequests ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-[#8B6BFF]" />
            </div>
          ) : requestsError ? (
            <div
              role="alert"
              className="rounded-[18px] border border-[#F2B441]/30 bg-[#F2B441]/8 p-5 text-center space-y-2"
            >
              <p className="text-xs text-[#F2B441] font-semibold">
                No pudimos cargar tus pedidos.
              </p>
              <p className="text-xs text-zinc-400">
                Puede ser un problema de conexión. Volvé a intentar en un momento.
              </p>
            </div>
          ) : activeRequests.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
              <p className="text-xs text-zinc-500">
                No tenés pedidos activos en este momento.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeRequests.map((req) => {
                const providerName = req.accepted_provider?.name;
                const categoryName = req.category?.name ?? "Servicio";
                return (
                  <button
                    key={req.uuid}
                    type="button"
                    onClick={() => router.push(`/requests/${req.uuid}`)}
                    aria-label={`Ver el pedido de ${categoryName}${providerName ? `, asignado a ${providerName}` : ", todavía sin profesional asignado"}`}
                    className="w-full min-h-[44px] text-left rounded-[18px] border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-black p-4 space-y-2.5 cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Briefcase className="size-4 text-[#8B6BFF] shrink-0" />
                        <span className="text-[14px] font-bold text-[#F4F3F7] truncate group-hover:text-[#C4B5FD] transition">
                          {categoryName}
                        </span>
                      </div>
                      <ChevronRight className="size-3.5 text-zinc-600 group-hover:text-zinc-400 transition shrink-0" />
                    </div>

                    {providerName ? (
                      <div className="flex items-center gap-2 rounded-[12px] bg-[#A8FF35]/8 border border-[#A8FF35]/20 px-3 py-2">
                        <User className="size-3.5 text-[#A8FF35] shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[#A8FF35]">
                          Asignado a {providerName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-[12px] bg-[#F2B441]/8 border border-[#F2B441]/20 px-3 py-2">
                        <Loader2 className="size-3.5 text-[#F2B441] animate-spin shrink-0" />
                        <span className="text-[12.5px] font-semibold text-[#F2B441]">
                          Buscando profesional…
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Appearance Segmented Control */}
      <div className="space-y-3">
        <div className="text-[10.5px] font-mono tracking-widest uppercase text-zinc-500 font-semibold">
          Apariencia
        </div>
        <div className="flex gap-2 p-1.5 rounded-[16px] bg-white/5 border border-white/9">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex-1 h-[44px] rounded-[12px] text-[13.5px] font-semibold transition cursor-pointer ${
              theme === "light"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 text-[#F4F3F7] shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex-1 h-[44px] rounded-[12px] text-[13.5px] font-semibold transition cursor-pointer ${
              theme === "system"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 text-[#F4F3F7] shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Automático
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex-1 h-[44px] rounded-[12px] text-[13.5px] font-semibold transition cursor-pointer ${
              theme === "dark"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 text-[#F4F3F7] shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Oscuro
          </button>
        </div>
      </div>

      {/* Settings List Rows */}
      <div className="divide-y divide-white/6 pt-2">
        <Link
          href="/my-requests"
          className="flex items-center justify-between py-4 group cursor-pointer"
        >
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Mis solicitudes
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </Link>
        <div className="flex items-center justify-between py-4 group cursor-pointer">
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Direcciones guardadas
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </div>
        <div className="flex items-center justify-between py-4 group cursor-pointer">
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Notificaciones
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </div>
        <div className="flex items-center justify-between py-4 group cursor-pointer">
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Ayuda
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="pt-6 flex items-center justify-between">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="text-[15px] font-semibold text-zinc-400 hover:text-red-400 transition flex items-center gap-2"
          >
            <LogOut className="size-4" />
            <span>Cerrar sesión</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="text-[15px] font-semibold text-[#8B6BFF] hover:text-indigo-300 transition"
          >
            Iniciar sesión
          </Link>
        )}
        <span className="text-[11px] font-mono text-zinc-600">v 2.0</span>
      </div>
    </ScreenShell>
  );
}

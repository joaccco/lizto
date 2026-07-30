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
  MapPin,
  Scale,
  Sparkles,
  User,
  UserCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { useAuth } from "@/hooks/useAuth";
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

interface WorkRequestItem {
  id: string;
  category: string;
  category_slug?: string;
  raw_prompt: string;
  client_name: string;
  urgency: string;
  location?: string;
  status: string;
  created_at?: string;
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [availability, setAvailability] = useState<"available" | "busy" | "unavailable">("available");
  const [workRequests, setWorkRequests] = useState<WorkRequestItem[]>([]);
  const [activeWork, setActiveWork] = useState<WorkRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  // Accept Modal State
  const [selectedRequest, setSelectedRequest] = useState<WorkRequestItem | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [isConfirming, setIsConfirming] = useState(false);

  // Check roles: if user is logged in but not a provider -> redirect to '/'
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      const isProvider = user?.roles?.includes("provider") || user?.has_provider_profile;
      if (!isProvider) {
        router.push("/");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ data: WorkRequestItem[] }>(ENDPOINTS.WORK_REQUESTS);
      const items = res.data || [];
      const pending = items.filter((i) => i.status !== "confirmed" && i.status !== "completed");
      const active = items.find((i) => i.status === "confirmed" || i.status === "in_progress");

      setWorkRequests(pending);
      setActiveWork(active || null);
    } catch {
      // Keep empty if error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleUpdateAvailability = async (newStatus: "available" | "busy" | "unavailable") => {
    setIsUpdatingAvailability(true);
    setAvailability(newStatus);
    try {
      await apiFetch(ENDPOINTS.PROVIDER_AVAILABILITY, {
        method: "POST",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert if failed
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const handleConfirmWork = async () => {
    if (!selectedRequest) return;
    setIsConfirming(true);
    try {
      await apiFetch(ENDPOINTS.WORK_CONFIRM(selectedRequest.id), {
        method: "POST",
        body: JSON.stringify({ estimated_duration_min: estimatedDuration }),
      });
      setSelectedRequest(null);
      fetchData();
    } catch {
      setSelectedRequest(null);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDeclineWork = async (reqId: string) => {
    try {
      await apiFetch(ENDPOINTS.WORK_DECLINE(reqId), { method: "POST" });
      fetchData();
    } catch {
      // silent
    }
  };

  const handleCompleteActiveWork = async (workId: string) => {
    try {
      await apiFetch(ENDPOINTS.WORK_COMPLETE(workId), { method: "POST" });
      setAvailability("available");
      fetchData();
    } catch {
      // silent
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Profesional";

  if (authLoading || isLoading) {
    return (
      <ScreenShell className="py-12">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#4F46E5]" />
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="py-6 pb-24">
      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-[24px] font-semibold text-zinc-950 dark:text-zinc-100">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Esto es lo que está pasando hoy
        </p>
      </div>

      {/* CARD DE DISPONIBILIDAD */}
      <div className="mt-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Estado de trabajo
          </span>
          {isUpdatingAvailability && <Loader2 className="size-4 animate-spin text-[#4F46E5]" />}
        </div>

        {/* Big current status */}
        <div className="flex items-center gap-3">
          <div
            className={`size-4 rounded-full ${
              availability === "available"
                ? "bg-emerald-500 animate-pulse"
                : availability === "busy"
                ? "bg-amber-500"
                : "bg-zinc-400"
            }`}
          />
          <h2 className="text-[20px] font-bold text-zinc-900 dark:text-zinc-100">
            {availability === "available"
              ? "Estás disponible"
              : availability === "busy"
              ? "Estás ocupado"
              : "No estás disponible"}
          </h2>
        </div>

        {/* Toggle 3 estados (56px cada opcion) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleUpdateAvailability("available")}
            className={`flex h-[56px] items-center justify-center rounded-2xl border text-xs font-semibold transition ${
              availability === "available"
                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
            }`}
          >
            Disponible
          </button>
          <button
            type="button"
            onClick={() => handleUpdateAvailability("busy")}
            className={`flex h-[56px] items-center justify-center rounded-2xl border text-xs font-semibold transition ${
              availability === "busy"
                ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
            }`}
          >
            Ocupado
          </button>
          <button
            type="button"
            onClick={() => handleUpdateAvailability("unavailable")}
            className={`flex h-[56px] items-center justify-center rounded-2xl border text-xs font-semibold transition ${
              availability === "unavailable"
                ? "border-zinc-600 bg-zinc-600 text-white shadow-sm"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
            }`}
          >
            No disponible
          </button>
        </div>
      </div>

      {/* SECCIÓN TRABAJO ACTIVO (si existe) */}
      {activeWork && (
        <section className="mt-8 space-y-3">
          <h3 className="text-[18px] font-bold text-zinc-900 dark:text-zinc-100">
            Tu trabajo actual
          </h3>
          <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                En curso
              </span>
              <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Cliente: {activeWork.client_name}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {activeWork.raw_prompt}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCompleteActiveWork(activeWork.id)}
              className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-emerald-600 text-base font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              Marcar como terminado
            </button>
          </div>
        </section>
      )}

      {/* SECCIÓN SOLICITUDES ENTRANTES */}
      <section className="mt-8 space-y-4">
        <h3 className="text-[18px] font-bold text-zinc-900 dark:text-zinc-100">
          Te están buscando
        </h3>

        {workRequests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8 text-center space-y-2">
            <Clock className="mx-auto size-8 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No hay solicitudes por ahora.
            </p>
            <p className="text-xs text-zinc-400">
              Asegurate de estar disponible para recibirlas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workRequests.map((req) => {
              const Icon = categoryIcons[req.category_slug || "general"] || Grid2x2;

              return (
                <div
                  key={req.id}
                  className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5]">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {req.category}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Cliente: {req.client_name}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      Urgente
                    </span>
                  </div>

                  <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                    "{req.raw_prompt}"
                  </p>

                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <MapPin className="size-3.5" />
                    <span>{req.location || "Zona Centro"}</span>
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(req)}
                      className="flex h-[56px] items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                    >
                      Aceptar este trabajo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineWork(req.id)}
                      className="flex h-[56px] items-center justify-center rounded-2xl border-2 border-red-200 dark:border-red-900 bg-white dark:bg-zinc-800 text-sm font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      No puedo ahora
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL ESTIMACION TIEMPO */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-800 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ¿Cuánto tiempo estimás?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ingresá una estimación aproximada para avisarle al cliente.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "30 min", value: 30 },
                { label: "1 hora", value: 60 },
                { label: "2 horas", value: 120 },
                { label: "Más de 2h", value: 180 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEstimatedDuration(opt.value)}
                  className={`flex h-[48px] items-center justify-center rounded-xl border text-xs font-semibold transition ${
                    estimatedDuration === opt.value
                      ? "border-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-300 font-bold"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex-1 h-[48px] rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmWork}
                disabled={isConfirming}
                className="flex-1 h-[48px] rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE ABAJO */}
      <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4">
        <Link
          href="/provider/profile"
          className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-zinc-950 dark:bg-zinc-100 px-6 text-sm font-semibold text-white dark:text-zinc-950 shadow-lg hover:bg-zinc-800 transition"
        >
          <User className="size-4" />
          Editar mi perfil
        </Link>
      </div>
    </ScreenShell>
  );
}

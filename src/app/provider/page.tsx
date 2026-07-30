"use client";

import {
  Brush,
  Calculator,
  Calendar as CalendarIcon,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
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

interface CalendarEvent {
  id: string;
  time: string;
  clientName: string;
  jobType: string;
  address: string;
  status: "pending" | "confirmed" | "in_progress";
}

const MOCK_AGENDA: Record<number, CalendarEvent[]> = {
  15: [
    {
      id: "ev-1",
      time: "09:30",
      clientName: "Juan Pérez",
      jobType: "Cambio de combinación",
      address: "Av. Corrientes 1240",
      status: "confirmed",
    },
    {
      id: "ev-2",
      time: "14:00",
      clientName: "María López",
      jobType: "Apertura de puerta",
      address: "Palermo, CABA",
      status: "in_progress",
    },
  ],
  18: [
    {
      id: "ev-3",
      time: "11:00",
      clientName: "Carlos R.",
      jobType: "Instalación de cerrojo",
      address: "Belgrano",
      status: "pending",
    },
  ],
  22: [
    {
      id: "ev-4",
      time: "16:30",
      clientName: "Ana K.",
      jobType: "Cerrajería urgente",
      address: "Recoleta",
      status: "confirmed",
    },
  ],
};

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"jobs" | "agenda" | "profile">("jobs");
  const [availability, setAvailability] = useState<"available" | "busy" | "unavailable">("available");
  const [workRequests, setWorkRequests] = useState<WorkRequestItem[]>([]);
  const [activeWork, setActiveWork] = useState<WorkRequestItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  // Calendar state
  const todayDate = new Date().getDate();
  const [selectedDay, setSelectedDay] = useState<number>(15);

  // Accept Modal State
  const [selectedRequest, setSelectedRequest] = useState<WorkRequestItem | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [isConfirming, setIsConfirming] = useState(false);

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
      // keep default
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
      // ignore
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
      // ignore
    }
  };

  const handleCompleteActiveWork = async (workId: string) => {
    try {
      await apiFetch(ENDPOINTS.WORK_COMPLETE(workId), { method: "POST" });
      setAvailability("available");
      fetchData();
    } catch {
      // ignore
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Roberto";
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "RM";

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  const dayEvents = MOCK_AGENDA[selectedDay] || [];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-zinc-100 pb-28">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* HEADER: Nombre del profesional + categoría / Avatar con iniciales a la derecha */}
        <header className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{user?.name || "Roberto Medina"}</h1>
            <p className="text-xs font-medium text-zinc-400">Cerrajero matriculado • Lizto Pro</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#1e1b4b] border border-indigo-900 text-base font-bold text-indigo-300 shadow-md">
            {userInitials}
          </div>
        </header>

        {/* BLOQUE DE DISPONIBILIDAD */}
        <section className="rounded-3xl bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span
                  className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                    availability === "available"
                      ? "bg-emerald-400"
                      : availability === "busy"
                      ? "bg-amber-400"
                      : "bg-zinc-500"
                  }`}
                />
                <span
                  className={`relative inline-flex size-3 rounded-full ${
                    availability === "available"
                      ? "bg-emerald-500"
                      : availability === "busy"
                      ? "bg-amber-500"
                      : "bg-zinc-500"
                  }`}
                />
              </span>
              <h2 className="text-xl font-bold text-white">
                {availability === "available"
                  ? "Disponible"
                  : availability === "busy"
                  ? "Ocupado"
                  : "No disponible"}
              </h2>
            </div>
            {isUpdatingAvailability && <Loader2 className="size-4 animate-spin text-emerald-400" />}
          </div>

          {/* Toggle de 3 opciones */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleUpdateAvailability("available")}
              className={`flex h-[56px] items-center justify-center rounded-2xl border text-xs font-bold transition ${
                availability === "available"
                  ? "bg-[#052e16] border-emerald-600 text-emerald-300 shadow-sm"
                  : "bg-[#0f0f0f] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Disponible
            </button>
            <button
              type="button"
              onClick={() => handleUpdateAvailability("busy")}
              className={`flex h-[56px] items-center justify-center rounded-2xl border text-xs font-bold transition ${
                availability === "busy"
                  ? "bg-[#451a03] border-amber-600 text-amber-300 shadow-sm"
                  : "bg-[#0f0f0f] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Ocupado
            </button>
            <button
              type="button"
              onClick={() => handleUpdateAvailability("unavailable")}
              className={`flex h-[56px] items-center justify-center rounded-2xl border text-xs font-bold transition ${
                availability === "unavailable"
                  ? "bg-zinc-800 border-zinc-600 text-zinc-200 shadow-sm"
                  : "bg-[#0f0f0f] border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              No disponible
            </button>
          </div>
        </section>

        {/* BENTO GRID 2 COLUMNAS */}
        <section className="grid grid-cols-2 gap-3">
          {/* Bloque Indigo oscuro: HOY */}
          <div className="rounded-3xl bg-[#1e1b4b] border border-indigo-900 p-5 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Hoy</span>
            <div className="text-3xl font-black text-white">{workRequests.length}</div>
            <p className="text-[11px] text-indigo-200 font-medium">Solicitudes nuevas</p>
          </div>

          {/* Bloque neutro: ESTE MES */}
          <div className="rounded-3xl bg-[#1a1a1a] border border-zinc-800 p-5 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Este mes</span>
            <div className="text-3xl font-black text-white">28</div>
            <p className="text-[11px] text-zinc-400 font-medium">Trabajos completados</p>
          </div>
        </section>

        {/* TAB NAVIGATION: MIS TRABAJOS / AGENDA */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            {/* SECCIÓN TRABAJO ACTIVO (si existe) */}
            {activeWork && (
              <section className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-white">Tu trabajo en curso</h3>
                <div className="rounded-3xl bg-[#052e16] border border-emerald-700/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase">En progreso</span>
                    <UserCheck className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Cliente: {activeWork.client_name}</h4>
                    <p className="text-xs text-emerald-200 mt-1">{activeWork.raw_prompt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCompleteActiveWork(activeWork.id)}
                    className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 transition shadow-sm"
                  >
                    Marcar como terminado
                  </button>
                </div>
              </section>
            )}

            {/* SECCIÓN TE ESTÁN BUSCANDO */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Te están buscando</h3>
                <span className="text-xs text-zinc-400">{workRequests.length} pendientes</span>
              </div>

              {workRequests.length === 0 ? (
                <div className="rounded-3xl bg-[#1a1a1a] border border-zinc-800 p-8 text-center space-y-2">
                  <Clock className="mx-auto size-8 text-zinc-500" />
                  <p className="text-sm font-bold text-zinc-300">No hay solicitudes por ahora</p>
                  <p className="text-xs text-zinc-500">Asegurate de estar disponible para recibirlas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workRequests.map((req) => {
                    const Icon = categoryIcons[req.category_slug || "general"] || Grid2x2;

                    return (
                      <div
                        key={req.id}
                        className="rounded-3xl bg-[#1a1a1a] border border-zinc-800 p-5 space-y-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1e1b4b] text-indigo-300">
                              <Icon className="size-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{req.client_name}</h4>
                              <p className="text-xs text-zinc-400">{req.category}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-red-950/80 px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-800">
                            Urgente
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                          "{req.raw_prompt}"
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <MapPin className="size-3.5" />
                          <span>{req.location || "Centro, CABA"}</span>
                        </div>

                        {/* Botones */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="flex h-[56px] items-center justify-center rounded-2xl bg-[#4F46E5] text-xs font-bold text-white hover:bg-indigo-600 transition shadow-sm"
                          >
                            Aceptar trabajo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineWork(req.id)}
                            className="flex h-[56px] items-center justify-center rounded-2xl border border-red-900 bg-[#0f0f0f] text-xs font-bold text-red-400 hover:bg-red-950/40 transition"
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
          </div>
        )}

        {/* SECCIÓN MI AGENDA */}
        {activeTab === "agenda" && (
          <section className="space-y-6 pt-2">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">Mi agenda — Julio 2026</h3>

              {/* Calendario mensual compacto */}
              <div className="rounded-3xl bg-[#1a1a1a] border border-zinc-800 p-4 space-y-3">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 uppercase">
                  <span>Lu</span>
                  <span>Ma</span>
                  <span>Mi</span>
                  <span>Ju</span>
                  <span>Vi</span>
                  <span>Sá</span>
                  <span>Do</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const hasJobs = MOCK_AGENDA[day] !== undefined;
                    const isToday = day === todayDate;
                    const isSelected = day === selectedDay;

                    let btnClass = "bg-[#0f0f0f] text-zinc-400 hover:bg-zinc-800";
                    if (isToday) {
                      btnClass = "bg-[#4F46E5] text-white font-bold shadow-md";
                    } else if (hasJobs) {
                      btnClass = "bg-[#1e1b4b] text-indigo-300 font-bold border border-indigo-900";
                    }

                    if (isSelected && !isToday) {
                      btnClass += " ring-2 ring-indigo-400";
                    }

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`flex h-10 w-full items-center justify-center rounded-xl text-xs transition ${btnClass}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timeline del día seleccionado */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Trabajos del día {selectedDay} de Julio
              </h4>

              {dayEvents.length === 0 ? (
                <div className="rounded-2xl bg-[#1a1a1a] border border-zinc-800 p-6 text-center text-xs text-zinc-500">
                  Sin trabajos programados para este día.
                </div>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map((ev) => {
                    const dotColor =
                      ev.status === "confirmed"
                        ? "bg-emerald-500"
                        : ev.status === "in_progress"
                        ? "bg-amber-500"
                        : "bg-[#4F46E5]";

                    return (
                      <div
                        key={ev.id}
                        className="flex items-center gap-4 rounded-2xl bg-[#1a1a1a] border border-zinc-800 p-4"
                      >
                        <span className="text-xs font-mono font-bold text-zinc-400">{ev.time}</span>
                        <span className={`size-2.5 rounded-full ${dotColor}`} />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-white truncate">{ev.clientName}</h5>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {ev.jobType} • {ev.address}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* MODAL ESTIMACIÓN TIEMPO */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#1a1a1a] border border-zinc-800 p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">¿Cuánto tiempo estimás?</h3>
              <p className="text-xs text-zinc-400">Ingresá una estimación rápida para avisarle al cliente.</p>

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
                    className={`flex h-[48px] items-center justify-center rounded-xl border text-xs font-bold transition ${
                      estimatedDuration === opt.value
                        ? "border-[#4F46E5] bg-[#1e1b4b] text-indigo-300"
                        : "border-zinc-800 bg-[#0f0f0f] text-zinc-400"
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
                  className="flex-1 h-[48px] rounded-xl border border-zinc-800 bg-[#0f0f0f] text-xs font-bold text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWork}
                  disabled={isConfirming}
                  className="flex-1 h-[48px] rounded-xl bg-[#4F46E5] text-xs font-bold text-white hover:bg-indigo-600 transition"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NAV DEL PROFESIONAL (Fijo abajo) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-[64px] w-full bg-[#1a1a1a] border-t border-zinc-800">
        <div className="mx-auto flex h-full max-w-md items-center justify-around px-4">
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`flex flex-col items-center justify-center space-y-1 transition ${
              activeTab === "jobs" ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ClipboardList className="size-5" />
            <span className="text-[10px] font-bold">Mis trabajos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("agenda")}
            className={`flex flex-col items-center justify-center space-y-1 transition ${
              activeTab === "agenda" ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <CalendarIcon className="size-5" />
            <span className="text-[10px] font-bold">Agenda</span>
          </button>

          <Link
            href="/provider/profile"
            className="flex flex-col items-center justify-center space-y-1 text-zinc-500 hover:text-zinc-300 transition"
          >
            <User className="size-5" />
            <span className="text-[10px] font-bold">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

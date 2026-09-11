"use client";

import {
  AlertTriangle,
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
  MessageSquare,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import { requestPushNotificationPermissionAndRegister } from "@/lib/pushNotifications";
import type { KycStatus, KycStatusResponse } from "@/lib/types";

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
  service_request_id?: string;
  work_id?: string;
  conversation_id?: string;
  category?: string | null;
  category_slug?: string | null;
  raw_prompt: string;
  client_name: string;
  urgency: string;
  location?: string;
  status: string;
  created_at?: string;
  schedule?: {
    scheduled_date: string | null;
    window_start: string | null;
    window_end: string | null;
    label: string;
  };
}

// Formateador de tiempo relativo de recepción para profesionales (sin fechas absolutas ni valores hardcodeados)
function formatProviderRequestTime(dateStr?: string): { relative: string; isRecent: boolean } {
  if (!dateStr) {
    return { relative: "Llegó hace instantes", isRecent: true };
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { relative: "Llegó hace instantes", isRecent: true };
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return { relative: `Llegó hace ${diffMins} min`, isRecent: diffMins < 30 };
    if (diffHours < 24) return { relative: `Llegó hace ${diffHours} h`, isRecent: false };

    const days = Math.floor(diffHours / 24);
    return { relative: `Llegó hace ${days} d`, isRecent: false };
  } catch {
    return { relative: "Llegó hace instantes", isRecent: true };
  }
}

interface AgendaEvent {
  id: string;
  work_id: string;
  client_name: string;
  client_email?: string;
  job_type: string;
  category?: string;
  address: string;
  status: string;
  scheduled_at: string;
  day: number;
  month: number;
  year: number;
  time: string;
  estimated_duration_min?: number;
  agreed_price?: number | null;
}

interface CalendarEventDisplay {
  id: string;
  time: string;
  clientName: string;
  jobType: string;
  address: string;
  status: string;
}



export default function ProviderPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"jobs" | "calendar">("jobs");
  const [availability, setAvailability] = useState<"available" | "busy" | "unavailable">("available");
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);

  const [workRequests, setWorkRequests] = useState<WorkRequestItem[]>([]);
  const [activeWorks, setActiveWorks] = useState<WorkRequestItem[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [profileStats, setProfileStats] = useState<{ avg_rating?: number | null; total_reviews?: number } | null>(null);

  // Ordenación cronológica de solicitudes
  const sortedWorkRequests = useMemo(() => {
    return [...workRequests].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now() - parseInt(a.id || "0") * 60000;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now() - parseInt(b.id || "0") * 60000;
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [workRequests, sortOrder]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [pendingScheduleWorks, setPendingScheduleWorks] = useState<AgendaEvent[]>([]);
  const [historyWorks, setHistoryWorks] = useState<WorkRequestItem[]>([]);

  const currentMonthStr = useMemo(() => {
    const monthName = currentDate.toLocaleDateString("es-ES", { month: "long" });
    const year = currentDate.getFullYear();
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const now = new Date();
    const maxDate = new Date(now.getFullYear(), now.getMonth() + 12, 1);
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (nextDate <= maxDate) {
      setCurrentDate(nextDate);
    }
  };

  const daysInCurrentMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  }, [currentDate]);

  const [selectedRequest, setSelectedRequest] = useState<WorkRequestItem | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);

  const [showProviderCancelModal, setShowProviderCancelModal] = useState(false);
  const [selectedCancelWorkId, setSelectedCancelWorkId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("Emergencia personal");
  const [isCancellingWork, setIsCancellingWork] = useState(false);

  const handleConfirmProviderCancel = async () => {
    const targetWorkId = selectedCancelWorkId || activeWorks[0]?.work_id || activeWorks[0]?.id;
    if (!targetWorkId) return;

    setIsCancellingWork(true);
    try {
      await apiFetch(ENDPOINTS.WORK_CANCEL(targetWorkId), {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
      setShowProviderCancelModal(false);
      setSelectedCancelWorkId(null);
      fetchData();
    } catch {
      setShowProviderCancelModal(false);
      setSelectedCancelWorkId(null);
      fetchData();
    } finally {
      setIsCancellingWork(false);
    }
  };

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
      const [resReq, resWorks, resAgenda, resKyc, resProfile] = await Promise.all([
        apiFetch<{ data: WorkRequestItem[] }>(ENDPOINTS.WORK_REQUESTS).catch(() => ({ data: [] })),
        apiFetch<{ data: WorkRequestItem[] }>(ENDPOINTS.WORKS).catch(() => ({ data: [] })),
        apiFetch<{ data: AgendaEvent[]; pending_schedule?: AgendaEvent[] }>(ENDPOINTS.PROVIDER_AGENDA).catch(() => ({ data: [], pending_schedule: [] })),
        apiFetch<KycStatusResponse>(ENDPOINTS.KYC_STATUS).catch(() => null),
        apiFetch<{ data: { avg_rating?: number | null; total_reviews?: number } }>(ENDPOINTS.PROVIDER_PROFILE).catch(() => null),
      ]);

      if (resProfile?.data) {
        setProfileStats(resProfile.data);
      }

      setWorkRequests(resReq.data || []);

      const worksList = resWorks.data || [];
      const activeList = worksList.filter((w) => w.status !== "completed" && w.status !== "cancelled");
      const doneList = worksList.filter((w) => w.status === "completed" || w.status === "cancelled");

      setActiveWorks(activeList);
      setHistoryWorks(doneList);
      setAgendaEvents(resAgenda.data || []);
      setPendingScheduleWorks(resAgenda.pending_schedule || []);

      if (resKyc && resKyc.kyc_status) {
        setKycStatus(resKyc.kyc_status);
      }
    } catch (e) {
      console.warn("Error fetching provider dashboard data:", e);
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
    // Solicitud de permiso para notificaciones push en el gesto explícito de cambio de disponibilidad
    requestPushNotificationPermissionAndRegister().catch(() => {});
    try {
      await apiFetch(ENDPOINTS.PROVIDER_AVAILABILITY, {
        method: "PUT",
        body: JSON.stringify({ availability_status: newStatus }),
      });
      setAvailability(newStatus);
    } catch {
      setAvailability(newStatus);
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const handleDeclineWork = async (requestId: string) => {
    try {
      await apiFetch(ENDPOINTS.WORK_DECLINE(requestId), { method: "POST" });
      setWorkRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setWorkRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  };

  const handleConfirmWork = async () => {
    if (!selectedRequest) return;
    setIsConfirming(true);
    try {
      const payload: any = { estimated_duration_min: estimatedDuration };
      if (scheduledDate) {
        payload.scheduled_at = scheduledDate;
      }
      await apiFetch(ENDPOINTS.WORK_CONFIRM(selectedRequest.id), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSelectedRequest(null);
      setWorkRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      fetchData();
    } catch (err: any) {
      console.error("Error al aceptar trabajo:", err);
      setSelectedRequest(null);
      fetchData();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCompleteActiveWork = async (workId: string) => {
    try {
      await apiFetch(ENDPOINTS.WORK_COMPLETE(workId), { method: "POST" });
      fetchData();
    } catch {
      // ignore
    }
  };

  const firstName = isMounted && user?.name ? user.name.split(" ")[0] : "";
  const userInitials = isMounted && user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "PRO";

  const daysWithEvents = useMemo(() => {
    const set = new Set<number>();
    const targetMonth = currentDate.getMonth() + 1;
    const targetYear = currentDate.getFullYear();

    agendaEvents.forEach((ev) => {
      if (ev.month === targetMonth && ev.year === targetYear) {
        set.add(ev.day);
      }
    });
    return set;
  }, [agendaEvents, currentDate]);

  const selectedEvents: CalendarEventDisplay[] = useMemo(() => {
    const targetMonth = currentDate.getMonth() + 1;
    const targetYear = currentDate.getFullYear();

    const matched = agendaEvents.filter((ev) => ev.year === targetYear && ev.month === targetMonth && ev.day === selectedDay);
    if (matched.length > 0) {
      return matched.map((ev) => ({
        id: ev.id,
        time: ev.time || "09:00",
        clientName: ev.client_name,
        jobType: ev.job_type,
        address: ev.address,
        status: ev.status,
      }));
    }

    return [];
  }, [agendaEvents, currentDate, selectedDay]);

  return (
    <div className="min-h-screen bg-[#08080A] text-[#F4F3F7] font-sans pb-24">
      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-20 bg-[#08080A]/90 backdrop-blur-xl border-b border-white/9 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="size-11 rounded-2xl bg-[#7C5CFF] flex items-center justify-center font-bold text-white shadow-lg shadow-[#7C5CFF]/30 text-base"
              suppressHydrationWarning
            >
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#F4F3F7]" suppressHydrationWarning>
                  Hola{firstName ? `, ${firstName}` : ""}
                </h1>
                {kycStatus === "verified" ? (
                  <Link
                    href="/provider/kyc"
                    className="inline-flex items-center gap-1 rounded-full bg-[#3DDC84]/15 px-2 py-0.5 text-[10px] font-bold text-[#3DDC84] border border-[#3DDC84]/30 hover:bg-[#3DDC84]/25 transition"
                    title="Identidad Verificada"
                  >
                    <CheckCircle2 className="size-3 text-[#3DDC84]" /> PRO Verificado
                  </Link>
                ) : (
                  <Link
                    href="/provider/kyc"
                    className="inline-flex items-center gap-1 rounded-full bg-[#7C5CFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#C4B5FD] border border-[#7C5CFF]/30 hover:bg-[#7C5CFF]/25 transition"
                    title="Configurar verificación KYC"
                  >
                    <CheckCircle2 className="size-3 text-[#A8FF35]" /> PRO
                  </Link>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-medium">Panel de Profesional</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleUpdateAvailability(availability === "available" ? "busy" : "available")}
              disabled={isUpdatingAvailability}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                availability === "available"
                  ? "bg-[#A8FF35]/12 text-[#A8FF35] border-[#A8FF35]/30"
                  : availability === "busy"
                  ? "bg-[#F2B441]/12 text-[#F2B441] border-[#F2B441]/30"
                  : "bg-white/5 text-zinc-400 border-white/10"
              }`}
            >
              <span className={`size-2 rounded-full ${
                availability === "available" ? "bg-[#A8FF35] animate-pulse" : availability === "busy" ? "bg-[#F2B441]" : "bg-zinc-500"
              }`} />
              {availability === "available" ? "Disponible" : availability === "busy" ? "Ocupado" : "No disponible"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* BANNER DE ESTADO KYC SI NO ESTÁ VERIFICADO */}
        {kycStatus === "unverified" && (
          <div className="rounded-[20px] bg-gradient-to-r from-[#F2B441]/20 via-[#F2B441]/10 to-transparent border border-[#F2B441]/35 p-4 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-xl bg-[#F2B441]/20 border border-[#F2B441]/40 flex items-center justify-center text-[#F2B441] shrink-0">
                <ShieldAlert className="size-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#F4F3F7]">Verificación de Identidad Requerida</h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  Subí tus documentos para activar tu cuenta y recibir trabajos.
                </p>
              </div>
            </div>
            <Link
              href="/provider/kyc"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[#F2B441] hover:bg-[#e0a435] text-[11px] font-extrabold text-black transition shadow-sm"
            >
              Verificar →
            </Link>
          </div>
        )}

        {kycStatus === "pending" && (
          <div className="rounded-[20px] bg-gradient-to-r from-[#7C5CFF]/20 via-[#7C5CFF]/10 to-transparent border border-[#7C5CFF]/35 p-4 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 flex items-center justify-center text-[#C4B5FD] shrink-0">
                <Clock className="size-4 text-[#A8FF35]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#F4F3F7]">Documentos en Revisión</h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  Estamos auditando tu información. Te avisaremos pronto.
                </p>
              </div>
            </div>
            <Link
              href="/provider/kyc"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white border border-white/14 transition"
            >
              Ver estado →
            </Link>
          </div>
        )}

        {kycStatus === "rejected" && (
          <div className="rounded-[20px] bg-gradient-to-r from-[#FF5A5A]/20 via-[#FF5A5A]/10 to-transparent border border-[#FF5A5A]/45 p-4 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-xl bg-[#FF5A5A]/20 border border-[#FF5A5A]/40 flex items-center justify-center text-[#FF5A5A] shrink-0">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#F4F3F7]">Documentación Observada</h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  Uno o más documentos fueron rechazados. Revisá los motivos.
                </p>
              </div>
            </div>
            <Link
              href="/provider/kyc"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[#FF5A5A] hover:bg-red-600 text-[11px] font-extrabold text-white transition shadow-sm"
            >
              Corregir →
            </Link>
          </div>
        )}

        {/* NAVEGACIÓN DE TABS */}
        <div className="flex gap-1.5 p-1.5 rounded-[16px] bg-white/5 border border-white/9">
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`flex-1 flex items-center justify-center gap-2 h-[44px] rounded-[12px] text-xs font-bold transition cursor-pointer ${
              activeTab === "jobs"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] text-[#F4F3F7]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ClipboardList className="size-4" />
            Solicitudes {workRequests.length > 0 && `(${workRequests.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 h-[44px] rounded-[12px] text-xs font-bold transition cursor-pointer ${
              activeTab === "calendar"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] text-[#F4F3F7]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <CalendarIcon className="size-4" />
            Mi Agenda {agendaEvents.length > 0 && `(${agendaEvents.length})`}
          </button>
        </div>

        {/* METRICAS RÁPIDAS (BENTO HEADER) */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-[#131318] border border-white/8 p-4 space-y-1">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Rating General</span>
            {profileStats?.avg_rating && (profileStats.total_reviews ?? 0) > 0 ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-[#F4F3F7]">{profileStats.avg_rating.toFixed(1)}</span>
                  <span className="text-xs text-[#F2B441] font-bold">★</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">{profileStats.total_reviews} reseñas verificadas</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-xl font-extrabold text-[#A78BFA] px-2 py-0.5 rounded-md bg-[#7C5CFF]/15 border border-[#7C5CFF]/25">
                    Nuevo
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Sin reseñas aún</p>
              </>
            )}
          </div>

          <div className="rounded-[20px] bg-[#131318] border border-white/8 p-4 space-y-1">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Trabajos Activos</span>
            <div className="text-2xl font-extrabold text-[#3DDC84]">{activeWorks.length}</div>
            <p className="text-[10px] text-zinc-500 font-medium">En curso actualmente</p>
          </div>
        </section>

        {/* TAB 1: SOLICITUDES Y TRABAJOS EN CURSO */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            {/* SECCIÓN TRABAJOS EN CURSO */}
            {activeWorks.length > 0 && (
              <section className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#F4F3F7]">Tus trabajos en curso</h3>
                  <span className="text-xs text-[#3DDC84] font-semibold">{activeWorks.length} activos</span>
                </div>
                <div className="space-y-3">
                  {activeWorks.map((work) => {
                    const targetId = work.work_id || work.id;
                    const isDiagnosis = work.status === "pending_diagnosis_quote";

                    return (
                      <div key={targetId} className="rounded-[24px] bg-gradient-to-b from-[#3DDC84]/12 to-[#3DDC84]/4 backdrop-blur-xl border border-[#3DDC84]/35 p-5 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#3DDC84] uppercase tracking-wider">
                            {isDiagnosis ? "Evaluación Presencial" : "En progreso"}
                          </span>
                          <UserCheck className="size-5 text-[#3DDC84]" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#F4F3F7]">Cliente: {work.client_name}</h4>
                          <p className="text-xs text-zinc-300 mt-1">«{work.raw_prompt}»</p>
                          {work.location && (
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                              <MapPin className="size-3 text-[#3DDC84]" /> {work.location}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          {work.conversation_id && (
                            <Link
                              href={`/conversations/${work.conversation_id}`}
                              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#3DDC84]/20 border border-[#3DDC84]/40 text-xs font-bold text-[#3DDC84] hover:bg-[#3DDC84]/30 transition"
                            >
                              <MessageSquare className="size-4" /> Abrir Chat con Cliente
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCompleteActiveWork(targetId)}
                            className="flex h-[56px] w-full items-center justify-center rounded-[16px] bg-[#3DDC84] text-[#08080A] text-sm font-extrabold hover:bg-[#32c774] transition shadow-md cursor-pointer"
                          >
                            Marcar como terminado
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCancelWorkId(targetId);
                              setShowProviderCancelModal(true);
                            }}
                            className="flex h-[44px] w-full items-center justify-center rounded-[14px] border border-[#FF5A5A]/40 bg-transparent text-xs font-bold text-[#FF5A5A] hover:bg-[#FF5A5A]/10 transition cursor-pointer"
                          >
                            No puedo continuar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECCIÓN SOLICITUDES ENTRANTES EN ORDEN CRONOLÓGICO */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/7 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#F4F3F7]">Te están buscando</h3>
                  <p className="text-[11.5px] text-zinc-400 font-medium">
                    Listado cronológico de pedidos ({workRequests.length} pendientes)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 hover:bg-white/12 text-xs font-bold text-[#C4B5FD] border border-white/12 transition cursor-pointer self-start sm:self-auto"
                >
                  <Clock className="size-3.5 text-[#A8FF35]" />
                  <span>{sortOrder === "newest" ? "Más recientes primero" : "Más antiguos primero"}</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex py-12 justify-center">
                  <Loader2 className="size-6 animate-spin text-[#8B6BFF]" />
                </div>
              ) : sortedWorkRequests.length === 0 ? (
                <div className="rounded-[24px] bg-[#131318] border border-white/8 p-8 text-center space-y-2">
                  <Clock className="mx-auto size-8 text-zinc-500" />
                  <p className="text-sm font-bold text-[#F4F3F7]">No hay solicitudes por ahora</p>
                  <p className="text-xs text-zinc-500">Asegurate de estar disponible para recibirlas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedWorkRequests.map((req) => {
                    const Icon = categoryIcons[req.category_slug || "general"] || Grid2x2;
                    const timeInfo = formatProviderRequestTime(req.created_at);
                    const assistanceLabel = req.schedule?.label || (req.urgency === "immediate" ? "Atención inmediata" : "A coordinar");
                    const isImmediate = req.urgency === "immediate";

                    return (
                      <div
                        key={req.id}
                        className="rounded-[24px] bg-[#131318] border border-white/9 p-5 space-y-4 shadow-sm hover:border-[#8B6BFF]/50 transition"
                      >
                        {/* Fila superior: Cliente, Rubro y Cuándo Llegó (Tratamiento Secundario) */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#7C5CFF]/12 border border-[#7C5CFF]/30 text-[#C4B5FD]">
                              <Icon className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-[#F4F3F7] truncate">{req.client_name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 truncate">{req.category || "Sin especificar"}</span>
                                <span className="text-[11px] font-mono text-zinc-400">· {timeInfo.relative}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="rounded-full bg-[#FF5A5A]/14 px-2.5 py-1 text-[10px] font-mono font-bold text-[#FF5A5A] border border-[#FF5A5A]/40 uppercase">
                              Urgente
                            </span>
                          </div>
                        </div>

                        {/* Prompt del Cliente */}
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-medium bg-white/3 p-3 rounded-xl border border-white/5">
                          "{req.raw_prompt}"
                        </p>

                        {/* JERARQUÍA TEMPORAL PRIMARIA: Cuándo Debe Asistir (Alto Contraste) */}
                        <div className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold ${
                          isImmediate
                            ? "bg-[#FF5A5A]/14 border-[#FF5A5A]/45 text-[#FF5A5A]"
                            : "bg-[#7C5CFF]/14 border-[#7C5CFF]/35 text-[#C4B5FD]"
                        }`}>
                          <Clock className="size-4 shrink-0 text-[#A8FF35]" />
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-semibold shrink-0">
                              Cuándo asistir:
                            </span>
                            <span className="font-extrabold text-xs text-white truncate text-right">
                              {assistanceLabel}
                            </span>
                          </div>
                        </div>

                        {/* Ubicación */}
                        <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/7 pt-3">
                          <div className="flex items-center gap-1.5 font-medium text-zinc-300 truncate">
                            <MapPin className="size-3.5 text-[#8B6BFF] shrink-0" />
                            <span className="truncate">{req.location || "Barrio Centro, Corrientes"}</span>
                          </div>
                        </div>

                        {/* Botones de Acción Aceptar / Declinar */}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="flex-1 flex h-[48px] items-center justify-center rounded-[14px] bg-[#7C5CFF] text-xs font-bold text-[#F4F3F7] hover:bg-[#6b47ff] transition shadow-[0_10px_26px_rgba(124,92,255,0.4)] cursor-pointer"
                          >
                            Aceptar trabajo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineWork(req.id)}
                            className="flex h-[48px] px-4 items-center justify-center rounded-[14px] border border-white/12 bg-transparent text-xs font-bold text-zinc-400 hover:bg-white/5 transition cursor-pointer"
                          >
                            Declinar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECCIÓN HISTORIAL DE TRABAJOS COMPLETADOS Y CANCELADOS (PARTE B.3) */}
            {historyWorks.length > 0 && (
              <section className="space-y-3 border-t border-white/8 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-400">Historial de trabajos</h3>
                  <span className="text-xs text-zinc-500 font-medium">{historyWorks.length} finalizados</span>
                </div>
                <div className="space-y-2">
                  {historyWorks.map((work) => {
                    const isCompleted = work.status === "completed";
                    return (
                      <div
                        key={work.id || work.work_id}
                        className="rounded-[20px] bg-white/3 border border-white/6 p-4 space-y-2 opacity-75 hover:opacity-100 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-300">{work.client_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted ? "bg-[#7C5CFF]/15 text-[#C4B5FD] border border-[#7C5CFF]/30" : "bg-white/5 text-zinc-500 border border-white/10"
                          }`}>
                            {isCompleted ? "Completado" : "Cancelado"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-1">«{work.raw_prompt}»</p>
                        {work.conversation_id && (
                          <Link
                            href={`/conversations/${work.conversation_id}`}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-white transition mt-1"
                          >
                            <MessageSquare className="size-3 text-[#7C5CFF]" /> Ver historial de chat
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: CALENDARIO Y AGENDA DE BASE DE DATOS */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            <section className="rounded-[24px] bg-[#131318] border border-white/9 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F4F3F7]">{currentMonthStr}</h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 transition cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 transition cursor-pointer"
                    title="Próximo mes"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["D", "L", "M", "M", "J", "V", "S"].map((d, idx) => (
                  <span key={idx} className="text-zinc-500 font-bold py-1">
                    {d}
                  </span>
                ))}
                {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                  const hasEvents = daysWithEvents.has(day);
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`relative py-2.5 rounded-xl font-bold transition text-xs flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-[#7C5CFF] text-white shadow-md"
                          : hasEvents
                          ? "bg-white/8 text-zinc-200 hover:bg-white/12"
                          : "text-zinc-500 hover:bg-white/4"
                      }`}
                    >
                      <span>{day}</span>
                      {hasEvents && !isSelected && (
                        <span className="size-1 rounded-full bg-[#8B6BFF] mt-1 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SECCIÓN TRABAJOS PENDIENTES DE COORDINAR (PARTE B.1) */}
            {pendingScheduleWorks.length > 0 && (
              <section className="space-y-3 rounded-[24px] bg-[#131318] border border-amber-500/30 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Pendientes de coordinar horario ({pendingScheduleWorks.length})
                    </h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {pendingScheduleWorks.map((work) => (
                    <div
                      key={work.id || work.work_id}
                      className="flex items-center justify-between rounded-[18px] bg-white/4 border border-white/8 p-3.5"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#F4F3F7] truncate">{work.client_name}</h4>
                        <p className="text-[11px] text-zinc-300 truncate">«{work.job_type}»</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30 ml-2">
                        A coordinar
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-[10.5px] font-mono tracking-wider uppercase text-zinc-500 font-semibold">
                Trabajos agendados para el día {selectedDay} ({selectedEvents.length})
              </h3>

              {selectedEvents.length === 0 ? (
                <div className="rounded-[20px] bg-[#131318] border border-white/8 p-6 text-center text-xs text-zinc-500">
                  No tenés compromisos agendados para este día.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between rounded-[18px] bg-[#131318] border border-white/8 p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#7C5CFF]/15 text-[#8B6BFF] font-bold text-xs font-mono">
                          {ev.time}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#F4F3F7] truncate">{ev.clientName}</h4>
                          <p className="text-[11px] text-zinc-300 truncate">«{ev.jobType}»</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 truncate flex items-center gap-1">
                            <MapPin className="size-3 text-[#8B6BFF]" /> {ev.address}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#3DDC84]/12 px-2.5 py-1 text-[10px] font-bold text-[#3DDC84] border border-[#3DDC84]/30 ml-2">
                        {ev.status === "confirmed" ? "Agendado" : ev.status === "in_progress" ? "En curso" : ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* MODAL: ACEPTAR Y ESTIMAR TIEMPO */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[28px] bg-[#131318] border border-white/14 p-6 space-y-6 text-[#F4F3F7] shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#F4F3F7]">Confirmar trabajo</h3>
              <p className="text-xs text-zinc-400">
                Cliente: <strong className="text-[#F4F3F7]">{selectedRequest.client_name}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
                ¿En cuánto tiempo aproximado calculás llegar / terminar?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedDuration(mins)}
                    className={`py-3 rounded-[16px] text-xs font-bold border transition cursor-pointer ${
                      estimatedDuration === mins
                        ? "bg-[#7C5CFF] border-[#8B6BFF] text-white shadow-md"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
                Fecha y Hora programada (Opcional)
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-[16px] border border-white/12 bg-[#08080A] p-3 text-xs text-[#F4F3F7] focus:outline-none focus:border-[#7C5CFF]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex-1 h-[52px] rounded-[16px] border border-white/12 bg-transparent text-sm font-bold text-zinc-400 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmWork}
                disabled={isConfirming}
                className="flex-1 h-[52px] rounded-[16px] bg-[#7C5CFF] text-sm font-bold text-white hover:bg-[#6b47ff] transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConfirming ? <Loader2 className="size-4 animate-spin" /> : "Aceptar y Notificar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROVEEDOR CANCELAR TRABAJO */}
      {showProviderCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[28px] bg-[#131318] border border-white/14 p-6 space-y-5 text-[#F4F3F7] shadow-2xl">
            <div className="space-y-1 text-center">
              <h3 className="text-base font-bold text-[#F4F3F7]">¿No podés realizar el trabajo?</h3>
              <p className="text-xs text-zinc-400">
                Se notificará al cliente y se reabrirá la solicitud para otros profesionales.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">Motivo de cancelación</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-[16px] border border-white/12 bg-[#08080A] p-3.5 text-xs text-[#F4F3F7] focus:outline-none focus:border-[#FF5A5A]"
              >
                <option value="Emergencia personal">Emergencia personal</option>
                <option value="Problemas de transporte">Problemas de transporte</option>
                <option value="Demora en trabajo previo">Demora en trabajo previo</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowProviderCancelModal(false);
                  setSelectedCancelWorkId(null);
                }}
                className="flex-1 h-[48px] rounded-[14px] border border-white/12 text-xs font-bold text-zinc-300 hover:bg-white/5 transition"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmProviderCancel}
                disabled={isCancellingWork}
                className="flex-1 h-[48px] rounded-[14px] bg-[#FF5A5A] text-xs font-bold text-white hover:bg-red-600 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isCancellingWork ? <Loader2 className="size-4 animate-spin" /> : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

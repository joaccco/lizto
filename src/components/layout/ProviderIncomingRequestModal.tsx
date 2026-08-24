"use client";

import { Calendar, Clock, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface IncomingRequest {
  id: string;
  work_id?: string;
  category: string;
  category_slug?: string;
  raw_prompt: string;
  client_name: string;
  urgency: string;
  location?: string;
  created_at?: string;
  schedule?: {
    scheduled_date: string | null;
    window_start: string | null;
    window_end: string | null;
    label: string;
  };
}

// Instancia global de AudioContext pre-desbloqueado
let globalAudioCtx: AudioContext | null = null;

export function unlockAudioContext() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume();
    }
  } catch {
    // ignore unlock error
  }
}

function calculateRelativeTime(created_at?: string): string {
  if (!created_at) return "Llegó hace instantes";
  try {
    const d = new Date(created_at);
    if (isNaN(d.getTime())) return "Llegó hace instantes";
    const diffMins = Math.max(1, Math.floor((Date.now() - d.getTime()) / (1000 * 60)));
    if (diffMins < 60) return `Llegó hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `Llegó hace ${diffHours} h`;
  } catch {
    return "Llegó hace instantes";
  }
}

export function ProviderIncomingRequestModal() {
  const { user, isAuthenticated } = useAuth();
  const [request, setRequest] = useState<IncomingRequest | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
    };
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isProvider = user.roles?.includes("provider") || user.has_provider_profile === true || (user as any).role === "provider";
    if (!isProvider) return;

    async function checkForIncomingRequests() {
      try {
        const res = await apiFetch<{ data: IncomingRequest[] }>(ENDPOINTS.WORK_REQUESTS);
        if (!res.data || res.data.length === 0) {
          setIsOpen(false);
          setRequest(null);
          return;
        }

        if (!user) return;
        const storageKey = `dismissed_provider_requests_${user.id}`;
        const dismissedIds: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");

        const pendingRequests = res.data.filter(
          (req) => !dismissedIds.includes(req.id) && (!req.work_id || !dismissedIds.includes(req.work_id))
        );

        if (pendingRequests.length === 0) {
          setIsOpen(false);
          setRequest(null);
          return;
        }

        const latestReq = pendingRequests[0];
        setRequest(latestReq);
        setIsOpen(true);
      } catch {
        // ignore fetch error
      }
    }

    checkForIncomingRequests();
    const interval = setInterval(checkForIncomingRequests, 12000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

  // Manejo del Aviso Sonoro: Se activa ÚNICAMENTE mientras el modal esté visible en pantalla
  useEffect(() => {
    if (!isOpen || !request) return;

    // Iniciar tono sonoro + vibración (con tope de 60 segundos)
    const stopChime = startIncomingChime(60);

    // Al cerrar el modal, aceptar o declinar, detener el sonido de forma inmediata
    return () => {
      stopChime();
    };
  }, [isOpen, request?.id]);

  const markAsDismissed = (reqId: string, workId?: string) => {
    if (!user) return;
    const storageKey = `dismissed_provider_requests_${user.id}`;
    const dismissedIds: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!dismissedIds.includes(reqId)) dismissedIds.push(reqId);
    if (workId && !dismissedIds.includes(workId)) dismissedIds.push(workId);
    localStorage.setItem(storageKey, JSON.stringify(dismissedIds));
  };

  const handleAccept = async () => {
    if (!request) return;
    setIsProcessing(true);
    try {
      await apiFetch(ENDPOINTS.WORK_CONFIRM(request.id), { method: "POST" });
    } catch {
      // ignore
    } finally {
      markAsDismissed(request.id, request.work_id);
      setIsOpen(false);
      setIsProcessing(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("provider-data-updated"));
      }
    }
  };

  const handleDecline = async () => {
    if (!request) return;
    setIsProcessing(true);
    try {
      await apiFetch(ENDPOINTS.WORK_DECLINE(request.id), { method: "POST" });
    } catch {
      // ignore
    } finally {
      markAsDismissed(request.id, request.work_id);
      setIsOpen(false);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !request) return null;

  const assistanceLabel = request.schedule?.label || (request.urgency === "immediate" ? "Atención inmediata" : "A coordinar");
  const isImmediate = request.urgency === "immediate";
  const relativeTime = calculateRelativeTime(request.created_at);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[28px] bg-[#131318] border border-[#7C5CFF]/40 p-6 space-y-5 text-[#F4F3F7] shadow-2xl relative overflow-hidden">
        {/* Top Header con Alerta y Tiempo Relativo de Llegada */}
        <div className="flex items-center justify-between border-b border-white/8 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A5A] opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-[#FF5A5A]"></span>
            </span>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F4F3F7]">
              ¡Nueva Solicitud Entrante!
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">{relativeTime}</span>
        </div>

        {/* Cliente y Prompt */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#C4B5FD] uppercase tracking-wider font-semibold">
              {request.category}
            </span>
            <span className="text-xs font-bold text-zinc-300">{request.client_name}</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-white/4 p-3.5 rounded-[16px] border border-white/6 italic">
            "{request.raw_prompt}"
          </p>
        </div>

        {/* Ubicación */}
        <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
          <MapPin className="size-4 text-[#8B6BFF] shrink-0" />
          <span className="truncate">{request.location || "Barrio Centro, Corrientes"}</span>
        </div>

        {/* JERARQUÍA TEMPORAL PRIMARIA: Cuándo Debe Asistir */}
        <div className={`p-4 rounded-[18px] border space-y-1 ${
          isImmediate
            ? "bg-[#FF5A5A]/14 border-[#FF5A5A]/45 text-[#FF5A5A]"
            : "bg-[#7C5CFF]/15 border-[#7C5CFF]/35 text-[#C4B5FD]"
        }`}>
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider text-zinc-300">
            <Clock className="size-3.5 text-[#A8FF35]" />
            <span>Cuándo debe asistir</span>
          </div>
          <p className="text-base font-extrabold text-white">
            {assistanceLabel}
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 flex h-[52px] items-center justify-center rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? <Loader2 className="size-5 animate-spin" /> : "Aceptar trabajo"}
          </button>

          <button
            type="button"
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex h-[52px] px-5 items-center justify-center rounded-[16px] border border-white/12 bg-transparent text-xs font-bold text-zinc-400 hover:bg-white/5 transition cursor-pointer disabled:opacity-60"
          >
            Declinar
          </button>
        </div>
      </div>
    </div>
  );
}

// Reproductor sonoro con Web Audio API y tope de 60 segundos
function startIncomingChime(durationSec: number = 60): () => void {
  if (typeof window === "undefined") return () => {};

  let stopped = false;
  let intervalId: any = null;
  let timeoutId: any = null;

  try {
    unlockAudioContext();

    const playTone = () => {
      if (stopped || !globalAudioCtx || globalAudioCtx.state !== "running") return;
      try {
        const osc = globalAudioCtx.createOscillator();
        const gain = globalAudioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, globalAudioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, globalAudioCtx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, globalAudioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(globalAudioCtx.destination);

        osc.start();
        osc.stop(globalAudioCtx.currentTime + 0.35);
      } catch {
        // ignore
      }
    };

    playTone();
    intervalId = setInterval(playTone, 1200);
  } catch {
    // ignore
  }

  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([300, 200, 300, 200, 500]);
    } catch {
      // ignore
    }
  }

  timeoutId = setTimeout(() => {
    stopped = true;
    if (intervalId) clearInterval(intervalId);
  }, durationSec * 1000);

  return () => {
    stopped = true;
    if (intervalId) clearInterval(intervalId);
    if (timeoutId) clearTimeout(timeoutId);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  };
}

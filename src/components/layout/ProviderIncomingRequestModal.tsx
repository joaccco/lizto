"use client";

import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface WorkRequestItem {
  id: string;
  service_request_id?: string;
  work_id?: string;
  conversation_id?: string;
  category: string;
  category_slug?: string;
  raw_prompt: string;
  client_name: string;
  urgency: string;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  status: string;
  created_at?: string;
}

const DynamicMapPickerContainer = dynamic(
  () => import("@/components/ui/MapPickerContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-2xl bg-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-500">
        Cargando mapa...
      </div>
    ),
  }
);

export function ProviderIncomingRequestModal() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [newRequest, setNewRequest] = useState<WorkRequestItem | null>(null);
  const [viewMode, setViewMode] = useState<"popup" | "map_detail" | null>(null);
  const [seenRequestIds, setSeenRequestIds] = useState<Set<string>>(() => new Set());
  const [isAccepting, setIsAccepting] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isProvider =
    isAuthenticated &&
    user &&
    (user.roles?.includes("provider") || user.has_provider_profile);

  // Play insistent synthesizer chime beep (2-tone beep beep repeating)
  const startSound = () => {
    stopSound();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playChimePair = () => {
        if (!ctx || ctx.state === "closed") return;
        const now = ctx.currentTime;

        // Tone 1: 880Hz
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.18);

        // Tone 2: 1046.5Hz (Higher pitch insistence)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1046.5, now + 0.12);
        gain2.gain.setValueAtTime(0.35, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.35);
      };

      playChimePair();
      soundIntervalRef.current = setInterval(playChimePair, 1300);
    } catch {
      // AudioContext blocked or unavailable
    }
  };

  const stopSound = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    if (!isProvider) return;

    let isSubscribed = true;

    const checkIncomingRequests = async () => {
      try {
        const res = await apiFetch<{ data: WorkRequestItem[] }>(
          ENDPOINTS.WORK_REQUESTS,
          { headers: { "Cache-Control": "no-store" } }
        );

        if (!isSubscribed) return;

        const items = res.data || [];
        const pendingItems = items.filter(
          (i) => i.status === "pending_confirmation" || i.status === "provider_selected" || i.status === "pending_matching"
        );

        if (pendingItems.length > 0) {
          const latest = pendingItems[0];
          if (!seenRequestIds.has(latest.id)) {
            setSeenRequestIds((prev) => new Set(prev).add(latest.id));
            setNewRequest(latest);
            setViewMode("popup");
            startSound();
          }
        }
      } catch {
        // ignore background poll errors
      }
    };

    checkIncomingRequests();
    const interval = setInterval(checkIncomingRequests, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      stopSound();
    };
  }, [isProvider, seenRequestIds]);

  const handleOpenMapDetail = () => {
    stopSound();
    setViewMode("map_detail");
  };

  const handleDismissPopup = () => {
    stopSound();
    setViewMode(null);
    setNewRequest(null);
  };

  const handleAcceptFromModal = async () => {
    if (!newRequest) return;
    setIsAccepting(true);
    stopSound();
    try {
      await apiFetch(ENDPOINTS.WORK_CONFIRM(newRequest.id), {
        method: "POST",
        body: JSON.stringify({ estimated_duration_min: 30 }),
      });
      setViewMode(null);
      setNewRequest(null);
      router.push("/provider");
    } catch {
      setViewMode(null);
      setNewRequest(null);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineFromModal = async () => {
    if (!newRequest) return;
    stopSound();
    try {
      await apiFetch(ENDPOINTS.WORK_DECLINE(newRequest.id), { method: "POST" });
    } catch {
      // ignore
    } finally {
      setViewMode(null);
      setNewRequest(null);
    }
  };

  if (!isProvider || !newRequest || !viewMode) return null;

  return (
    <>
      {/* STEP 1: POPUP BANNER OVERLAY (GLOBAL NOTIFICATION) */}
      {viewMode === "popup" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 animate-in slide-in-from-top-6 duration-300">
          <div className="rounded-[24px] bg-[#131318] border border-[#7C5CFF]/60 p-5 shadow-[0_20px_60px_rgba(124,92,255,0.45)] text-[#F4F3F7] space-y-4 relative overflow-hidden backdrop-blur-2xl">
            {/* Top Red/Purple Animated Header Bar */}
            <div className="flex items-center justify-between border-b border-white/9 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A5A] opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-[#FF5A5A]" />
                </span>
                <span className="text-[11px] font-mono tracking-widest uppercase font-extrabold text-[#FF5A5A]">
                  ¡NUEVA SOLICITUD RECIBIDA!
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-[#8B6BFF] animate-pulse" />
                <button
                  type="button"
                  onClick={handleDismissPopup}
                  className="size-7 rounded-full bg-white/6 hover:bg-white/12 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Client Info & Problem Preview */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold text-[#F4F3F7]">
                  {newRequest.client_name}
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/35 text-[#C4B5FD]">
                  {newRequest.category || "Servicio"}
                </span>
              </div>

              <p className="text-sm leading-snug text-zinc-200 font-medium italic line-clamp-2 bg-white/4 p-3 rounded-[14px] border border-white/7">
                «{newRequest.raw_prompt}»
              </p>

              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium pt-1">
                <MapPin className="size-3.5 text-[#8B6BFF]" />
                <span>{newRequest.location || "Córdoba 456, Corrientes · a 1.2 km"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenMapDetail}
                className="flex-1 h-[48px] rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-[0_10px_28px_rgba(124,92,255,0.4)] cursor-pointer"
              >
                <span>Ver en el mapa y revisar</span>
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleDismissPopup}
                className="h-[48px] px-3.5 rounded-[16px] border border-white/12 bg-transparent text-xs font-semibold text-zinc-400 hover:bg-white/5 transition"
              >
                Después
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FULL MAP & REQUEST DETAILS INSPECTION MODAL */}
      {viewMode === "map_detail" && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[28px] bg-[#131318] border border-white/14 p-6 space-y-5 text-[#F4F3F7] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10.5px] font-mono tracking-widest uppercase font-bold text-[#A78BFA]">
                  Revisar Solicitud de Trabajo
                </span>
                <h3 className="text-lg font-bold text-[#F4F3F7]">
                  Cliente: {newRequest.client_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewMode(null)}
                className="size-8 rounded-full bg-white/6 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Problem Statement Card */}
            <div className="space-y-1 bg-white/4 p-4 rounded-[18px] border border-white/8">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold">
                Problema reportado por el cliente
              </span>
              <p className="text-sm text-[#F4F3F7] font-medium italic leading-relaxed">
                «{newRequest.raw_prompt}»
              </p>
            </div>

            {/* Interactive Leaflet Map showing location */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
                Ubicación del cliente en el mapa
              </span>
              <div className="rounded-[20px] overflow-hidden border border-white/12">
                <DynamicMapPickerContainer
                  initialLat={newRequest.location_lat ?? -27.4692}
                  initialLng={newRequest.location_lng ?? -58.8306}
                  initialAddress={newRequest.location_address || newRequest.location || "Córdoba 456, Corrientes"}
                  onLocationChange={() => {}}
                />
              </div>
            </div>

            {/* Actions: Accept or Decline */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineFromModal}
                className="flex-1 h-[52px] rounded-[16px] border border-white/14 bg-transparent text-xs font-bold text-zinc-400 hover:bg-white/5 transition"
              >
                Declinar
              </button>
              <button
                type="button"
                onClick={handleAcceptFromModal}
                disabled={isAccepting}
                className="flex-1 h-[52px] rounded-[16px] bg-[#7C5CFF] text-xs font-bold text-white hover:bg-[#6b47ff] transition shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAccepting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Check className="size-4" />
                    <span>Aceptar Trabajo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

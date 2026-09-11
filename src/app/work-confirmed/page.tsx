"use client";

import { ArrowRight, Check, Home, Star, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { formatPriceRange } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";

export default function WorkConfirmedPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("accepted_provider");
      if (stored) {
        setProvider(JSON.parse(stored));
      } else {
        setProvider(null);
      }
    } catch {
      setProvider(null);
    }
  }, []);

  const providerName = provider?.name || "el profesional";
  const initials = providerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <ScreenShell className="flex flex-col justify-between py-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 size-[360px] rounded-full bg-[radial-gradient(circle,rgba(168,255,53,0.14)_0%,transparent_66%)] blur-xl pointer-events-none" />

      <div className="flex flex-1 flex-col items-center justify-center text-center pt-8 relative z-10">
        {/* Animated Check Icon */}
        <div className="size-[92px] rounded-full bg-[#A8FF35]/10 border border-[#A8FF35]/40 flex items-center justify-center mb-8 animate-[glowPulse_3s_ease-in-out_infinite]">
          <Check className="size-10 text-[#A8FF35] animate-[popIn_0.5s_cubic-bezier(0.2,0.9,0.3,1.2)_both]" />
        </div>

        {/* Header Title */}
        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-[#F4F3F7]">
          ¡Solicitud enviada!
        </h1>
        <p className="mt-3 max-w-[30ch] text-[15.5px] leading-relaxed text-zinc-400">
          {provider ? (
            <>Le avisamos a <strong className="text-[#F4F3F7]">{providerName}</strong>. Te confirmará en breve.</>
          ) : (
            <>Tu solicitud fue registrada correctamente y te avisaremos ante novedades.</>
          )}
        </p>

        {/* Accepted Provider Card */}
        {provider && (
          <div className="mt-8 w-full rounded-[20px] bg-[#131318] border border-white/9 p-4 text-left flex items-center gap-3.5 shadow-lg">
            <div className="relative size-[52px] shrink-0 overflow-hidden rounded-full bg-[#1D1D25] border border-white/10 flex items-center justify-center">
              {!imageError && provider.photo ? (
                <Image
                  src={provider.photo}
                  alt={provider.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-sm font-bold text-zinc-400">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="truncate text-base font-bold text-[#F4F3F7]">
                  {provider.name}
                </h3>
                <span className="size-3.5 rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[9px] flex items-center justify-center shrink-0">
                  ✓
                </span>
              </div>
              <p className="truncate text-xs text-zinc-400 font-medium">
                {provider.category || "Profesional"} · ★ {provider.rating?.toFixed(1) || "5.0"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                Estimado
              </div>
              <div className="text-sm font-bold text-[#F4F3F7]">
                {formatPriceRange(provider.priceMin, provider.priceMax)}
              </div>
            </div>
          </div>
        )}

        {/* System Activity Line */}
        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className="size-1.5 rounded-full bg-[#8B6BFF] animate-pulse" />
          <span>Lizto sigue trabajando por vos</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-6 w-full relative z-10">
        <button
          onClick={() => {
            const reqId = sessionStorage.getItem("service_request_id");
            if (reqId) {
              router.push(`/requests/${reqId}`);
            } else {
              router.push("/my-requests");
            }
          }}
          className="flex h-[56px] w-full items-center justify-center gap-2 rounded.xl rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-base font-bold text-white shadow-[0_14px_38px_rgba(124,92,255,0.45)] transition cursor-pointer"
        >
          <span>¿Cómo va mi solicitud?</span>
          <ArrowRight className="size-5" />
        </button>
        <button
          onClick={() => { router.refresh(); router.push("/"); }}
          className="flex h-[48px] w-full items-center justify-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <Home className="size-4" />
          <span>Volver al inicio</span>
        </button>
      </div>
    </ScreenShell>
  );
}

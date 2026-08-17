"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Check,
  Clock,
  MapPin,
  Star,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { formatPriceRange } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

function ProviderCardContent({ provider }: { provider: Provider }) {
  const [imageError, setImageError] = useState(false);
  const matchPct = (provider as any).score ? Math.round((provider as any).score * 100) : 94;

  return (
    <>
      <div className="relative h-[172px] overflow-hidden bg-[#17171E] flex items-center justify-center border-b border-white/7">
        {!imageError && provider.photo ? (
          <Image
            src={provider.photo}
            alt={`Foto de perfil de ${provider.name}`}
            fill
            sizes="(max-width: 480px) 100vw, 440px"
            className="object-cover object-[center_32%]"
            priority={provider.id === "1"}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-500">
            <User className="size-8" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-500">
              portfolio · fotos verificadas
            </span>
          </div>
        )}
        <span className="absolute left-4 bottom-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#08080A]/60 backdrop-blur-md border border-[#A8FF35]/35 text-[#A8FF35] text-[11.5px] font-semibold">
          <span className="size-1.5 rounded-full bg-[#A8FF35]" />
          Disponible hoy
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Name, rating, verification */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="truncate text-[21px] leading-snug font-bold tracking-tight text-[#F4F3F7]">
                {provider.name}
              </h3>
              {provider.isVerified !== false && (
                <span className="size-[17px] rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[10px] flex items-center justify-center shrink-0">
                  ✓
                </span>
              )}
            </div>
            <p className="text-[13.5px] text-zinc-400 font-medium">
              {provider.category || provider.specialties?.[0] || "Profesional"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[16px] font-bold text-[#F4F3F7]">
              ★ {provider.rating.toFixed(1)}
            </div>
            <div className="text-[11.5px] font-mono text-zinc-500 mt-0.5">
              {provider.reviewCount || 87} trabajos
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="line-clamp-2 text-[14px] leading-relaxed text-zinc-300">
          {provider.description || "Profesional certificado con amplia experiencia. Entrega de trabajo garantizada en tiempo y forma."}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/7">
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 mb-1">
              Distancia
            </div>
            <div className="text-[14px] font-semibold text-[#F4F3F7] flex items-center gap-1">
              <MapPin className="size-3 text-[#8B6BFF]" />
              {provider.distanceKm || "1.2"} km
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 mb-1">
              Responde en
            </div>
            <div className="text-[14px] font-semibold text-[#F4F3F7] flex items-center gap-1">
              <Clock className="size-3 text-[#8B6BFF]" />
              {provider.responseTime || "~10 min"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 mb-1">
              Rango
            </div>
            <div className="text-[14px] font-semibold text-[#F4F3F7]">
              {formatPriceRange(provider.priceMin, provider.priceMax)}
            </div>
          </div>
        </div>

        {/* Compatibility Ring & Reason */}
        <div className="flex items-center gap-3">
          <div
            className="size-11 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `conic-gradient(#7C5CFF 0 ${matchPct}%, rgba(255,255,255,0.09) ${matchPct}% 100%)`,
            }}
          >
            <div className="size-[34px] rounded-full bg-[#131318] flex items-center justify-center text-[11px] font-bold text-[#C4B5FD]">
              {matchPct}%
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-mono tracking-wider uppercase text-[#A78BFA] mb-0.5">
              Por qué Lizto te lo recomienda
            </div>
            <div className="text-[14px] font-semibold text-[#F4F3F7]">
              {matchPct}% compatible con tu pedido
            </div>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="px-3 py-1.5 rounded-full bg-[#7C5CFF]/14 border border-[#7C5CFF]/30 text-[#C4B5FD] text-[11.5px] font-mono">
            Disponible hoy
          </span>
          <span className="px-3 py-1.5 rounded-full bg-[#7C5CFF]/14 border border-[#7C5CFF]/30 text-[#C4B5FD] text-[11.5px] font-mono">
            Experiencia en el rubro
          </span>
          <span className="px-3 py-1.5 rounded-full bg-[#7C5CFF]/14 border border-[#7C5CFF]/30 text-[#C4B5FD] text-[11.5px] font-mono">
            Cerca tuyo
          </span>
        </div>
      </div>
    </>
  );
}

interface SwipeableCardProps {
  provider: Provider;
  onAccept: () => void;
  onReject: () => void;
}

function SwipeableCard({ provider, onAccept, onReject }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-8, 8]);
  const acceptOpacity = useTransform(x, [20, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [-100, -20], [1, 0]);

  return (
    <motion.article
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 90) onAccept();
        if (info.offset.x < -90) onReject();
      }}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: x.get() >= 0 ? 180 : -180, scale: 0.96 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="absolute inset-x-0 top-0 z-30 cursor-grab touch-pan-y overflow-hidden rounded-[20px] border border-white/9 bg-[#131318] active:cursor-grabbing shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
    >
      <motion.div
        style={{ opacity: rejectOpacity }}
        className="pointer-events-none absolute top-5 left-5 z-20 flex items-center gap-1 rounded-full bg-[#08080A] border border-white/15 px-3 py-1.5 text-xs font-bold text-white"
      >
        <X className="size-3.5" /> PASAR
      </motion.div>
      <motion.div
        style={{ opacity: acceptOpacity }}
        className="pointer-events-none absolute top-5 right-5 z-20 flex items-center gap-1 rounded-full bg-[#7C5CFF] px-3 py-1.5 text-xs font-bold text-white shadow-lg"
      >
        <Check className="size-3.5" /> ELEGIR
      </motion.div>
      <ProviderCardContent provider={provider} />
    </motion.article>
  );
}

interface CardStackProps {
  cards: Provider[];
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

export function CardStack({
  cards,
  onAccept,
  onReject,
  className,
}: CardStackProps) {
  if (cards.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[480px] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-[#131318] px-8 text-center",
          className
        )}
      >
        <p className="text-base font-bold text-[#F4F3F7]">
          Viste todos los perfiles
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Podés recuperar el último o ajustar tu búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-[530px]", className)}>
      {cards.slice(1, 3).map((provider, index) => (
        <div
          key={provider.id}
          className="absolute inset-x-3 top-0 h-[520px] rounded-[20px] border border-white/7 bg-[#131318]"
          style={{
            transform: `translateY(${(index + 1) * 8}px) scale(${1 - (index + 1) * 0.025})`,
            opacity: 1 - index * 0.25,
            zIndex: 20 - index,
          }}
        />
      ))}
      <AnimatePresence mode="popLayout">
        <SwipeableCard
          key={cards[0].id}
          provider={cards[0]}
          onAccept={onAccept}
          onReject={onReject}
        />
      </AnimatePresence>
    </div>
  );
}

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

import { formatPriceRange } from "@/lib/format";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProviderCardContentProps {
  provider: Provider;
  onAccept?: () => void;
  onOpenProfile?: (provider: Provider) => void;
}

function ProviderCardContent({ provider, onAccept, onOpenProfile }: ProviderCardContentProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col h-full w-full justify-between">
      {/* 1. Header con foto de perfil ampliada (210px) */}
      <div className="relative h-[210px] w-full shrink-0 overflow-hidden bg-[#17171E] flex items-center justify-center border-b border-white/8">
        {!imageError && provider.photo ? (
          <Image
            src={provider.photo}
            alt={`Foto de perfil de ${provider.name}`}
            fill
            sizes="(max-width: 480px) 100vw, 440px"
            className="object-cover object-center"
            priority={provider.id === "1"}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-500">
            <User className="size-10 text-zinc-400" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-500">
              foto verificada
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131318] via-transparent to-transparent opacity-85" />
        <span className="absolute left-3.5 bottom-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#08080A]/75 backdrop-blur-md border border-[#A8FF35]/40 text-[#A8FF35] text-[11px] font-semibold">
          <span className="size-1.5 rounded-full bg-[#A8FF35]" />
          Disponible hoy
        </span>
      </div>

      {/* 2. Cuerpo de la tarjeta con distribución vertical uniforme */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Nombre, rubro, verificado y calificación */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="truncate text-[20px] leading-snug font-extrabold tracking-tight text-[#F4F3F7]">
                {provider.name}
              </h3>
              {provider.isVerified !== false && (
                <span className="size-[17px] rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[10px] flex items-center justify-center shrink-0">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              {provider.category || provider.specialties?.[0] || "Profesional verificado"}
            </p>
          </div>
          <div className="text-right shrink-0">
            {provider.rating && (provider.reviewCount ?? 0) > 0 ? (
              <>
                <div className="text-[15px] font-extrabold text-[#F4F3F7]">
                  ★ {provider.rating.toFixed(1)}
                </div>
                <div className="text-[10.5px] font-mono text-zinc-500 mt-0.5">
                  {provider.reviewCount} reseñas
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold text-[#A78BFA] px-2 py-0.5 rounded bg-[#7C5CFF]/15 border border-[#7C5CFF]/25">
                  Nuevo
                </div>
                <div className="text-[10.5px] font-mono text-zinc-500 mt-0.5">
                  Sin reseñas
                </div>
              </>
            )}
          </div>
        </div>

        {/* Descripción / Bio */}
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">
          {provider.description || "Profesional certificado con amplia experiencia. Entrega de trabajo garantizada en tiempo y forma."}
        </p>

        {/* Métricas: Distancia, Tiempo de Respuesta, Precio Estimado */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-white/8 bg-white/3 rounded-xl px-3">
          <div>
            <div className="text-[9px] font-mono tracking-wider uppercase text-zinc-500 mb-0.5">
              Distancia
            </div>
            <div className="text-xs font-bold text-[#F4F3F7] flex items-center gap-1">
              <MapPin className="size-3 text-[#8B6BFF]" />
              {provider.distanceKm || "1.2"} km
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono tracking-wider uppercase text-zinc-500 mb-0.5">
              Responde en
            </div>
            <div className="text-xs font-bold text-[#F4F3F7] flex items-center gap-1">
              <Clock className="size-3 text-[#8B6BFF]" />
              {provider.responseTime || "~10 min"}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono tracking-wider uppercase text-zinc-500 mb-0.5">
              Estimado
            </div>
            <div className="text-xs font-extrabold text-[#3DDC84]">
              {formatPriceRange(provider.priceMin, provider.priceMax)}
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 pt-0.5">
          {onOpenProfile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfile(provider);
              }}
              className="flex-1 flex h-[46px] items-center justify-center gap-1.5 rounded-xl border border-white/14 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-200 transition cursor-pointer"
            >
              <User className="size-3.5 text-[#8B6BFF]" />
              <span>Ver perfil</span>
            </button>
          )}

          {onAccept && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="flex-1 flex h-[46px] items-center justify-center gap-1.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6b47ff] text-xs font-bold text-white shadow-md transition cursor-pointer"
            >
              <Check className="size-3.5" />
              <span>Elegir profesional</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SwipeableCardProps {
  provider: Provider;
  onAccept: () => void;
  onReject: () => void;
  onOpenProfile?: (provider: Provider) => void;
}

function SwipeableCard({ provider, onAccept, onReject, onOpenProfile }: SwipeableCardProps) {
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
      className="absolute inset-x-0 top-0 h-[480px] z-30 cursor-grab touch-pan-y overflow-hidden rounded-[24px] border border-white/12 bg-[#131318] active:cursor-grabbing shadow-[0_24px_50px_rgba(0,0,0,0.55)] flex flex-col justify-between"
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
      <ProviderCardContent provider={provider} onAccept={onAccept} onOpenProfile={onOpenProfile} />
    </motion.article>
  );
}

interface CardStackProps {
  cards: Provider[];
  onAccept: () => void;
  onReject: () => void;
  onOpenProfile?: (provider: Provider) => void;
  className?: string;
}

export function CardStack({
  cards,
  onAccept,
  onReject,
  onOpenProfile,
  className,
}: CardStackProps) {
  if (cards.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[480px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-[#131318] px-8 text-center",
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
    <div className={cn("relative h-[480px] w-full", className)}>
      {cards.slice(1, 3).map((provider, index) => (
        <div
          key={provider.id}
          className="absolute inset-x-2 top-0 h-[470px] rounded-[24px] border border-white/8 bg-[#131318]"
          style={{
            transform: `translateY(${(index + 1) * 6}px) scale(${1 - (index + 1) * 0.025})`,
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
          onOpenProfile={onOpenProfile}
        />
      </AnimatePresence>
    </div>
  );
}

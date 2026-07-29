"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  BadgeCheck,
  Check,
  Clock3,
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

  return (
    <>
      <div className="relative h-[190px] overflow-hidden bg-zinc-100 dark:bg-zinc-700">
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
          <div className="flex size-full items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
            <User className="size-16" />
          </div>
        )}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-zinc-900/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {provider.nextAvailability}
        </div>
      </div>

      <div className="space-y-3.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                {provider.name}
              </h3>
              {provider.isVerified ? (
                <BadgeCheck className="size-4 shrink-0 fill-[#4F46E5] text-white" />
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {provider.category} · {provider.neighborhood}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2 py-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {provider.rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              ({provider.reviewCount})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {provider.specialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full bg-zinc-100 dark:bg-zinc-700/60 px-2.5 py-1 text-[10px] font-medium text-zinc-600 dark:text-zinc-300"
            >
              {specialty}
            </span>
          ))}
        </div>

        <p className="line-clamp-2 text-[13px] leading-5 text-zinc-600 dark:text-zinc-300">
          {provider.description}
        </p>

        <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-700 border-t border-zinc-200 dark:border-zinc-700 pt-3">
          <div className="pr-2">
            <p className="text-[9px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
              Estimado
            </p>
            <p className="mt-1 text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
              {formatPriceRange(provider.priceMin, provider.priceMax)}
            </p>
          </div>
          <div className="px-3">
            <p className="text-[9px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
              Responde
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Clock3 className="size-3 text-zinc-400" />
              {provider.responseTime}
            </p>
          </div>
          <div className="pl-3">
            <p className="text-[9px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
              Distancia
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <MapPin className="size-3 text-zinc-400" />
              {provider.distanceKm} km
            </p>
          </div>
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
      className="absolute inset-x-0 top-0 z-30 cursor-grab touch-pan-y overflow-hidden rounded-[24px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 active:cursor-grabbing"
    >
      <motion.div
        style={{ opacity: rejectOpacity }}
        className="pointer-events-none absolute top-5 left-5 z-20 flex items-center gap-1 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white"
      >
        <X className="size-3.5" /> PASAR
      </motion.div>
      <motion.div
        style={{ opacity: acceptOpacity }}
        className="pointer-events-none absolute top-5 right-5 z-20 flex items-center gap-1 rounded-full bg-[#4F46E5] px-3 py-1.5 text-xs font-bold text-white"
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
          "flex h-[480px] flex-col items-center justify-center rounded-[24px] border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-8 text-center",
          className
        )}
      >
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Viste todos los perfiles
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
          Podés recuperar el último o ajustar tu búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative h-[480px]", className)}>
      {cards.slice(1, 3).map((provider, index) => (
        <div
          key={provider.id}
          className="absolute inset-x-3 top-0 h-[470px] rounded-[24px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
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

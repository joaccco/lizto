"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Clock3, Star } from "lucide-react";

import { formatPriceRange } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProviderCardContentProps {
  provider: Provider;
}

function ProviderCardContent({ provider }: ProviderCardContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-semibold text-[#4F46E5]">
          {provider.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              {provider.name}
            </h3>
            {provider.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                <BadgeCheck className="size-3" />
                Verificado
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500">{provider.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2">
          <div className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {provider.rating.toFixed(1)}
          </div>
          <p className="text-[10px] text-gray-500">{provider.reviewCount} reseñas</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2">
          <p className="text-sm font-semibold text-gray-900">
            {provider.jobsCompleted}
          </p>
          <p className="text-[10px] text-gray-500">trabajos</p>
        </div>
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2">
          <div className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
            <Clock3 className="size-3.5 text-gray-500" />
            {provider.responseTime}
          </div>
          <p className="text-[10px] text-gray-500">respuesta</p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-5 text-gray-600">
        {provider.description}
      </p>

      <div className="flex items-end justify-between gap-3 border-t border-[#E5E7EB] pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">
            Precio estimado
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {formatPriceRange(provider.priceMin, provider.priceMax)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">
            Disponibilidad
          </p>
          <p className="text-sm font-medium text-[#4F46E5]">
            {provider.nextAvailability}
          </p>
        </div>
      </div>
    </div>
  );
}

interface CardStackProps {
  cards: Provider[];
  className?: string;
}

export function CardStack({ cards, className }: CardStackProps) {
  if (cards.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white text-sm text-gray-500",
          className
        )}
      >
        No hay más profesionales para mostrar
      </div>
    );
  }

  return (
    <div className={cn("relative h-[360px]", className)}>
      <AnimatePresence mode="popLayout">
        {cards
          .slice()
          .reverse()
          .map((provider, reverseIndex) => {
            const depth = cards.length - 1 - reverseIndex;
            const isActive = depth === 0;

            return (
              <motion.div
                key={provider.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{
                  opacity: isActive ? 1 : depth === 1 ? 0.7 : 0.45,
                  y: depth * 14,
                  scale: isActive ? 1 : depth === 1 ? 0.95 : 0.9,
                }}
                exit={{ opacity: 0, x: 120, scale: 0.95 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={cn(
                  "absolute inset-x-0 top-0 rounded-2xl border border-[#E5E7EB] bg-white p-4",
                  isActive ? "z-30" : depth === 1 ? "z-20" : "z-10"
                )}
              >
                <ProviderCardContent provider={provider} />
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { CheckCircle2, SearchX, Star, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { formatPriceRange } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";

interface RecommendScreenProps {
  provider: Provider | null;
  onAccept: () => Promise<void>;
  onShowAllOptions: () => void;
  isLoading?: boolean;
}

export function RecommendScreen({
  provider,
  onAccept,
  onShowAllOptions,
  isLoading = false,
}: RecommendScreenProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const handleSelect = async () => {
    setIsSubmitting(true);
    try {
      await onAccept();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotice = () => {
    setSavedNotification(true);
  };

  return (
    <ScreenShell className="py-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider">
          Urgencia Inmediata
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center text-sm text-zinc-500">
            Buscando al profesional más cercano...
          </div>
        </div>
      ) : !provider ? (
        /* CAMBIO 4: ESTADO VACÍO CUANDO NO HAY PROFESIONALES */
        <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-4">
          <SearchX className="size-12 text-zinc-400" />
          <h2 className="text-[20px] font-semibold text-zinc-950 dark:text-zinc-100">
            Todavía no tenemos este servicio en tu zona
          </h2>
          <p className="text-[16px] leading-6 text-zinc-500 dark:text-zinc-400 max-w-sm">
            Guardamos tu solicitud y te avisamos cuando tengamos profesionales disponibles cerca tuyo.
          </p>

          {savedNotification ? (
            <div className="w-full rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Listo. Te avisamos cuando tengamos alguien disponible.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSaveNotice}
              className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-[#4F46E5] text-base font-semibold text-white transition hover:bg-indigo-700 shadow-sm"
            >
              Guardar y recibir aviso
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/search")}
            className="flex h-[52px] w-full items-center justify-center rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Buscar otro servicio
          </button>
        </div>
      ) : (
        /* RECOMMEND CARD */
        <div className="space-y-6">
          {/* HEADER */}
          <div className="space-y-1">
            <h1 className="text-[20px] font-semibold text-zinc-950 dark:text-zinc-100">
              Encontramos al mejor disponible ahora
            </h1>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400">
              Basado en distancia, disponibilidad y reputación.
            </p>
          </div>

          {/* CARD DEL PROFESIONAL RECOMENDADO */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            {/* Avatar 96px */}
            <div className="relative size-[96px] rounded-full overflow-hidden border-2 border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              {imageError ? (
                <span className="text-2xl font-bold text-[#4F46E5]">
                  {provider.initials}
                </span>
              ) : (
                <Image
                  src={provider.photo}
                  alt={provider.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            {/* Nombre 24px */}
            <div>
              <h2 className="text-[24px] font-semibold text-zinc-950 dark:text-zinc-100">
                {provider.name}
              </h2>
              {/* Badge Disponible Ahora */}
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>Disponible ahora</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-base">{provider.rating.toFixed(1)}</span>
              </div>
              <span className="text-zinc-400">•</span>
              <span>{provider.reviewCount} reseñas</span>
            </div>

            {/* Distancia y ETA 16px destacado */}
            <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 px-4 py-2.5 text-[16px] font-semibold text-[#4F46E5] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
              A {provider.distanceKm} km • llega en ~{provider.etaMinutes} min
            </div>

            {/* Specialties Chips */}
            {provider.specialties && provider.specialties.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {provider.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}

            {/* Precio estimado */}
            {provider.priceMin !== undefined && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Precio estimado:{" "}
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatPriceRange(provider.priceMin, provider.priceMax)}
                </strong>
              </div>
            )}

            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              El mejor calificado disponible más cerca tuyo
            </p>
          </div>

          {/* BUTTONS */}
          <div className="space-y-3 pt-2">
            {/* BOTÓN PRINCIPAL 64px */}
            <button
              type="button"
              onClick={handleSelect}
              disabled={isSubmitting}
              className="flex h-[64px] w-full items-center justify-center rounded-2xl bg-[#4F46E5] text-lg font-semibold text-white transition hover:bg-indigo-700 shadow-md disabled:opacity-60"
            >
              Elegir a {provider.name.split(" ")[0]}
            </button>

            {/* BOTÓN SECUNDARIO 56px */}
            <button
              type="button"
              onClick={onShowAllOptions}
              className="flex h-[56px] w-full items-center justify-center rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Ver otras opciones disponibles
            </button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

"use client";

import { CheckCircle2, Star, User, ArrowRight, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { formatPriceRange, MOCK_PROVIDERS } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";

export default function WorkConfirmedPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("accepted_provider");
      if (stored) {
        setProvider(JSON.parse(stored));
      } else {
        setProvider(MOCK_PROVIDERS[0]);
      }
    } catch {
      setProvider(MOCK_PROVIDERS[0]);
    }
  }, []);

  const providerName = provider?.name || "el profesional";

  return (
    <ScreenShell className="flex flex-col justify-between py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {/* Animated Check Icon */}
        <div className="flex size-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-12" />
        </div>

        {/* Header Title */}
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
          ¡Solicitud enviada!
        </h1>
        <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
          Le avisamos a <span className="font-semibold text-zinc-800 dark:text-zinc-200">{providerName}</span>. Te confirmará en breve.
        </p>

        {/* Accepted Provider Card */}
        {provider && (
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 text-left shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-700">
                {!imageError && provider.photo ? (
                  <Image
                    src={provider.photo}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-zinc-400">
                    <User className="size-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-zinc-950 dark:text-zinc-100">
                  {provider.name}
                </h3>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {provider.category}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{provider.rating?.toFixed(1) || "5.0"}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    ({provider.reviewCount || 0} reseñas)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-100 dark:border-zinc-700/60 pt-3 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Precio estimado:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPriceRange(provider.priceMin, provider.priceMax)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-6 w-full">
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <span>Ver estado</span>
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          <Home className="size-4" />
          <span>Volver al inicio</span>
        </Link>
      </div>
    </ScreenShell>
  );
}

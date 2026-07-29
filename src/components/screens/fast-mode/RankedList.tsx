import {
  BadgeCheck,
  ChevronRight,
  MapPin,
  MessageCircle,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatPriceRange } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RankedListProps {
  providers: Provider[];
  className?: string;
}

export function RankedList({ providers, className }: RankedListProps) {
  const [topProvider, ...alternatives] = providers;

  return (
    <div className={cn("space-y-5", className)}>
      <article className="overflow-hidden rounded-[24px] border border-indigo-200 bg-white">
        <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Mejor opción disponible
          </span>
          <span className="text-[11px] font-medium text-indigo-500">
            #{1}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3.5">
            <div className="relative size-[88px] shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
              <Image
                src={topProvider.photo}
                alt={`Foto de ${topProvider.name}`}
                fill
                sizes="88px"
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-base font-semibold text-zinc-950">
                  {topProvider.name}
                </h2>
                <BadgeCheck className="size-4 shrink-0 fill-[#4F46E5] text-white" />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {topProvider.category} · {topProvider.neighborhood}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {topProvider.rating.toFixed(1)}
                  <span className="font-normal text-zinc-400">
                    ({topProvider.reviewCount})
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <MapPin className="size-3.5" />
                  {topProvider.distanceKm} km
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-zinc-50 p-3">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                Puede llegar en
              </p>
              <p className="mt-0.5 text-xl font-semibold tracking-tight text-emerald-700">
                ~{topProvider.etaMinutes} min
              </p>
            </div>
            <div className="border-l border-zinc-200 pl-3">
              <p className="text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
                Precio estimado
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-800">
                {formatPriceRange(topProvider.priceMin, topProvider.priceMax)}
              </p>
            </div>
          </div>

          <Link
            href={`/chat/${topProvider.id}`}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <MessageCircle className="size-4" />
            Contactar ahora
          </Link>
          <p className="mt-2 text-center text-[10px] text-zinc-400">
            Primero confirmás el precio y la llegada.
          </p>
        </div>
      </article>

      {alternatives.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              Otras opciones cercanas
            </h3>
            <span className="text-[11px] text-zinc-400">
              {alternatives.length} disponibles
            </span>
          </div>
          <div className="space-y-2.5">
            {alternatives.map((provider, index) => (
              <Link
                key={provider.id}
                href={`/chat/${provider.id}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-indigo-200"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  <Image
                    src={provider.photo}
                    alt={`Foto de ${provider.name}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400">
                      #{index + 2}
                    </span>
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {provider.name}
                    </p>
                    {provider.isVerified ? (
                      <BadgeCheck className="size-3.5 shrink-0 fill-[#4F46E5] text-white" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    ★ {provider.rating.toFixed(1)} · {provider.distanceKm} km ·{" "}
                    {provider.neighborhood}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-700">
                    ~{provider.etaMinutes} min
                  </p>
                  <ChevronRight className="mt-1 ml-auto size-4 text-zinc-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

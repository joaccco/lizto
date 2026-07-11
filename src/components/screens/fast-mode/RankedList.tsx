import { BadgeCheck, MapPin, Star, Zap } from "lucide-react";

import { formatPriceRange } from "@/lib/mock-data";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RankedListProps {
  providers: Provider[];
  className?: string;
}

export function RankedList({ providers, className }: RankedListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {providers.map((provider, index) => {
        const rank = index + 1;
        const isTopPick = rank === 1;

        return (
          <article
            key={provider.id}
            className={cn(
              "rounded-2xl border bg-white p-4",
              isTopPick
                ? "border-2 border-[#4F46E5]"
                : "border-[#E5E7EB]"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isTopPick
                    ? "bg-[#4F46E5] text-white"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {rank}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {provider.name}
                  </h3>
                  {isTopPick ? (
                    <span className="rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-medium text-[#4F46E5]">
                      Top pick
                    </span>
                  ) : null}
                  {provider.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700">
                      <BadgeCheck className="size-3" />
                      Verificado
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {provider.distanceKm} km
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {provider.rating.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-green-700">
                    <Zap className="size-3" />
                    ~{provider.etaMinutes} min
                  </span>
                </div>

                <p className="text-sm font-medium text-gray-900">
                  Desde {formatPriceRange(provider.priceMin, provider.priceMax)}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

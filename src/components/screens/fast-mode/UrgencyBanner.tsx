import { LocateFixed } from "lucide-react";

import { cn } from "@/lib/utils";

interface UrgencyBannerProps {
  className?: string;
}

export function UrgencyBanner({ className }: UrgencyBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-indigo-100 bg-[#F1F0FF] px-4 py-3.5",
        className
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#4F46E5]">
        <LocateFixed className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-indigo-950">
          Encontramos ayuda cerca
        </p>
        <p className="mt-0.5 text-xs leading-5 text-indigo-700">
          Ordenamos por llegada, disponibilidad y reputación.
        </p>
      </div>
    </div>
  );
}

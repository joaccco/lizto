import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

interface UrgencyBannerProps {
  className?: string;
}

export function UrgencyBanner({ className }: UrgencyBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-red-200 bg-[#FEF2F2] px-4 py-3",
        className
      )}
    >
      <Zap className="mt-0.5 size-4 shrink-0 text-red-600" />
      <p className="text-sm text-red-900">
        <span className="font-medium">Modo urgente.</span> Los más cercanos
        disponibles ahora.
      </p>
    </div>
  );
}

import { Pencil, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface AIInterpretationBannerProps {
  summary: string;
  className?: string;
}

export function AIInterpretationBanner({
  summary,
  className,
}: AIInterpretationBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-indigo-100 bg-[#F1F0FF] px-3.5 py-3",
        className
      )}
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-[#4F46E5]" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wide text-indigo-500 uppercase">
          Entendimos tu pedido
        </p>
        <p className="mt-0.5 text-sm leading-5 font-medium text-indigo-950">
          {summary}
        </p>
      </div>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-100"
        aria-label="Ajustar pedido"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}

"use client";

import { Check, RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface SwipeActionsProps {
  onAccept: () => void;
  onReject: () => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
  className?: string;
}

export function SwipeActions({
  onAccept,
  onReject,
  onUndo,
  canUndo,
  disabled = false,
  className,
}: SwipeActionsProps) {
  return (
    <div className={cn("grid grid-cols-3 items-start gap-4 px-4", className)}>
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onReject}
          disabled={disabled}
          className="flex size-13 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
          aria-label="Descartar profesional"
        >
          <X className="size-5" />
        </button>
        <span className="text-[10px] font-medium text-zinc-400">Pasar</span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className="flex size-11 items-center justify-center rounded-full border border-zinc-200 bg-transparent text-zinc-500 transition hover:bg-white disabled:opacity-30"
          aria-label="Recuperar profesional anterior"
        >
          <RotateCcw className="size-4" />
        </button>
        <span className="text-[10px] font-medium text-zinc-400">Volver</span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onAccept}
          disabled={disabled}
          className="flex size-13 items-center justify-center rounded-full bg-[#4F46E5] text-white transition hover:bg-indigo-700 disabled:opacity-40"
          aria-label="Elegir profesional"
        >
          <Check className="size-5" />
        </button>
        <span className="text-[10px] font-semibold text-[#4F46E5]">Elegir</span>
      </div>
    </div>
  );
}

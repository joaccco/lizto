"use client";

import { ArrowRight, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeActionsProps {
  onAccept: () => void;
  onReject: () => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled?: boolean;
  providerFirstName?: string;
  className?: string;
}

export function SwipeActions({
  onAccept,
  onReject,
  onUndo,
  canUndo,
  disabled = false,
  providerFirstName = "profesional",
  className,
}: SwipeActionsProps) {
  return (
    <div className={cn("flex items-center gap-3 w-full pt-2", className)}>
      <button
        type="button"
        onClick={onReject}
        disabled={disabled}
        className="size-[56px] rounded-[18px] flex items-center justify-center bg-gradient-to-b from-white/10 to-white/[0.035] backdrop-blur-xl border border-white/13 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] text-zinc-300 hover:text-white hover:bg-white/15 transition cursor-pointer disabled:opacity-40 shrink-0"
        aria-label="Pasar"
      >
        <X className="size-5" />
      </button>

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || disabled}
        className="size-[56px] rounded-[18px] flex items-center justify-center bg-gradient-to-b from-white/10 to-white/[0.035] backdrop-blur-xl border border-white/13 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] text-zinc-300 hover:text-white hover:bg-white/15 transition cursor-pointer disabled:opacity-30 shrink-0"
        aria-label="Volver"
      >
        <RotateCcw className="size-4" />
      </button>

      <button
        type="button"
        onClick={onAccept}
        disabled={disabled}
        className="flex-1 h-[56px] rounded-[18px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-white font-bold text-base flex items-center justify-center gap-2 transition shadow-[0_14px_38px_rgba(124,92,255,0.45)] cursor-pointer disabled:opacity-40"
      >
        <span>Elegir a {providerFirstName}</span>
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

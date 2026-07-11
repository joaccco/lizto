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
    <div className={cn("flex items-center justify-center gap-5", className)}>
      <button
        type="button"
        onClick={onReject}
        disabled={disabled}
        className="flex size-14 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 disabled:opacity-40"
        aria-label="Rechazar"
      >
        <X className="size-6" />
      </button>

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || disabled}
        className="flex size-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-gray-600 disabled:opacity-40"
        aria-label="Deshacer"
      >
        <RotateCcw className="size-5" />
      </button>

      <button
        type="button"
        onClick={onAccept}
        disabled={disabled}
        className="flex size-14 items-center justify-center rounded-full border border-[#C7D2FE] bg-[#4F46E5] text-white disabled:opacity-40"
        aria-label="Aceptar"
      >
        <Check className="size-6" />
      </button>
    </div>
  );
}

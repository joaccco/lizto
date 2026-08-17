"use client";

import { cn } from "@/lib/utils";
import type { Urgency } from "@/lib/types";

interface UrgencyChipOption {
  value: Urgency;
  label: string;
}

const URGENCY_CHIPS: UrgencyChipOption[] = [
  { value: "immediate", label: "Ahora mismo" },
  { value: "today", label: "Hoy" },
  { value: "scheduled", label: "Lo planifico" },
];

interface UrgencyChipsProps {
  value: Urgency;
  onChange: (value: Urgency) => void;
  className?: string;
}

export function UrgencyChips({ value, onChange, className }: UrgencyChipsProps) {
  return (
    <div className={cn("flex gap-1.5 p-1.5 rounded-[16px] bg-white/5 border border-white/9 w-full", className)}>
      {URGENCY_CHIPS.map((chip) => {
        const isActive = value === chip.value;

        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={cn(
              "flex-1 h-[44px] rounded-[12px] flex items-center justify-center text-[13.5px] font-semibold transition-all duration-200 cursor-pointer",
              isActive
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] text-[#F4F3F7]"
                : "text-zinc-400 hover:text-white"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

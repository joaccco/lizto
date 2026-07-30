"use client";

import { Zap, Sun, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Urgency } from "@/lib/types";

interface UrgencyChipOption {
  value: Urgency;
  label: string;
  icon: typeof Zap;
}

const URGENCY_CHIPS: UrgencyChipOption[] = [
  { value: "immediate", label: "Ahora mismo", icon: Zap },
  { value: "today", label: "Hoy", icon: Sun },
  { value: "scheduled", label: "Lo planifico", icon: Calendar },
];

interface UrgencyChipsProps {
  value: Urgency;
  onChange: (value: Urgency) => void;
  className?: string;
}

export function UrgencyChips({ value, onChange, className }: UrgencyChipsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 flex-wrap", className)}>
      {URGENCY_CHIPS.map((chip) => {
        const Icon = chip.icon;
        const isActive = value === chip.value;

        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={cn(
              "flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-semibold border transition-all shadow-sm",
              isActive
                ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900"
                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
            )}
          >
            <Icon className={cn("size-3.5", isActive ? "text-[#4F46E5] dark:text-indigo-300" : "text-zinc-400")} />
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}

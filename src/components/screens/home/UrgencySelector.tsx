"use client";

import { Calendar, Sun, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Urgency } from "@/lib/types";

interface UrgencyOption {
  value: Urgency;
  label: string;
  icon: typeof Zap;
  hint: string;
}

const URGENCY_OPTIONS: UrgencyOption[] = [
  {
    value: "immediate",
    label: "Ahora",
    icon: Zap,
    hint: "Lo antes posible",
  },
  {
    value: "today",
    label: "Hoy",
    icon: Sun,
    hint: "En el día",
  },
  {
    value: "scheduled",
    label: "Programar",
    icon: Calendar,
    hint: "Elegir fecha",
  },
];

interface UrgencySelectorProps {
  value: Urgency;
  onChange: (value: Urgency) => void;
  className?: string;
}

export function UrgencySelector({
  value,
  onChange,
  className,
}: UrgencySelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {URGENCY_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-16 flex-col items-start justify-center gap-1 rounded-2xl border px-3 py-2.5 text-left transition-colors",
              isActive
                ? "border-zinc-950 bg-zinc-950 text-white"
                : "border-[#E4E4E0] bg-white text-zinc-600 hover:border-zinc-300"
            )}
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Icon className={cn("size-3.5", option.value === "immediate" && !isActive ? "text-red-500" : "")} />
              {option.label}
            </span>
            <span className={cn("text-[10px]", isActive ? "text-zinc-300" : "text-zinc-400")}>
              {option.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

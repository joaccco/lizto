"use client";

import { Calendar, Sun, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Urgency } from "@/lib/types";

interface UrgencyOption {
  value: Urgency;
  label: string;
  icon: typeof Zap;
  activeClassName: string;
}

const URGENCY_OPTIONS: UrgencyOption[] = [
  {
    value: "immediate",
    label: "Ahora",
    icon: Zap,
    activeClassName: "border-red-200 bg-red-50 text-red-700",
  },
  {
    value: "today",
    label: "Hoy",
    icon: Sun,
    activeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    value: "scheduled",
    label: "Programar",
    icon: Calendar,
    activeClassName: "border-[#C7D2FE] bg-[#EEF2FF] text-[#4F46E5]",
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
    <div className={cn("flex gap-2", className)}>
      {URGENCY_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? option.activeClassName
                : "border-[#E5E7EB] bg-white text-gray-600"
            )}
          >
            <Icon className="size-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

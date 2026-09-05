"use client";

import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import type { KycStatus } from "@/lib/types";

interface KycBadgeProps {
  status: KycStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const BADGE_CONFIG = {
  verified: {
    label: "Identidad Verificada",
    shortLabel: "Verificado",
    icon: CheckCircle2,
    badgeClasses: "bg-[#3DDC84]/15 border-[#3DDC84]/40 text-[#3DDC84]",
    glowClasses: "",
  },
  pending: {
    label: "En Revisión",
    shortLabel: "Pendiente",
    icon: Clock,
    badgeClasses: "bg-[#7C5CFF]/18 border-[#7C5CFF]/45 text-[#C4B5FD]",
    glowClasses: "animate-glowPulse",
  },
  rejected: {
    label: "Documentación Rechazada",
    shortLabel: "Rechazado",
    icon: AlertTriangle,
    badgeClasses: "bg-[#FF5A5A]/18 border-[#FF5A5A]/45 text-[#FF5A5A]",
    glowClasses: "animate-glowPulse",
  },
  unverified: {
    label: "Sin Verificar",
    shortLabel: "Sin verificar",
    icon: ShieldAlert,
    badgeClasses: "bg-[#F2B441]/15 border-[#F2B441]/40 text-[#F2B441]",
    glowClasses: "",
  },
};

export function KycBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: KycBadgeProps) {
  const config = BADGE_CONFIG[status] || BADGE_CONFIG.unverified;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[10px]",
    md: "px-3.5 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  }[size];

  const iconSizes = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  }[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-mono font-bold uppercase tracking-wider
        ${config.badgeClasses}
        ${config.glowClasses}
        ${sizeClasses}
        ${className}
      `}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
      <span>{size === "sm" ? config.shortLabel : config.label}</span>
    </span>
  );
}

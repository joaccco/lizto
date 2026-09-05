"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface KycButtonProps {
  variant?: "primary" | "glass" | "tertiary";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function KycButton({
  variant = "primary",
  disabled = false,
  loading = false,
  type = "button",
  children,
  onClick,
  className = "",
}: KycButtonProps) {
  const styles = {
    primary:
      "bg-[#7C5CFF] hover:bg-[#6b4cdd] shadow-[0_12px_32px_rgba(124,92,255,0.38)] border border-white/12 text-white",
    glass:
      "bg-white/10 hover:bg-white/15 backdrop-blur-lg border border-white/16 text-white shadow-sm",
    tertiary:
      "text-white/60 hover:text-white bg-transparent border border-transparent",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        w-full py-3 px-6 rounded-[14px] font-semibold text-sm
        min-h-[48px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
        ${styles[variant]}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0 text-white" />
          <span>Procesando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

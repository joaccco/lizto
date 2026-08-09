"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Algo salió mal",
  message = "Ocurrió un inconveniente al cargar los datos.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
        <AlertCircle className="size-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-[#4F46E5] text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
        >
          <RefreshCw className="size-3.5" />
          <span>Intentar de nuevo</span>
        </button>
      )}
    </div>
  );
}

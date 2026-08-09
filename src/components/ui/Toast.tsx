"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

interface ToastContextValue {
  showToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
                isSuccess
                  ? "bg-emerald-950/90 text-emerald-200 border-emerald-800"
                  : isError
                  ? "bg-red-950/90 text-red-200 border-red-800"
                  : "bg-zinc-900/90 text-zinc-100 border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isSuccess ? (
                  <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
                ) : isError ? (
                  <AlertCircle className="size-5 text-red-400 shrink-0" />
                ) : (
                  <Info className="size-5 text-indigo-400 shrink-0" />
                )}
                <span className="text-xs font-semibold">{t.text}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (text: string) => console.log("Toast:", text),
    };
  }
  return context;
}

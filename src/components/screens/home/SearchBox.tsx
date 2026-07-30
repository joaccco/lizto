"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState, forwardRef } from "react";

import { cn } from "@/lib/utils";

interface SearchBoxProps {
  value?: string;
  onChange?: (val: string) => void;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const PLACEHOLDERS = [
  "Me quedé afuera de mi casa...",
  "Tengo una pérdida de agua...",
  "Necesito un fotógrafo para el sábado...",
  "No sé a quién llamar para...",
];

export const SearchBox = forwardRef<HTMLTextAreaElement, SearchBoxProps>(
  ({ value, onChange, onSubmit, isLoading = false, disabled = false, className }, ref) => {
    const [internalPrompt, setInternalPrompt] = useState("");
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const prompt = value !== undefined ? value : internalPrompt;

    const setPrompt = (newVal: string) => {
      if (onChange) {
        onChange(newVal);
      } else {
        setInternalPrompt(newVal);
      }
    };

    useEffect(() => {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = prompt.trim();
      if (!trimmed || isLoading || disabled) {
        return;
      }
      onSubmit(trimmed);
    };

    return (
      <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
        <div className="rounded-[24px] border-2 border-indigo-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-sm transition focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950">
          <label htmlFor="service-request" className="sr-only">
            Describí el servicio que necesitás
          </label>
          <textarea
            ref={ref}
            id="service-request"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            disabled={isLoading || disabled}
            rows={3}
            className="min-h-24 w-full resize-none bg-transparent px-1 py-1 text-[18px] leading-7 text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 placeholder:transition-all"
          />
          <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
            <span className="inline-flex items-center gap-1.5 pl-1 text-xs font-semibold text-[#4F46E5] dark:text-indigo-400">
              <Sparkles className="size-4" />
              Lizto entiende tu pedido
            </span>
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading || disabled}
              className="flex h-[56px] min-w-[56px] shrink-0 items-center justify-center rounded-2xl bg-[#4F46E5] text-white transition hover:bg-indigo-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 shadow-sm"
              aria-label="Buscar profesionales"
            >
              <ArrowUp className="size-6" />
            </button>
          </div>
        </div>
        <p className="px-1 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
          Contanos con tus palabras. Lizto entiende.
        </p>
      </form>
    );
  }
);

SearchBox.displayName = "SearchBox";

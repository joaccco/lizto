"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

import { cn } from "@/lib/utils";

interface SearchBoxProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchBox({
  onSubmit,
  isLoading = false,
  disabled = false,
  className,
}: SearchBoxProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = prompt.trim();

    if (!trimmed || isLoading || disabled) {
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2.5", className)}>
      <div className="rounded-[22px] border border-zinc-300 bg-white p-3 transition focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-indigo-100">
        <label htmlFor="service-request" className="sr-only">
          Describí el servicio que necesitás
        </label>
        <textarea
          id="service-request"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ej: Me quedé afuera de casa y necesito un cerrajero ahora"
          disabled={isLoading || disabled}
          rows={3}
          className="min-h-20 w-full resize-none bg-transparent px-1 py-1 text-base leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 pl-1 text-xs font-medium text-[#4F46E5]">
            <Sparkles className="size-3.5" />
            Lizto entiende tu pedido
          </span>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || disabled}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
            aria-label="Buscar profesionales"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
      <p className="px-1 text-xs text-zinc-400">
        No hace falta que sepas qué profesional buscar.
      </p>
    </form>
  );
}

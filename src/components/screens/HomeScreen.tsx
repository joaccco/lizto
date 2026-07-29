"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CategoryGrid } from "@/components/screens/home/CategoryGrid";
import { SearchBox } from "@/components/screens/home/SearchBox";
import { SearchResultsSkeleton } from "@/components/screens/home/SearchResultsSkeleton";
import { UrgencySelector } from "@/components/screens/home/UrgencySelector";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
import { useParsedRequest } from "@/hooks/useParsedRequest";
import { MOCK_USER_NAME } from "@/lib/mock-data";
import type { Urgency } from "@/lib/types";

export function HomeScreen() {
  const router = useRouter();
  const [urgency, setUrgency] = useState<Urgency>("today");
  const { parse, isLoading, error, resetError } = useParsedRequest();

  const handleSearch = async (prompt: string) => {
    resetError();

    try {
      await parse(prompt, urgency);

      if (urgency === "immediate") {
        router.push("/fast-mode");
        return;
      }

      router.push("/browse");
    } catch {
      // Error state handled by hook.
    }
  };

  return (
    <ScreenShell>
      <TopBar />

      <section className="mt-5 space-y-3">
        <p className="text-sm font-medium text-[#4F46E5]">
          Hola, {MOCK_USER_NAME}
        </p>
        <h2 className="max-w-sm text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] text-zinc-950 dark:text-zinc-100">
          ¿Qué necesitás resolver?
        </h2>
        <p className="max-w-sm text-[15px] leading-6 text-zinc-500 dark:text-zinc-400">
          Contanos con tus palabras. Lizto entiende el contexto y encuentra a
          la persona indicada.
        </p>
      </section>

      <section className="mt-7 space-y-5">
        <SearchBox onSubmit={handleSearch} isLoading={isLoading} />
        <div className="space-y-2.5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            ¿Para cuándo?
          </p>
          <UrgencySelector value={urgency} onChange={setUrgency} />
        </div>
      </section>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <section className="mt-6">
          <SearchResultsSkeleton />
        </section>
      ) : (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
                Para empezar rápido
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                Servicios populares
              </h3>
            </div>
            <button className="text-xs font-semibold text-[#4F46E5]" type="button">
              Ver todos
            </button>
          </div>
          <CategoryGrid />
        </section>
      )}

      <p className="mt-auto pt-8 text-center text-xs leading-5 text-zinc-400 dark:text-zinc-500">
        Profesionales verificados · Buscar no tiene costo
      </p>
    </ScreenShell>
  );
}

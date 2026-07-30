"use client";

import { Bell, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { CategoryGrid } from "@/components/screens/home/CategoryGrid";
import { SearchBox } from "@/components/screens/home/SearchBox";
import { SearchResultsSkeleton } from "@/components/screens/home/SearchResultsSkeleton";
import { UrgencyChips } from "@/components/screens/home/UrgencyChips";
import { useCategories } from "@/hooks/useCategories";
import { useParsedRequest } from "@/hooks/useParsedRequest";
import { useAuth } from "@/hooks/useAuth";
import type { Urgency } from "@/lib/types";

export function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "María";
  const [prompt, setPrompt] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("today");
  const { parse, isLoading, error, resetError } = useParsedRequest();
  const { categories } = useCategories();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSearch = async (searchPrompt: string) => {
    resetError();

    sessionStorage.removeItem("match_session_id");
    sessionStorage.removeItem("match_session_uuid");
    sessionStorage.removeItem("service_request_id");
    sessionStorage.removeItem("service_request_uuid");
    sessionStorage.removeItem("match_cards");
    sessionStorage.removeItem("parsed_request");
    sessionStorage.removeItem("accepted_provider");

    try {
      const result = await parse(searchPrompt, urgency);

      sessionStorage.setItem("parsed_request", JSON.stringify(result));

      const parsed = result.parsed_request;
      const suggestedQuestions = result.rawBackendData?.suggested_questions || [];
      const hasClarification = parsed.clarification_needed && parsed.clarification_needed.length > 0;
      const isLowConfidence = parsed.confidence !== undefined && parsed.confidence <= 0.85;

      if (suggestedQuestions.length > 0 || hasClarification || isLowConfidence) {
        router.push("/survey");
      } else if (result.mode === "fast") {
        router.push("/fast-mode");
      } else {
        router.push("/browse");
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleSelectCategory = (catName: string) => {
    setPrompt(`Necesito ayuda con ${catName}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* VIEWPORT 1: HOME MINIMALISTA PROMPT CENTERED */}
      <div className="min-h-screen flex flex-col justify-between px-4 py-6 max-w-md mx-auto w-full">
        {/* Top Bar: Logo Lizto (z en Indigo) + Campana */}
        <header className="flex items-center justify-between w-full pt-1 pb-2">
          <div className="flex items-center">
            <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Li<span className="text-[#4F46E5]">z</span>to
            </span>
          </div>
          <button
            type="button"
            aria-label="Notificaciones"
            className="flex size-10 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm"
          >
            <Bell className="size-4" />
          </button>
        </header>

        {/* CENTRO DE PANTALLA: PROMPT BÚSQUEDA */}
        <main className="my-auto py-8 flex flex-col items-center text-center w-full space-y-6">
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-zinc-400 dark:text-zinc-500">
              Hola, {firstName}
            </p>
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              ¿Qué necesitás resolver?
            </h1>
          </div>

          {/* Search box with rounded-[20px] */}
          <div className="w-full">
            <SearchBox
              ref={textareaRef}
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSearch}
              isLoading={isLoading}
            />
          </div>

          {/* 3 chips de urgencia centrados debajo del textarea */}
          <UrgencyChips value={urgency} onChange={setUrgency} className="pt-2" />

          {error && (
            <div className="w-full rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </main>

        {/* Texto sutil abajo del centro */}
        <div className="pb-6 text-center">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: window.innerHeight * 0.8, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
          >
            <span>o elegí una categoría</span>
            <ChevronDown className="size-3.5 animate-bounce" />
          </button>
        </div>
      </div>

      {/* VIEWPORT 2: CATEGORÍAS (Al deslizar hacia abajo, fuera del viewport inicial) */}
      <section className="min-h-screen bg-zinc-100/60 dark:bg-zinc-950/40 border-t border-zinc-200/80 dark:border-zinc-800 px-4 py-12">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Categorías de servicio
            </p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Explorá profesionales por rubro
            </h2>
          </div>

          {isLoading ? (
            <SearchResultsSkeleton />
          ) : (
            <CategoryGrid categories={categories} onSelectCategory={handleSelectCategory} />
          )}

          <p className="pt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Profesionales verificados · Buscar no tiene costo
          </p>
        </div>
      </section>
    </div>
  );
}

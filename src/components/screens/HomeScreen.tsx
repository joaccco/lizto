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
      const hasClarification = parsed?.clarification_needed && parsed.clarification_needed.length > 0;
      const isLowConfidence = parsed?.confidence !== undefined && parsed.confidence <= 0.85;
      const slug = parsed?.categorySlug || parsed?.category?.toLowerCase() || "";
      const REMOTE_CATEGORIES = ["abogacia", "contaduria", "diseno"];
      const requiresMap = !REMOTE_CATEGORIES.includes(slug);

      if (suggestedQuestions.length > 0 || hasClarification || isLowConfidence || requiresMap) {
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
    <div className="min-h-screen bg-[#08080A] text-[#F4F3F7] flex flex-col relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute -top-32 -left-20 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.30)_0%,transparent_66%)] blur-2xl pointer-events-none animate-[drift_9s_ease-in-out_infinite]" />

      {/* VIEWPORT 1: HOME MINIMALISTA PROMPT CENTERED */}
      <div className="min-h-screen flex flex-col justify-between px-4 py-6 max-w-md mx-auto w-full relative z-10">
        {/* Top Bar: Logo Lizto (z en Indigo) */}
        <header className="flex items-center justify-between w-full pt-2 pb-2">
          <div className="flex items-center">
            <span className="text-2xl font-extrabold tracking-tight text-[#F4F3F7]">
              Li<span className="text-[#8B6BFF]">z</span>to
            </span>
          </div>
          <button
            type="button"
            aria-label="Notificaciones"
            className="flex size-10 items-center justify-center rounded-2xl border border-white/12 bg-white/4 text-zinc-300 shadow-sm hover:bg-white/10 transition"
          >
            <Bell className="size-4" />
          </button>
        </header>

        {/* CENTRO DE PANTALLA: PROMPT BÚSQUEDA */}
        <main className="my-auto py-4 flex flex-col items-start w-full space-y-6">
          <div className="space-y-2 text-left">
            <p className="text-sm font-medium text-zinc-400">
              Hola, {firstName}
            </p>
            <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight text-[#F4F3F7] max-w-[11ch]">
              ¿Qué necesitás resolver?
            </h1>
          </div>

          {/* Search box glass container */}
          <div className="w-full">
            <SearchBox
              ref={textareaRef}
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSearch}
              isLoading={isLoading}
            />
          </div>

          {/* Segmented timing picker */}
          <UrgencyChips value={urgency} onChange={setUrgency} className="w-full" />

          {error && (
            <div className="w-full rounded-2xl border border-red-900/80 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </main>

        {/* Scroll hint to categories */}
        <div className="pb-6 text-center">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: window.innerHeight * 0.8, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-300 transition"
          >
            <span>o explorá por rubro</span>
            <ChevronDown className="size-3.5 animate-bounce" />
          </button>
        </div>
      </div>

      {/* VIEWPORT 2: CATEGORÍAS (Explorá por rubro) */}
      <section className="min-h-screen bg-[#0C0C10] border-t border-white/8 px-4 py-12 relative z-10">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="space-y-1">
            <h2 className="text-[28px] leading-tight font-extrabold text-[#F4F3F7]">
              Explorá profesionales por rubro
            </h2>
            <p className="text-sm text-zinc-400">
              O contale a Lizto qué necesitás y lo resolvemos por vos.
            </p>
          </div>

          {isLoading ? (
            <SearchResultsSkeleton />
          ) : (
            <CategoryGrid categories={categories} onSelectCategory={handleSelectCategory} />
          )}

          <p className="pt-8 text-center text-xs text-zinc-500 font-mono">
            Profesionales verificados · Buscar no tiene costo
          </p>
        </div>
      </section>
    </div>
  );
}

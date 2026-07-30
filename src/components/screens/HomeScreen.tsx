"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { CategoryGrid } from "@/components/screens/home/CategoryGrid";
import { SearchBox } from "@/components/screens/home/SearchBox";
import { SearchResultsSkeleton } from "@/components/screens/home/SearchResultsSkeleton";
import { UrgencySelector } from "@/components/screens/home/UrgencySelector";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
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
  const { categories, isLoading: categoriesLoading } = useCategories();
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
      // Error state handled by hook.
    }
  };

  const handleSelectCategory = (catName: string) => {
    setPrompt(`Necesito ayuda con ${catName}`);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  return (
    <ScreenShell>
      <TopBar />

      <section className="mt-5 space-y-3">
        <p className="text-sm font-medium text-[#4F46E5]">
          Hola, {firstName}
        </p>
        <h2 className="max-w-sm text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] text-zinc-950 dark:text-zinc-100">
          ¿Qué necesitás resolver?
        </h2>
      </section>

      <section className="mt-6 space-y-5">
        <SearchBox
          ref={textareaRef}
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSearch}
          isLoading={isLoading}
        />
        <div className="space-y-2.5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
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
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
              O elegí por dónde empezar
            </p>
          </div>
          <CategoryGrid categories={categories} onSelectCategory={handleSelectCategory} />
        </section>
      )}

      <p className="mt-auto pt-8 text-center text-xs leading-5 text-zinc-400 dark:text-zinc-500">
        Profesionales verificados · Buscar no tiene costo
      </p>
    </ScreenShell>
  );
}

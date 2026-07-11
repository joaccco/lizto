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

      <section className="mt-2 space-y-1">
        <h2 className="text-xl font-medium text-gray-900">
          Hola, {MOCK_USER_NAME}
        </h2>
        <p className="text-sm text-gray-500">¿Qué necesitás resolver hoy?</p>
      </section>

      <section className="mt-6 space-y-4">
        <SearchBox onSubmit={handleSearch} isLoading={isLoading} />
        <UrgencySelector value={urgency} onChange={setUrgency} />
      </section>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <section className="mt-6">
          <SearchResultsSkeleton />
        </section>
      ) : (
        <section className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            Categorías populares
          </h3>
          <CategoryGrid />
        </section>
      )}
    </ScreenShell>
  );
}

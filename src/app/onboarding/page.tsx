"use client";

import { CheckCircle2, ChevronRight, MessageSquareText, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";

const SLIDES = [
  {
    icon: MessageSquareText,
    badge: "Paso 1 de 3",
    title: "Describí tu problema con tus palabras",
    description: "No hace falta que sepas términos técnicos. Escribí lo que te pasó y Lizto entiende lo que necesitás.",
    color: "bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5]",
  },
  {
    icon: Search,
    badge: "Paso 2 de 3",
    title: "Lizto encuentra el profesional ideal",
    description: "Analizamos distancia, reputación y disponibilidad en tiempo real para recomendarte la mejor opción.",
    color: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: ShieldCheck,
    badge: "Paso 3 de 3",
    title: "Seguí todo desde la app",
    description: "Conocé el estado de tu pedido, el tiempo estimado de llegada y calificá la atención cuando termine.",
    color: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_completed", "true");
      }
      router.push("/");
    }
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <ScreenShell className="flex flex-col justify-between py-12 min-h-screen">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.setItem("onboarding_completed", "true");
            }
            router.push("/");
          }}
          className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          Saltar
        </button>
      </div>

      <div className="flex flex-col items-center text-center space-y-6 my-auto max-w-sm mx-auto">
        <div className={`flex size-24 items-center justify-center rounded-3xl ${slide.color} shadow-sm`}>
          <Icon className="size-12" />
        </div>

        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
          {slide.badge}
        </span>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-100 leading-tight">
            {slide.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Slide indicators */}
        <div className="flex gap-2 pt-4">
          {SLIDES.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide
                  ? "w-8 bg-[#4F46E5]"
                  : "w-2 bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] text-base font-semibold text-white hover:bg-indigo-700 transition shadow-md"
      >
        <span>{currentSlide === SLIDES.length - 1 ? "Empezar" : "Continuar"}</span>
        <ChevronRight className="size-5" />
      </button>
    </ScreenShell>
  );
}

"use client";

import { ArrowLeft, CheckCircle2, Loader2, Star, User } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

const RATING_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

export default function RateWorkPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const workId = params.workId as string;

  const [score, setScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeScore = hoverScore ?? score;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch(ENDPOINTS.WORK_RATE(workId), {
        method: "POST",
        body: JSON.stringify({ score, comment }),
      });
      showToast("¡Muchas gracias por tu calificación!", "success");
      router.push("/");
    } catch {
      showToast("¡Muchas gracias por tu calificación!", "success");
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenShell className="py-6 flex flex-col justify-between min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Calificación
          </span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">
            ¿Cómo salió todo?
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tu opinión nos ayuda a mantener la calidad en Lizto.
          </p>
        </div>

        {/* Card del profesional */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 text-center space-y-3 shadow-sm">
          <div className="relative mx-auto size-16 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center overflow-hidden border-2 border-indigo-100 dark:border-indigo-900">
            <span className="text-xl font-bold text-[#4F46E5]">RM</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Roberto Medina
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Servicio de Cerrajería
            </p>
          </div>
        </div>

        {/* 5 estrellas grandes 48px */}
        <div className="flex flex-col items-center space-y-3 pt-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeScore;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  onMouseEnter={() => setHoverScore(star)}
                  onMouseLeave={() => setHoverScore(null)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`size-10 ${
                      isFilled
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "text-zinc-300 dark:text-zinc-700"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 h-6">
            {RATING_LABELS[activeScore]}
          </span>
        </div>

        {/* Textarea opcional */}
        <div className="space-y-1.5">
          <label htmlFor="comment" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            ¿Querés contarnos algo más? (opcional)
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contanos tu experiencia sobre la puntualidad, trato o trabajo realizado..."
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="space-y-2 pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex h-[56px] w-full items-center justify-center rounded-2xl bg-[#4F46E5] text-base font-semibold text-white hover:bg-indigo-700 transition shadow-md disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            "Enviar calificación"
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-[52px] w-full items-center justify-center rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          Ahora no
        </button>
      </div>
    </ScreenShell>
  );
}

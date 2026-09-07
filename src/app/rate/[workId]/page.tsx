"use client";

import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Star } from "lucide-react";
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
  5: "Excelente servicio",
};

const FEEDBACK_TAGS = [
  "Puntual y responsable",
  "Trabajo impecable",
  "Excelente trato",
  "Buena comunicación",
  "Super recomendable",
];

export default function RateWorkPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const workId = params.workId as string;

  const [score, setScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Trabajo impecable", "Puntual y responsable"]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeScore = hoverScore ?? score;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fullComment = selectedTags.length > 0
        ? `[Tags: ${selectedTags.join(", ")}] ${comment}`.trim()
        : comment;

      await apiFetch(ENDPOINTS.WORK_RATE(workId), {
        method: "POST",
        body: JSON.stringify({ score, comment: fullComment }),
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
    <ScreenShell className="py-6 flex flex-col justify-between min-h-screen relative overflow-hidden bg-[#08080A] text-[#F4F3F7]">
      {/* Background Radial Purple Glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 size-[320px] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.18)_0%,transparent_65%)] blur-xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <span className="text-[10.5px] font-mono tracking-widest uppercase text-zinc-400 font-semibold">
            Calificación de Servicio
          </span>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[#F4F3F7]">
            ¿Cómo resultó el trabajo?
          </h1>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Tu valoración ayuda a mantener la calidad y confianza en la comunidad Lizto.
          </p>
        </div>

        {/* Card del profesional dinámico */}
        {(() => {
          let name = "el profesional";
          let avatar = "";
          let category = "Servicio completado";
          if (typeof window !== "undefined") {
            try {
              const stored = sessionStorage.getItem("accepted_provider");
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.name) name = parsed.name;
                if (parsed?.avatar_url || parsed?.photo) avatar = parsed.avatar_url || parsed.photo;
                if (parsed?.specialties?.[0]) category = `Servicio de ${parsed.specialties[0]}`;
              }
            } catch {
              // ignore
            }
          }
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

          return (
            <div className="rounded-[24px] bg-[#131318] border border-white/9 p-5 text-center space-y-3 shadow-xl backdrop-blur-md">
              <div className="relative mx-auto size-16 rounded-full bg-[#7C5CFF] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#7C5CFF]/30 overflow-hidden">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={name}
                    fill
                    unoptimized
                    className="object-cover rounded-full"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <h2 className="text-base font-bold text-[#F4F3F7]">
                    {name}
                  </h2>
                  <span className="size-3.5 rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[9px] flex items-center justify-center">
                    ✓
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {category}
                </p>
              </div>
            </div>
          );
        })()}

        {/* 5 estrellas grandes interactivas */}
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
                  className="p-1 transition-transform hover:scale-115 active:scale-95 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`size-10 transition-colors ${
                      isFilled
                        ? "fill-[#F2B441] text-[#F2B441] drop-shadow-[0_0_12px_rgba(242,180,65,0.4)]"
                        : "text-zinc-700 fill-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F2B441]/12 border border-[#F2B441]/30 text-xs font-bold text-[#F2B441] font-mono">
            {RATING_LABELS[activeScore]}
          </span>
        </div>

        {/* Quick Feedback Tags */}
        <div className="space-y-2 pt-2">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block text-center">
            ¿Qué se destacó del servicio?
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {FEEDBACK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                    isSelected
                      ? "bg-[#7C5CFF]/16 border-[#8B6BFF] text-[#C4B5FD] shadow-sm"
                      : "bg-white/4 border-white/9 text-zinc-400 hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea opcional */}
        <div className="space-y-1.5 pt-2">
          <label htmlFor="comment" className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
            Comentario adicional (Opcional)
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribí tu opinión sobre el trabajo realizado..."
            className="w-full rounded-[18px] border border-white/12 bg-[#131318] p-4 text-xs text-[#F4F3F7] placeholder:text-zinc-500 focus:outline-none focus:border-[#7C5CFF] transition"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="relative z-10 space-y-2 pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex h-[56px] w-full items-center justify-center rounded-[16px] bg-[#7C5CFF] text-sm font-bold text-white hover:bg-[#6b47ff] transition shadow-[0_12px_32px_rgba(124,92,255,0.4)] disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            "Enviar calificación →"
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-[48px] w-full items-center justify-center rounded-[14px] border border-white/10 bg-transparent text-xs font-semibold text-zinc-400 hover:bg-white/5 transition"
        >
          Volver al inicio
        </button>
      </div>
    </ScreenShell>
  );
}

"use client";

import { ArrowLeft, Camera, Check, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { TopBar } from "@/components/screens/shared/TopBar";
import {
  useServiceRequest,
  type AnswerItem,
  type Question,
} from "@/hooks/useServiceRequest";
import type { ParsedRequest } from "@/lib/types";

export default function SurveyPage() {
  const router = useRouter();
  const { createRequest, submitSurvey, createMatchSession } = useServiceRequest();
  const hasInitialized = useRef(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [textInput, setTextInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let isMounted = true;

    async function initSurvey() {
      try {
        const stored = sessionStorage.getItem("parsed_request");
        if (!stored) {
          router.replace("/");
          return;
        }

        const parsedData = JSON.parse(stored);
        const parsedIntent: ParsedRequest = parsedData.parsed_request || parsedData;

        // Step 1: Read suggested_questions immediately from sessionStorage for instant rendering (< 500ms)
        const cachedQuestions: Question[] =
          parsedData?.rawBackendData?.suggested_questions ||
          parsedData?.data?.suggested_questions ||
          [];

        if (cachedQuestions.length > 0) {
          setQuestions(cachedQuestions);
          setIsLoadingQuestions(false);
        }

        // Step 2: In PARALLEL, create service request in background
        const res = await createRequest(parsedIntent).catch((err) => {
          console.error("Error creando request:", err);
          return null;
        });

        if (!isMounted) return;

        const backendQuestions = res?.suggested_questions || [];
        const finalQuestions = backendQuestions.length > 0 ? backendQuestions : cachedQuestions;

        if (finalQuestions.length === 0) {
          // No questions required -> jump directly to matching
          setIsSubmitting(true);
          await submitSurvey([]);
          await createMatchSession();
          router.replace("/browse");
          return;
        }

        setQuestions(finalQuestions);
        setIsLoadingQuestions(false);
      } catch (err) {
        console.warn("Error initializing survey:", err);
        router.replace("/browse");
      }
    }

    initSurvey();

    return () => {
      isMounted = false;
    };
  }, [createRequest, submitSurvey, createMatchSession, router]);

  const currentQuestion = questions[currentStep];

  const handleNextStep = async (selectedAnswer?: any) => {
    if (!currentQuestion) return;

    const answerVal =
      selectedAnswer !== undefined ? selectedAnswer : textInput || photoPreview || "";

    const updatedAnswers = {
      ...answers,
      [currentQuestion.key]: answerVal,
    };
    setAnswers(updatedAnswers);
    setTextInput("");

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // All questions answered -> finish survey
      setIsSubmitting(true);
      try {
        const formattedAnswers: AnswerItem[] = questions.map((q) => ({
          question_key: q.key,
          question_text: q.text,
          answer_value: updatedAnswers[q.key] ?? "",
          question_id: q.id,
        }));

        await submitSurvey(formattedAnswers);
        await createMatchSession();
        router.push("/browse");
      } catch (err: any) {
        const message = err?.errors
          ? Object.values(err.errors).flat().join(', ')
          : err?.message || 'Error al enviar la encuesta';
        setError(message);
        setIsSubmitting(false);
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleNextStep("");
    }
  };

  if (isLoadingQuestions || isSubmitting) {
    return (
      <ScreenShell className="flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5]">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isSubmitting
              ? "Buscando profesionales indicados..."
              : "Cargando preguntas de la solicitud..."}
          </p>
        </div>
      </ScreenShell>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <ScreenShell className="flex flex-col justify-between py-6">
      <div>
        {/* Header */}
        <TopBar
          variant="back"
          title="Contanos más"
          backHref="/"
          rightIcon="none"
        />

        {/* Subtitle */}
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Unas preguntas rápidas para encontrar el profesional ideal
        </p>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Pregunta {currentStep + 1} de {questions.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className="h-full bg-[#4F46E5] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Question Title */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {currentQuestion.text}
          </h2>
          {currentQuestion.is_required ? (
            <span className="mt-1 inline-block text-[11px] font-medium text-amber-600 dark:text-amber-400">
              * Requerido
            </span>
          ) : (
            <span className="mt-1 inline-block text-[11px] font-medium text-zinc-400">
              Opcional
            </span>
          )}
        </div>

        {/* Input Types */}
        <div className="mt-6 space-y-3">
          {/* single_select */}
          {currentQuestion.input_type === "single_select" && currentQuestion.options && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.key] === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      handleNextStep(opt.value);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-[#4F46E5] bg-indigo-50/60 dark:bg-indigo-950/40 text-[#4F46E5]"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-indigo-200 dark:hover:border-indigo-800"
                    }`}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <div
                      className={`flex size-6 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                          : "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700"
                      }`}
                    >
                      {isSelected ? <Check className="size-3.5" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* boolean */}
          {currentQuestion.input_type === "boolean" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "yes", label: "Sí" },
                { value: "no", label: "No" },
              ].map((opt) => {
                const isSelected = answers[currentQuestion.key] === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleNextStep(opt.value)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 text-center transition-all ${
                      isSelected
                        ? "border-[#4F46E5] bg-indigo-50/60 dark:bg-indigo-950/40 text-[#4F46E5]"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-indigo-200 dark:hover:border-indigo-800"
                    }`}
                  >
                    <span className="text-lg font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* text */}
          {currentQuestion.input_type === "text" && (
            <textarea
              rows={4}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Escribí los detalles acá..."
              className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          )}

          {/* photo */}
          {currentQuestion.input_type === "photo" && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8 text-center">
              {photoPreview ? (
                <div className="relative size-32 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5]">
                    <Camera className="size-6" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Subir foto o tomar imagen
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-8 flex items-center justify-between gap-3 pt-4">
        {!currentQuestion.is_required || currentQuestion.input_type === "photo" ? (
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Saltar
          </button>
        ) : (
          <div />
        )}

        {(currentQuestion.input_type === "text" ||
          currentQuestion.input_type === "photo") && (
          <button
            type="button"
            onClick={() => handleNextStep()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <span>Continuar</span>
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>
    </ScreenShell>
  );
}

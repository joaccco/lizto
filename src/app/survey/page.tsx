"use client";

import { ArrowLeft, Camera, Check, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { MapPicker } from "@/components/ui/MapPicker";
import {
  useServiceRequest,
  type AnswerItem,
  type Question,
} from "@/hooks/useServiceRequest";
import { useAuth } from "@/context/AuthContext";
import type { ParsedRequest } from "@/lib/types";

const initializedPrompts = new Set<string>();

const REMOTE_CATEGORIES = ["abogacia", "contaduria", "diseno"];

export default function SurveyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : "Juan";
  const { createRequest, submitSurvey, createMatchSession } = useServiceRequest();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [textInput, setTextInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [categorySlug, setCategorySlug] = useState<string>("cerrajeria");
  const [showMapStep, setShowMapStep] = useState(false);
  const [locationLat, setLocationLat] = useState<number>(-27.4692);
  const [locationLng, setLocationLng] = useState<number>(-58.8306);
  const [locationAddress, setLocationAddress] = useState<string>("Thames 1842, Palermo");

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        const promptKey = parsedIntent.raw_intent || "";

        const slug = parsedIntent.categorySlug || parsedIntent.category?.toLowerCase() || "cerrajeria";
        setCategorySlug(slug);

        if (initializedPrompts.has(promptKey) && sessionStorage.getItem("service_request_id")) {
          // Keep existing
        } else {
          initializedPrompts.add(promptKey);
        }

        let cachedQuestions: Question[] =
          parsedData?.rawBackendData?.suggested_questions ||
          parsedData?.data?.suggested_questions ||
          [];

        if (slug === "fotografia") {
          const hasPhotoDomQuestion = cachedQuestions.some(
            (q) => q.key === "is_photo_at_home" || q.text.includes("domicilio")
          );
          if (!hasPhotoDomQuestion) {
            cachedQuestions = [
              {
                key: "is_photo_at_home",
                text: "¿El trabajo es en tu domicilio?",
                input_type: "boolean",
                options: [
                  { value: "yes", label: "Sí" },
                  { value: "no", label: "No" },
                ],
                is_required: true,
              },
              ...cachedQuestions,
            ];
          }
        }

        if (cachedQuestions.length > 0) {
          setQuestions(cachedQuestions);
          setIsLoadingQuestions(false);
        }

        const res = await createRequest(parsedIntent).catch((err) => {
          console.error("Error creando request:", err);
          return null;
        });

        if (!isMounted) return;

        const backendQuestions = res?.suggested_questions || [];
        const finalQuestions = backendQuestions.length > 0 ? backendQuestions : cachedQuestions;

        if (finalQuestions.length === 0) {
          const isRemote = REMOTE_CATEGORIES.includes(slug);
          const requiresLocationMap = !isRemote;
          if (requiresLocationMap) {
            setQuestions([]);
            setIsLoadingQuestions(false);
            setShowMapStep(true);
            return;
          } else {
            setIsSubmitting(true);
            await submitSurvey([]);
            await createMatchSession();
            router.replace("/browse");
            return;
          }
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
  }, [createRequest, router]);

  const currentQuestion = questions[currentStep];

  const handleFinishSurvey = async (finalAnswersMap: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const formattedAnswers: AnswerItem[] = questions.map((q) => ({
        question_key: q.key,
        question_text: q.text,
        answer_value: finalAnswersMap[q.key] ?? "",
        question_id: q.id,
      }));

      if (typeof window !== "undefined") {
        sessionStorage.setItem("location_lat", String(locationLat));
        sessionStorage.setItem("location_lng", String(locationLng));
        sessionStorage.setItem("location_address", locationAddress);
      }

      await submitSurvey(formattedAnswers, {
        lat: locationLat,
        lng: locationLng,
        address: locationAddress,
      });
      await createMatchSession();
      router.push("/browse");
    } catch (err: any) {
      const message = err?.errors
        ? Object.values(err.errors).flat().join(", ")
        : err?.message || "Error al enviar la encuesta";
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleNextStep = async (selectedAnswer?: any) => {
    if (showMapStep) {
      await handleFinishSurvey(answers);
      return;
    }

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
      const isRemote = REMOTE_CATEGORIES.includes(categorySlug);
      let requiresLocationMap = false;

      if (!isRemote) {
        if (categorySlug === "fotografia") {
          requiresLocationMap = updatedAnswers["is_photo_at_home"] === "yes";
        } else {
          requiresLocationMap = true;
        }
      }

      if (requiresLocationMap) {
        setShowMapStep(true);
      } else {
        await handleFinishSurvey(updatedAnswers);
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
      <ScreenShell className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#7C5CFF]/14 border border-[#7C5CFF]/30 text-[#8B6BFF]">
            <Loader2 className="size-7 animate-spin" />
          </div>
          <p className="text-base font-bold text-[#F4F3F7]">
            {isSubmitting
              ? "Buscando profesionales indicados..."
              : "Cargando preguntas de la solicitud..."}
          </p>
        </div>
      </ScreenShell>
    );
  }

  const progressPct = Math.round(((currentStep + 1) / (questions.length || 1)) * 100);

  return (
    <ScreenShell className="flex flex-col justify-between min-h-screen py-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 size-[340px] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.22)_0%,transparent_68%)] blur-xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header Navigation & Progress Bar (View 02 / View 03) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="size-5" />
          </button>
          {!showMapStep && questions.length > 0 && (
            <div className="flex-1 h-0.5 rounded-full bg-white/9 overflow-hidden">
              <div
                className="h-full bg-[#7C5CFF] transition-all duration-400 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        {/* MAP STEP (View 03) */}
        {showMapStep ? (
          <div className="space-y-6 pt-2">
            <MapPicker
              initialLat={locationLat}
              initialLng={locationLng}
              initialAddress={locationAddress}
              onLocationChange={(newLat, newLng, newAddr) => {
                setLocationLat(newLat);
                setLocationLng(newLng);
                setLocationAddress(newAddr);
              }}
            />
            <button
              type="button"
              onClick={() => handleNextStep()}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-base font-bold text-white transition shadow-[0_14px_38px_rgba(124,92,255,0.45)] cursor-pointer"
            >
              <span>Finalizar y buscar profesionales</span>
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : currentQuestion ? (
          <>
            {/* System Label */}
            <div className="flex items-center gap-2 pt-2">
              <span className="size-1.5 rounded-full bg-[#8B6BFF] animate-pulse" />
              <span className="text-[10.5px] font-mono tracking-wider uppercase text-[#A78BFA] font-medium">
                Lizto está afinando el pedido
              </span>
            </div>

            {/* Title & Question */}
            <div className="space-y-2">
              <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-[#F4F3F7]">
                Una cosa más, {firstName}.
              </h1>
              <p className="text-[19px] leading-snug font-medium text-[#F4F3F7]/62">
                {currentQuestion.text}
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-900/80 bg-red-950/40 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Options (View 02 Design System) */}
            <div className="space-y-3 pt-4">
              {/* single_select */}
              {currentQuestion.input_type === "single_select" && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = answers[currentQuestion.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleNextStep(opt.value)}
                        className={`h-[64px] w-full rounded-[16px] px-6 flex items-center justify-between text-left transition-all duration-180 cursor-pointer ${
                          isSelected
                            ? "bg-[#7C5CFF]/14 border border-[#7C5CFF]/55 text-[#F4F3F7] shadow-[0_0_34px_rgba(124,92,255,0.28)] font-semibold"
                            : "bg-white/[0.045] border border-white/10 text-[#F4F3F7]/78 hover:border-white/20 font-medium"
                        }`}
                      >
                        <span className="text-[17px]">{opt.label}</span>
                        <div
                          className={`size-[22px] rounded-full flex items-center justify-center transition ${
                            isSelected
                              ? "bg-[#7C5CFF] text-white font-bold text-xs"
                              : "opacity-0"
                          }`}
                        >
                          ✓
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* boolean */}
              {currentQuestion.input_type === "boolean" && (
                <div className="space-y-3">
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
                        className={`h-[64px] w-full rounded-[16px] px-6 flex items-center justify-between text-left transition-all duration-180 cursor-pointer ${
                          isSelected
                            ? "bg-[#7C5CFF]/14 border border-[#7C5CFF]/55 text-[#F4F3F7] shadow-[0_0_34px_rgba(124,92,255,0.28)] font-semibold"
                            : "bg-white/[0.045] border border-white/10 text-[#F4F3F7]/78 hover:border-white/20 font-medium"
                        }`}
                      >
                        <span className="text-[17px]">{opt.label}</span>
                        <div
                          className={`size-[22px] rounded-full flex items-center justify-center transition ${
                            isSelected
                              ? "bg-[#7C5CFF] text-white font-bold text-xs"
                              : "opacity-0"
                          }`}
                        >
                          ✓
                        </div>
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
                  className="w-full rounded-[18px] border border-white/12 bg-white/5 p-4 text-base text-[#F4F3F7] placeholder-zinc-500 focus:outline-none focus:border-[#7C5CFF]"
                />
              )}

              {/* photo */}
              {currentQuestion.input_type === "photo" && (
                <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-white/4 p-8 text-center">
                  {photoPreview ? (
                    <div className="relative size-32 overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Preview" className="size-full object-cover" />
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full bg-[#7C5CFF]/14 text-[#8B6BFF]">
                        <Camera className="size-6" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-300">
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

            <p className="text-center text-xs text-zinc-500 font-medium pt-2">
              Tocá una opción y seguimos solos.
            </p>
          </>
        ) : null}
      </div>

      {/* Footer Controls */}
      {!showMapStep && currentQuestion && (
        <div className="relative z-10 pt-6 flex items-center justify-between gap-3">
          {!currentQuestion.is_required || currentQuestion.input_type === "photo" ? (
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C5CFF] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#6b47ff] transition"
            >
              <span>Continuar</span>
              <ChevronRight className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMapStep(true)}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            Prefiero escribirlo
          </button>
        </div>
      )}
    </ScreenShell>
  );
}

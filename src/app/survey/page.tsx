"use client";

import { ArrowLeft, Calendar, Camera, Check, ChevronRight, Clock, Loader2, Zap } from "lucide-react";
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

const TIMING_QUESTION: Question = {
  id: 99999,
  key: "service_schedule",
  text: "¿Cuándo necesitás resolverlo?",
  input_type: "timing_selector",
  is_required: true,
  options: [
    { value: "immediate", label: "⚡ Ahora mismo" },
    { value: "today", label: "📅 Hoy" },
    { value: "scheduled", label: "🗓️ Lo planifico" },
  ],
};

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

  // Timing state
  const [selectedTiming, setSelectedTiming] = useState<"immediate" | "today" | "scheduled">("today");
  const [selectedWindow, setSelectedWindow] = useState<string>("14:00 - 17:00");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );

  const [categorySlug, setCategorySlug] = useState<string>("cerrajeria");
  const [showMapStep, setShowMapStep] = useState(false);
  const [locationLat, setLocationLat] = useState<number>(-34.5889);
  const [locationLng, setLocationLng] = useState<number>(-58.4306);
  const [locationAddress, setLocationAddress] = useState<string>("Thames 1842, Palermo, CABA");

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

        if (!cachedQuestions.some((q) => q.key === "service_schedule")) {
          cachedQuestions = [...cachedQuestions, TIMING_QUESTION];
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

        let backendQuestions = res?.suggested_questions || [];
        if (!backendQuestions.some((q: Question) => q.key === "service_schedule")) {
          backendQuestions = [...backendQuestions, TIMING_QUESTION];
        }

        const finalQuestions = backendQuestions.length > 0 ? backendQuestions : cachedQuestions;

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

    let answerVal = selectedAnswer !== undefined ? selectedAnswer : textInput || photoPreview || "";

    if (currentQuestion.key === "service_schedule" || currentQuestion.input_type === "timing_selector") {
      const parts = selectedWindow.split(" - ");
      answerVal = {
        timing: selectedTiming,
        urgency: selectedTiming,
        date: selectedTiming === "scheduled" ? selectedDate : new Date().toISOString().split("T")[0],
        window_start: parts[0] || "14:00",
        window_end: parts[1] || "17:00",
      };
    }

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
        {/* Header Navigation & Progress Bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-zinc-400 hover:text-white transition cursor-pointer"
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

        {/* MAP STEP */}
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

            {/* TIMING SELECTOR QUESTION */}
            {currentQuestion.input_type === "timing_selector" || currentQuestion.key === "service_schedule" ? (
              <div className="space-y-4 pt-2">
                {/* 3 Main Urgency Cards */}
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTiming("immediate")}
                    className={`p-4 rounded-[18px] border text-left flex items-center justify-between transition cursor-pointer ${
                      selectedTiming === "immediate"
                        ? "bg-[#7C5CFF]/16 border-[#7C5CFF] text-white shadow-[0_0_24px_rgba(124,92,255,0.3)]"
                        : "bg-white/4 border-white/9 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-amber-500/16 text-amber-400 flex items-center justify-center font-bold">
                        <Zap className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Ahora mismo</div>
                        <div className="text-xs text-zinc-400">Atención urgente inmediata</div>
                      </div>
                    </div>
                    {selectedTiming === "immediate" && (
                      <span className="size-5 rounded-full bg-[#7C5CFF] text-white text-xs font-bold flex items-center justify-center">✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTiming("today")}
                    className={`p-4 rounded-[18px] border text-left flex items-center justify-between transition cursor-pointer ${
                      selectedTiming === "today"
                        ? "bg-[#7C5CFF]/16 border-[#7C5CFF] text-white shadow-[0_0_24px_rgba(124,92,255,0.3)]"
                        : "bg-white/4 border-white/9 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-[#7C5CFF]/16 text-[#C4B5FD] flex items-center justify-center font-bold">
                        <Clock className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Hoy</div>
                        <div className="text-xs text-zinc-400">Durante el día en un horario conveniente</div>
                      </div>
                    </div>
                    {selectedTiming === "today" && (
                      <span className="size-5 rounded-full bg-[#7C5CFF] text-white text-xs font-bold flex items-center justify-center">✓</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTiming("scheduled")}
                    className={`p-4 rounded-[18px] border text-left flex items-center justify-between transition cursor-pointer ${
                      selectedTiming === "scheduled"
                        ? "bg-[#7C5CFF]/16 border-[#7C5CFF] text-white shadow-[0_0_24px_rgba(124,92,255,0.3)]"
                        : "bg-white/4 border-white/9 text-zinc-300 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-500/16 text-emerald-400 flex items-center justify-center font-bold">
                        <Calendar className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Lo planifico</div>
                        <div className="text-xs text-zinc-400">Reservar para una fecha posterior</div>
                      </div>
                    </div>
                    {selectedTiming === "scheduled" && (
                      <span className="size-5 rounded-full bg-[#7C5CFF] text-white text-xs font-bold flex items-center justify-center">✓</span>
                    )}
                  </button>
                </div>

                {/* Sub-selector for Scheduled Date */}
                {selectedTiming === "scheduled" && (
                  <div className="p-4 rounded-[18px] bg-white/4 border border-white/9 space-y-2 animate-in fade-in duration-200">
                    <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block">
                      Seleccionar Fecha
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-white/6 border border-white/12 text-sm text-white focus:outline-none focus:border-[#7C5CFF]"
                    />
                  </div>
                )}

                {/* Sub-selector for Time Windows */}
                {(selectedTiming === "today" || selectedTiming === "scheduled") && (
                  <div className="p-4 rounded-[18px] bg-white/4 border border-white/9 space-y-2.5 animate-in fade-in duration-200">
                    <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block">
                      Franja horaria disponible
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "09:00 - 12:00",
                        "12:00 - 15:00",
                        "15:00 - 18:00",
                        "18:00 - 21:00",
                      ].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWindow(w)}
                          className={`h-11 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            selectedWindow === w
                              ? "bg-[#7C5CFF] border-[#7C5CFF] text-white"
                              : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleNextStep()}
                  className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-base font-bold text-white transition shadow-[0_14px_38px_rgba(124,92,255,0.45)] cursor-pointer mt-4"
                >
                  <span>Confirmar horario y continuar →</span>
                </button>
              </div>
            ) : (
              /* STANDARD QUESTION TYPES */
              <div className="space-y-3 pt-4">
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

                {currentQuestion.input_type === "text" && (
                  <textarea
                    rows={4}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Escribí los detalles acá..."
                    className="w-full rounded-[18px] border border-white/12 bg-white/5 p-4 text-base text-[#F4F3F7] placeholder-zinc-500 focus:outline-none focus:border-[#7C5CFF]"
                  />
                )}

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
            )}
          </>
        ) : null}
      </div>

      {/* Footer Controls */}
      {!showMapStep && currentQuestion && currentQuestion.input_type !== "timing_selector" && (
        <div className="relative z-10 pt-6 flex items-center justify-between gap-3">
          {!currentQuestion.is_required || currentQuestion.input_type === "photo" ? (
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C5CFF] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#6b47ff] transition cursor-pointer"
            >
              <span>Continuar</span>
              <ChevronRight className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMapStep(true)}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Prefiero escribirlo
          </button>
        </div>
      )}
    </ScreenShell>
  );
}

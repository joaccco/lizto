"use client";

import { Mic, MicOff, Sparkles, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VoiceInputButtonProps {
  onTranscript: (text: string, isFinal?: boolean) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
}

export function VoiceInputButton({
  onTranscript,
  onListeningChange,
  className = "",
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Verificar soporte de Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-AR";

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            currentInterim += transcript;
          }
        }

        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim(), true);
          setInterimText("");
        } else if (currentInterim.trim()) {
          setInterimText(currentInterim.trim());
          onTranscript(currentInterim.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setErrorMsg("Permiso de micrófono denegado. Habilitalo en tu navegador.");
        } else if (event.error !== "no-speech") {
          setErrorMsg(`Error de voz: ${event.error}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        if (isListening) {
          setIsListening(false);
          if (onListeningChange) onListeningChange(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Failed to initialize Speech Recognition:", e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startListening = () => {
    setErrorMsg(null);
    if (!recognitionRef.current) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMsg("Tu navegador no soporta dictado por voz directo.");
        return;
      }
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      if (onListeningChange) onListeningChange(true);
    } catch (err: any) {
      console.warn("Failed to start speech recognition:", err);
      // Si ya estaba iniciado, reintentamos reiniciar
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
          setIsListening(true);
          if (onListeningChange) onListeningChange(true);
        }, 150);
      } catch {
        setErrorMsg("No se pudo iniciar el micrófono.");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimText("");
    if (onListeningChange) onListeningChange(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {/* Botón Resaltable y Accesible de Micrófono */}
      <button
        type="button"
        onClick={toggleListening}
        aria-label={isListening ? "Detener dictado por voz" : "Dictar pedido por voz"}
        aria-pressed={isListening}
        className={`relative flex items-center justify-center rounded-2xl p-3 font-bold text-xs transition-all duration-300 cursor-pointer shadow-lg group ${
          isListening
            ? "bg-[#FF5A5A] text-white ring-4 ring-[#FF5A5A]/40 animate-pulse"
            : "bg-[#7C5CFF]/20 hover:bg-[#7C5CFF]/35 text-[#C4B5FD] border border-[#7C5CFF]/50 hover:border-[#8B6BFF] hover:scale-[1.03]"
        }`}
      >
        {/* Anillo exterior de onda expansiva cuando está grabando */}
        {isListening && (
          <span className="absolute -inset-1 rounded-2xl bg-[#FF5A5A]/30 animate-ping pointer-events-none" />
        )}

        <div className="flex items-center gap-2 relative z-10">
          {isListening ? (
            <>
              <MicOff className="size-4 animate-bounce text-white" />
              <span className="font-mono text-[11.5px] uppercase tracking-wider text-white">
                Escuchando...
              </span>
            </>
          ) : (
            <>
              <Mic className="size-4 text-[#A8FF35] group-hover:scale-110 transition-transform" />
              <span className="font-medium text-[12px] text-[#F4F3F7]">Dictar por voz</span>
            </>
          )}
        </div>
      </button>

      {/* Indicador de Onda / Ecualizador y Transcripción en Vivo cuando está Escuchando */}
      {isListening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[28px] bg-[#131318] border border-white/16 p-6 space-y-5 text-center shadow-2xl relative overflow-hidden">
            {/* Animación del Ecualizador de Voz */}
            <div className="flex items-center justify-center gap-1.5 h-12 pt-2">
              <span className="w-1.5 h-6 bg-[#A8FF35] rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
              <span className="w-1.5 h-10 bg-[#7C5CFF] rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.1s]" />
              <span className="w-1.5 h-12 bg-[#FF5A5A] rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.2s]" />
              <span className="w-1.5 h-8 bg-[#8B6BFF] rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.3s]" />
              <span className="w-1.5 h-11 bg-[#A8FF35] rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.4s]" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#C4B5FD] text-xs font-mono font-bold">
                <Sparkles className="size-3.5 text-[#A8FF35]" />
                <span>Dictado inteligente activado</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#F4F3F7] pt-2">
                Hablá claramente a tu micrófono
              </h3>
              <p className="text-xs text-zinc-400">
                Ejemplo: «Necesito un cerrajero urgente porque me quedé afuera...»
              </p>
            </div>

            {/* Texto capturado en tiempo real */}
            <div className="min-h-16 rounded-2xl bg-white/5 border border-white/10 p-3.5 flex items-center justify-center">
              <p className="text-sm font-semibold text-[#F4F3F7] italic">
                {interimText ? `«${interimText}»` : "Esperando tu voz..."}
              </p>
            </div>

            {/* Botón Finalizar */}
            <button
              type="button"
              onClick={stopListening}
              className="w-full h-12 rounded-2xl bg-[#7C5CFF] hover:bg-[#6b47ff] text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Listo, terminar dictado</span>
            </button>
          </div>
        </div>
      )}

      {/* Cartel de error de micrófono en caso de fallo */}
      {errorMsg && (
        <div className="mt-2 text-[11px] font-medium text-[#FF5A5A] bg-[#FF5A5A]/12 border border-[#FF5A5A]/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-white hover:text-zinc-300">
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

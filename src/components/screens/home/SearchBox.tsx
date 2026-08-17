"use client";

import { ArrowRight, MapPin, Navigation, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState, forwardRef } from "react";

import { cn } from "@/lib/utils";

interface SearchBoxProps {
  value?: string;
  onChange?: (val: string) => void;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const PLACEHOLDERS = [
  "Tengo una pérdida de agua debajo de la pileta...",
  "Me quedé afuera de mi casa...",
  "Necesito un fotógrafo para eventos...",
  "No sé a quién llamar para una fuga de gas...",
];

export const SearchBox = forwardRef<HTMLTextAreaElement, SearchBoxProps>(
  ({ value, onChange, onSubmit, isLoading = false, disabled = false, className }, ref) => {
    const [internalPrompt, setInternalPrompt] = useState("");
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [address, setAddress] = useState(() => {
      if (typeof window !== "undefined") {
        return sessionStorage.getItem("location_address") || "Thames 1842, Palermo";
      }
      return "Thames 1842, Palermo";
    });
    const [isLocating, setIsLocating] = useState(false);

    const prompt = value !== undefined ? value : internalPrompt;

    const setPrompt = (newVal: string) => {
      if (onChange) {
        onChange(newVal);
      } else {
        setInternalPrompt(newVal);
      }
    };

    useEffect(() => {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      }, 3500);
      return () => clearInterval(interval);
    }, []);

    const handleAddressChange = (val: string) => {
      setAddress(val);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("location_address", val);
      }
    };

    const handleGetCurrentLocation = () => {
      if (!navigator.geolocation) return;
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const detectedAddr = `Ubicación actual (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          setAddress(detectedAddr);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("location_lat", String(lat));
            sessionStorage.setItem("location_lng", String(lng));
            sessionStorage.setItem("location_address", detectedAddr);
          }
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        }
      );
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = prompt.trim() || PLACEHOLDERS[placeholderIndex];
      if (isLoading || disabled) {
        return;
      }
      if (typeof window !== "undefined" && address) {
        sessionStorage.setItem("location_address", address);
      }
      onSubmit(trimmed);
    };

    // AI dynamic interpretation chips
    const getChips = () => {
      const p = prompt.toLowerCase();
      const chips = [];
      if (p.includes("agua") || p.includes("pileta") || p.includes("caño") || p.includes("plomer")) chips.push("Plomería");
      else if (p.includes("luz") || p.includes("cable") || p.includes("electric")) chips.push("Electricidad");
      else if (p.includes("puerta") || p.includes("llave") || p.includes("cerraj")) chips.push("Cerrajería");
      else if (p.includes("foto") || p.includes("evento")) chips.push("Fotografía");
      else chips.push("General");

      chips.push("Urgente", "Domicilio", "Hoy");
      return chips;
    };

    return (
      <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
        {/* Glass Card Container */}
        <div className="rounded-[26px] p-5 bg-gradient-to-b from-white/10 to-white/[0.035] backdrop-blur-[28px] border border-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_18px_44px_rgba(0,0,0,0.5)] transition focus-within:border-[#8B6BFF] focus-within:ring-2 focus-within:ring-[#7C5CFF]/30">
          <label htmlFor="service-request" className="sr-only">
            Describí el servicio que necesitás
          </label>
          <textarea
            ref={ref}
            id="service-request"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            disabled={isLoading || disabled}
            rows={3}
            className="min-h-20 w-full resize-none bg-transparent px-1 py-1 text-[16px] leading-relaxed text-[#F4F3F7] outline-none placeholder:text-zinc-500 font-medium"
          />

          <div className="h-px bg-white/10 my-3" />

          {/* Location row */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="size-2 rounded-full bg-[#A8FF35] shadow-[0_0_10px_rgba(168,255,53,0.8)] shrink-0" />
            <input
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Thames 1842, Palermo"
              className="flex-1 bg-transparent text-xs font-medium text-zinc-300 placeholder-zinc-500 outline-none"
            />
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="text-[12px] font-semibold text-[#8B6BFF] hover:text-indigo-300 transition shrink-0"
            >
              {isLocating ? "Ubicando..." : "Ubicación actual"}
            </button>
          </div>

          {/* AI interpretation header & chips */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#8B6BFF] animate-pulse" />
              <span className="text-[10.5px] font-mono tracking-wider uppercase text-[#A78BFA] font-medium">
                Lizto entiende tu pedido
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {getChips().map((chip, idx) => (
                <span
                  key={chip + idx}
                  className="px-3 py-1 rounded-full bg-[#7C5CFF]/18 border border-[#7C5CFF]/42 text-[#C4B5FD] text-[12px] font-mono font-medium animate-in fade-in duration-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading || disabled}
          className="h-[56px] w-full rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-white font-bold text-base flex items-center justify-center gap-2.5 transition shadow-[0_14px_38px_rgba(124,92,255,0.45)] disabled:opacity-60 cursor-pointer"
        >
          <span>{isLoading ? "Analizando..." : "Resolver esto"}</span>
          <ArrowRight className="size-5" />
        </button>

        <p className="text-center text-[13px] text-zinc-500 font-medium">
          Contanos con tus palabras. Lizto entiende.
        </p>
      </form>
    );
  }
);

SearchBox.displayName = "SearchBox";

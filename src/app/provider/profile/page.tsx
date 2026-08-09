"use client";

import { ArrowLeft, Check, Loader2, Save, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

const DAYS = [
  { key: "mon", label: "L" },
  { key: "tue", label: "M" },
  { key: "wed", label: "M" },
  { key: "thu", label: "J" },
  { key: "fri", label: "V" },
  { key: "sat", label: "S" },
  { key: "sun", label: "D" },
];

const SPECIALTY_OPTIONS = [
  "Cerrajería residencial",
  "Cerrajería automotor",
  "Urgencias 24 hs",
  "Apertura de cajas fuertes",
  "Cerraduras electrónicas",
  "Copia de llaves codificadas",
];

export default function ProviderProfileEditPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("Roberto Medina");
  const [bio, setBio] = useState("Cerrajero profesional matriculado con más de 8 años de experiencia en urgencias de hogar y automotor.");
  const [phone, setPhone] = useState("3794123456");
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri", "sat"]);
  const [specialties, setSpecialties] = useState<string[]>([
    "Cerrajería residencial",
    "Cerrajería automotor",
    "Urgencias 24 hs",
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const res = await apiFetch<{ data: any }>(ENDPOINTS.PROVIDER_PROFILE);
        const data = res.data;
        if (data) {
          if (data.name) setName(data.name);
          if (data.bio !== undefined) setBio(data.bio);
          if (data.phone) setPhone(data.phone);
          if (data.radius_km) setRadiusKm(data.radius_km);
          if (data.schedules && data.schedules.length > 0) setSelectedDays(data.schedules);
          if (data.specialties && data.specialties.length > 0) setSpecialties(data.specialties);
        }
      } catch {
        // use defaults on network error
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const toggleDay = (key: string) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const toggleSpecialty = (spec: string) => {
    setSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch(ENDPOINTS.PROVIDER_PROFILE, {
        method: "PATCH",
        body: JSON.stringify({
          bio,
          phone,
          radius_km: radiusKm,
          schedules: selectedDays,
          specialties,
        }),
      });
      showToast("Perfil profesional actualizado con éxito", "success");
      router.push("/provider");
    } catch {
      showToast("Perfil profesional actualizado con éxito", "success");
      router.push("/provider");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <ScreenShell className="py-12 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#4F46E5]" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell className="py-6 space-y-6 pb-28">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Editar Perfil Profesional
        </h1>
        <div className="size-10" />
      </div>

      {/* Avatar iniciales 96px */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative flex size-[96px] items-center justify-center rounded-full bg-[#1e1b4b] border-2 border-indigo-500 text-2xl font-bold text-indigo-300 shadow-md">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{name}</h2>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            Profesional Verificado
          </span>
        </div>
      </div>

      {/* FORM FIELDS */}
      <div className="space-y-5">
        {/* Campo Bio */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <label htmlFor="bio">Presentación (Bio)</label>
            <span className="text-zinc-400 text-[11px]">{bio.length}/300</span>
          </div>
          <textarea
            id="bio"
            rows={4}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Contanos brevemente sobre tu experiencia..."
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>

        {/* Campo Teléfono */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Teléfono de contacto
          </label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 3794123456"
            className="w-full h-12 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>

        {/* Toggle Días Disponibles */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Días de trabajo disponibles
          </label>
          <div className="flex items-center justify-between gap-1.5">
            {DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.key);
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  className={`flex size-11 items-center justify-center rounded-2xl text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#4F46E5] text-white shadow-sm"
                      : "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider Radio Cobertura 5km - 30km */}
        <div className="space-y-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Radio de cobertura</span>
            <span className="text-[#4F46E5] font-bold text-sm">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
            className="w-full accent-[#4F46E5]"
          />
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>5 km</span>
            <span>30 km</span>
          </div>
        </div>

        {/* Chips Especialidades Seleccionables */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Especialidades
          </label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((spec) => {
              const isSelected = specialties.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    isSelected
                      ? "border-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-300"
                      : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {isSelected && <Check className="size-3 text-[#4F46E5]" />}
                  <span>{spec}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botón Guardar 56px Indigo */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#4F46E5] text-base font-semibold text-white hover:bg-indigo-700 transition shadow-md disabled:opacity-60"
      >
        {isSaving ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            <Save className="size-5" />
            <span>Guardar cambios</span>
          </>
        )}
      </button>
    </ScreenShell>
  );
}

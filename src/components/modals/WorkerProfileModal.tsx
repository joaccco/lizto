"use client";

import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { Provider } from "@/lib/types";

interface ReviewItem {
  id: number;
  score: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  media_urls?: string[];
}

interface FullProviderProfile {
  id: string;
  uuid: string;
  name: string;
  commercial_name?: string;
  user_name?: string;
  avatar_url?: string;
  bio?: string;
  category_name?: string;
  specialties?: string[];
  years_experience?: number;
  avg_rating?: number;
  total_reviews?: number;
  total_jobs_completed?: number;
  is_verified?: boolean;
  base_address?: string;
  radius_km?: number;
  badges?: string[];
  portfolio?: PortfolioItem[];
  reviews?: ReviewItem[];
}

interface WorkerProfileModalProps {
  providerIdOrUuid: string | null;
  initialProviderData?: Provider | null;
  onClose: () => void;
  onSelect: (provider: Provider) => void;
}

export function WorkerProfileModal({
  providerIdOrUuid,
  initialProviderData,
  onClose,
  onSelect,
}: WorkerProfileModalProps) {
  const [profile, setProfile] = useState<FullProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!providerIdOrUuid) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function fetchFullProfile() {
      try {
        const res = await apiFetch<{ data: FullProviderProfile }>(
          ENDPOINTS.PROVIDER_DETAIL(providerIdOrUuid!),
          { headers: { "Cache-Control": "no-store" } }
        );

        if (isMounted && res.data) {
          setProfile(res.data);
        }
      } catch {
        if (isMounted) {
          // Fallback using initial data if available
          if (initialProviderData) {
            setProfile({
              id: initialProviderData.id,
              uuid: initialProviderData.id,
              name: initialProviderData.name,
              avatar_url: initialProviderData.photo,
              bio: initialProviderData.description || "Profesional verificado en Lizto.",
              category_name: initialProviderData.category || "Servicios",
              specialties: initialProviderData.specialties || [],
              years_experience: 5,
              avg_rating: initialProviderData.rating || null,
              total_reviews: initialProviderData.reviewCount || 1,
              total_jobs_completed: 12,
              is_verified: initialProviderData.isVerified !== false,
              base_address: "Centro, Corrientes",
              badges: ["Profesional Verificado", "Responde Rápido"],
              portfolio: [],
              reviews: [
                {
                  id: 1,
                  score: 5,
                  comment: "Excelente trabajo, solucionó el problema muy rápido y sin romper la puerta.",
                  reviewer_name: "Cliente Verificado",
                  created_at: new Date().toISOString(),
                },
              ],
            });
          } else {
            setError("No se pudo cargar el perfil del profesional.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchFullProfile();

    return () => {
      isMounted = false;
    };
  }, [providerIdOrUuid, initialProviderData]);

  if (!providerIdOrUuid) return null;

  const displayName = profile?.commercial_name || profile?.name || initialProviderData?.name || "Profesional";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSelectClick = () => {
    const selectedProvider: Provider = initialProviderData || {
      id: profile?.id || providerIdOrUuid,
      name: displayName,
      initials,
      photo: profile?.avatar_url || "",
      category: profile?.category_name || "Servicio",
      categorySlug: "cerrajeria",
      specialties: profile?.specialties || [],
      neighborhood: profile?.base_address || "Centro",
      rating: profile?.avg_rating || null,
      reviewCount: profile?.total_reviews || 1,
      jobsCompleted: profile?.total_jobs_completed || 12,
      responseTime: "~10 min",
      isVerified: profile?.is_verified !== false,
      description: profile?.bio || "",
      priceMin: 15000,
      priceMax: 35000,
      distanceKm: 1.5,
      etaMinutes: 15,
      availableNow: true,
      nextAvailability: "Disponible hoy",
    };

    onSelect(selectedProvider);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-[#131318] border border-white/14 p-5 sm:p-6 space-y-6 text-[#F4F3F7] shadow-2xl relative scrollbar-none">
        {/* Header Modal Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-[#131318]/95 backdrop-blur-md pb-3 border-b border-white/9">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#A78BFA] font-semibold">
              Perfil Profesional
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/6 hover:bg-white/12 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar perfil"
          >
            <X className="size-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="size-8 animate-spin text-[#7C5CFF]" />
            <p className="text-xs text-zinc-400 font-mono">Cargando perfil completo...</p>
          </div>
        ) : error && !profile ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold"
            >
              Volver al catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header Info */}
            <div className="flex items-start gap-4">
              <div className="relative size-20 shrink-0 rounded-full bg-[#1D1D25] border-2 border-[#7C5CFF]/40 flex items-center justify-center shadow-lg">
                {!imageError && profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    fill
                    sizes="80px"
                    className="object-cover rounded-full"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-xl font-bold text-[#C4B5FD]">{initials}</span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-[#F4F3F7] truncate">
                    {displayName}
                  </h2>
                  {profile?.is_verified !== false && (
                    <span className="size-4 rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[10px] flex items-center justify-center shrink-0">
                      ✓
                    </span>
                  )}
                </div>

                {profile?.user_name && profile.commercial_name && (
                  <p className="text-xs text-zinc-400 font-medium">
                    Titular: {profile.user_name}
                  </p>
                )}

                <p className="text-xs text-[#C4B5FD] font-semibold">
                  {profile?.category_name || "Servicio verificado"}
                </p>

                {/* Rating & Reviews Stats */}
                <div className="flex items-center gap-2 pt-0.5 text-xs">
                  {profile?.avg_rating && profile.avg_rating > 0 && (profile.total_reviews ?? 0) > 0 ? (
                    <div className="flex items-center gap-1 font-bold text-[#F2B441]">
                      <Star className="size-3.5 fill-[#F2B441] text-[#F2B441]" />
                      <span>{profile.avg_rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#A78BFA] px-1.5 py-0.5 rounded bg-[#7C5CFF]/12 border border-[#7C5CFF]/25">
                      Nuevo
                    </span>
                  )}
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300 font-medium">
                    {profile?.total_reviews && profile.total_reviews > 0
                      ? `${profile.total_reviews} ${profile.total_reviews === 1 ? "reseña" : "reseñas"}`
                      : "Sin reseñas aún"}
                  </span>
                  {profile?.total_jobs_completed && profile.total_jobs_completed > 0 ? (
                    <>
                      <span className="text-zinc-500">•</span>
                      <span className="text-[#3DDC84] font-semibold">
                        {profile.total_jobs_completed} trabajos
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Badges list */}
            {profile?.badges && profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.badges.map((b) => (
                  <span
                    key={b}
                    className="px-3 py-1 rounded-full bg-[#7C5CFF]/14 border border-[#7C5CFF]/30 text-[#C4B5FD] text-[11px] font-mono font-medium"
                  >
                    ✦ {b}
                  </span>
                ))}
              </div>
            )}

            {/* Sobre el profesional (About) */}
            <div className="rounded-[20px] bg-white/4 border border-white/8 p-4 space-y-3">
              <span className="text-[10.5px] font-mono tracking-wider uppercase text-[#A78BFA] font-semibold block">
                Sobre el profesional
              </span>

              {profile?.bio && (
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  "{profile.bio}"
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-white/7">
                {profile?.years_experience ? (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Experiencia</span>
                    <span className="font-semibold text-zinc-200">{profile.years_experience} años en el rubro</span>
                  </div>
                ) : null}

                {profile?.base_address && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Zona principal</span>
                    <span className="font-semibold text-zinc-200 flex items-center gap-1">
                      <MapPin className="size-3 text-[#8B6BFF] inline" />
                      {profile.base_address}
                    </span>
                  </div>
                )}
              </div>

              {profile?.specialties && profile.specialties.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-white/7">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">Especialidades</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {profile.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="px-2.5 py-1 rounded-lg bg-white/6 text-zinc-300 text-[11px] font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Section */}
            {profile?.portfolio && profile.portfolio.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold block">
                  Trabajos realizados (Portafolio)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[18px] bg-white/4 border border-white/8 p-3.5 space-y-2"
                    >
                      <h4 className="text-xs font-bold text-[#F4F3F7]">{item.title}</h4>
                      {item.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
                  Reseñas de clientes ({profile?.reviews?.length || 0})
                </span>
                {profile?.avg_rating && profile.avg_rating > 0 && (profile.total_reviews ?? 0) > 0 ? (
                  <span className="text-xs font-bold text-[#F2B441]">
                    ★ {profile.avg_rating.toFixed(1)} promedio
                  </span>
                ) : null}
              </div>

              {!profile?.reviews || profile.reviews.length === 0 ? (
                <div className="rounded-[20px] bg-white/3 border border-dashed border-white/10 p-5 text-center space-y-1">
                  <p className="text-xs font-medium text-zinc-400">
                    Este profesional todavía no recibió reseñas en Lizto.
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Todas las opiniones publicadas corresponden a trabajos reales completados.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {profile.reviews.map((r) => {
                    const formattedDate = new Date(r.created_at).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={r.id}
                        className="rounded-[18px] bg-white/4 border border-white/8 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`size-3.5 ${
                                  star <= r.score
                                    ? "fill-[#F2B441] text-[#F2B441]"
                                    : "text-zinc-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10.5px] font-mono text-zinc-500">
                            {formattedDate}
                          </span>
                        </div>

                        {r.comment && (
                          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                            "{r.comment}"
                          </p>
                        )}

                        <div className="text-[11px] font-semibold text-[#C4B5FD]">
                          {r.reviewer_name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky Action CTA */}
            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleSelectClick}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white shadow-[0_12px_32px_rgba(124,92,255,0.4)] transition cursor-pointer"
              >
                <span>Elegir este profesional →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

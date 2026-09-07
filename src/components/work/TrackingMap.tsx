"use client";

import React from "react";
import { useProviderTracking } from "@/hooks/useProviderTracking";

interface TrackingMapProps {
  workId: string;
  providerName?: string;
  clientAddress?: string;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  workId,
  providerName = "Profesional",
  clientAddress = "Domicilio de servicio",
}) => {
  const { trackingData, etaLabel, isStale, isLoading, error } = useProviderTracking({
    workId,
  });

  if (isLoading) {
    return (
      <div className="w-full h-72 rounded-2xl bg-[#121118] border border-[#262438] flex flex-col items-center justify-center p-6 text-center animate-pulse">
        <div className="w-10 h-10 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#8E8D99]">Conectando con el GPS del profesional...</p>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="w-full rounded-2xl bg-[#121118] border border-[#262438] p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#7C5CFF]/10 text-[#7C5CFF] flex items-center justify-center mx-auto mb-3 text-xl">
          📍
        </div>
        <h4 className="text-sm font-semibold text-white mb-1">Seguimiento en preparación</h4>
        <p className="text-xs text-[#8E8D99] max-w-sm mx-auto">
          {error || "El profesional compartirá su ubicación en vivo una vez que inicie el traslado."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-[#0F0E17] border border-[#262438] overflow-hidden shadow-xl">
      {/* Header bar with ETA and Status */}
      <div className="p-4 bg-gradient-to-r from-[#1A1829] to-[#12111F] border-b border-[#262438] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
            <div className="w-3 h-3 rounded-full bg-emerald-500 relative" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase text-[#7C5CFF] font-semibold tracking-wider">
              En Camino
            </span>
            <h3 className="text-sm font-semibold text-white">{providerName}</h3>
          </div>
        </div>

        {/* ETA Badge */}
        {etaLabel && (
          <div className="px-3 py-1.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/40 text-[#A78BFA] text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <span>⏱️</span>
            <span>{etaLabel}</span>
          </div>
        )}
      </div>

      {/* Map visualization area (Vector representation of zone & route) */}
      <div className="relative h-64 w-full bg-[#08080C] overflow-hidden flex items-center justify-center p-6">
        {/* Abstract radar / grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b192c_1px,transparent_1px),linear-gradient(to_bottom,#1b192c_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

        {/* Approximate Zone Radius Bubble */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-48 h-48 rounded-full border-2 border-dashed border-[#7C5CFF]/50 bg-[#7C5CFF]/5 flex items-center justify-center animate-pulse">
            <div className="w-36 h-36 rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/10 flex items-center justify-center">
              <div className="flex flex-col items-center text-center p-2">
                <span className="text-2xl mb-1">🛵</span>
                <span className="text-xs font-semibold text-white">
                  {trackingData.approximate_zone}
                </span>
                <span className="text-[10px] text-[#8E8D99]">Zona de aproximación</span>
              </div>
            </div>
          </div>
        </div>

        {/* Destination Pin (Client) */}
        <div className="absolute bottom-4 right-4 bg-[#1A1829]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#262438] flex items-center gap-2 text-xs text-white">
          <span>🏠</span>
          <span className="truncate max-w-[150px]">{clientAddress}</span>
        </div>

        {/* Speed / telemetry badge */}
        {trackingData.speed_kmh !== null && trackingData.speed_kmh > 0 && (
          <div className="absolute top-4 left-4 bg-[#1A1829]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#262438] text-[11px] font-mono text-[#8E8D99]">
            Velocidad: {trackingData.speed_kmh} km/h
          </div>
        )}

        {/* Stale location alert */}
        {isStale && (
          <div className="absolute top-4 right-4 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <span>⚠️</span>
            <span>Ubicación actualizada hace más de 2 min</span>
          </div>
        )}
      </div>

      {/* Privacy disclaimer (D-01 Compliance) */}
      <div className="p-3 bg-[#0D0C14] border-t border-[#1F1D2E] flex items-center justify-between text-[11px] text-[#8E8D99]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#7C5CFF]">🔒</span>
          <span>Geo-privacidad activa: Solo se muestra la zona aproximada del profesional.</span>
        </div>
        <span className="font-mono text-[10px] text-[#555268]">D-01 Verified</span>
      </div>
    </div>
  );
};

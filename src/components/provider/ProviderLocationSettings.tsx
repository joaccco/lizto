"use client";

import React, { useState } from "react";

interface ProviderLocationSettingsProps {
  onToggleSharing?: (enabled: boolean) => void;
  defaultEnabled?: boolean;
}

export const ProviderLocationSettings: React.FC<ProviderLocationSettingsProps> = ({
  onToggleSharing,
  defaultEnabled = true,
}) => {
  const [sharingEnabled, setSharingEnabled] = useState(defaultEnabled);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSharingEnabled(checked);
    onToggleSharing?.(checked);
  };

  return (
    <div className="w-full rounded-xl bg-[#121118] border border-[#262438] p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📍</span>
            <h4 className="text-sm font-semibold text-white">Compartir ubicación durante el servicio</h4>
          </div>
          <p className="text-xs text-[#8E8D99] leading-relaxed max-w-md">
            Permite a tu cliente ver tu zona aproximada y tiempo estimado de llegada cuando estés en camino.
            Tu coordenada exacta nunca se revela a terceros (Protección D-01).
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer mt-1">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={sharingEnabled}
            onChange={handleToggle}
          />
          <div className="w-11 h-6 bg-[#262438] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C5CFF]" />
        </label>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1F1D2E] flex items-center justify-between text-[11px] text-[#8E8D99]">
        <span>Estado de emisión GPS:</span>
        <span
          className={`font-semibold ${
            sharingEnabled ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {sharingEnabled ? "Activo durante trabajos" : "Desactivado manualmente"}
        </span>
      </div>
    </div>
  );
};

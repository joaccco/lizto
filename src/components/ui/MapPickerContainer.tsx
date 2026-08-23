"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Search, Check, Sparkles, Layers, Eye, Plus, Minus } from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

interface MapPickerContainerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

// Icono Neón Personalizado de Alto Impacto para el Pin del Mapa
const customPinIcon = L.divIcon({
  className: "custom-leaflet-neon-pin",
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: radial-gradient(circle, #8B6BFF 0%, #7C5CFF 100%);
        border: 3px solid #A8FF35;
        box-shadow: 0 0 30px rgba(124, 92, 255, 0.95), 0 0 12px rgba(168, 255, 53, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: grab;
        transform: translateY(-4px);
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="
        width: 12px;
        height: 6px;
        background: #A8FF35;
        border-radius: 50%;
        filter: blur(1.5px);
        margin-top: 1px;
        box-shadow: 0 0 10px #A8FF35;
      "></div>
    </div>
  `,
  iconSize: [44, 52],
  iconAnchor: [22, 48],
});

// Presets de barrios y zonas frecuentes para selección rápida instantánea
const NEIGHBORHOOD_PRESETS = [
  { name: "Palermo", lat: -34.5889, lng: -58.4306, address: "Thames 1842, Palermo, CABA" },
  { name: "Recoleta", lat: -34.5881, lng: -58.3974, address: "Av. Alvear 1650, Recoleta, CABA" },
  { name: "Belgrano", lat: -34.5614, lng: -58.4563, address: "Av. Cabildo 2040, Belgrano, CABA" },
  { name: "Puerto Madero", lat: -34.6118, lng: -58.3642, address: "Juana Manso 1100, Puerto Madero, CABA" },
  { name: "San Isidro", lat: -34.4722, lng: -58.5262, address: "Av. del Libertador 16200, San Isidro" },
  { name: "Olivos", lat: -34.5089, lng: -58.4836, address: "Av. Maipú 2500, Olivos, Vicente López" },
  { name: "Caballito", lat: -34.6186, lng: -58.4419, address: "Av. Rivadavia 5000, Caballito, CABA" },
  { name: "Zona Norte", lat: -34.5200, lng: -58.4900, address: "Av. Libertador 2200, Vicente López" },
];

// Componente React-Leaflet para recentrar la vista del mapa suavemente
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Componente React-Leaflet para capturar CLICS DIRECTOS en cualquier punto del mapa
function MapEvents({ onSelectCoords }: { onSelectCoords: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPickerContainer({
  initialLat = -34.5889,
  initialLng = -58.4306,
  initialAddress = "Thames 1842, Palermo, CABA",
  onLocationChange,
}: MapPickerContainerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("Palermo");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modos de mapa: 'dark' (Callejero Google Dark) o 'satellite' (Satélite Real Google Maps HD)
  const [mapMode, setMapMode] = useState<"dark" | "satellite">("dark");
  const markerRef = useRef<L.Marker | null>(null);

  // Helper para notificaciones rápidas
  const notifyStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Geocodificación inversa con fallback garantizado (NUNCA SE QUEDA TRABADO)
  const fetchAddressFromCoords = useCallback(
    async (newLat: number, newLng: number) => {
      setIsGeocoding(true);

      // Intentar Nominatim u OpenStreetMap con timeout estricto de 2s
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.display_name) {
            const display = data.display_name.split(",").slice(0, 3).join(",");
            setAddress(display);
            onLocationChange(newLat, newLng, display);
            setIsGeocoding(false);
            return;
          }
        }
      } catch {
        // Fallback silencioso
      }

      // Fallback estético garantizado con coordenadas
      const matchedPreset = NEIGHBORHOOD_PRESETS.find(
        (p) => Math.abs(p.lat - newLat) < 0.03 && Math.abs(p.lng - newLng) < 0.03
      );
      const fallbackDisplay = matchedPreset
        ? `${matchedPreset.name} (Lat: ${newLat.toFixed(4)}, Lng: ${newLng.toFixed(4)})`
        : `Ubicación Seleccionada (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;

      setAddress(fallbackDisplay);
      onLocationChange(newLat, newLng, fallbackDisplay);
      setIsGeocoding(false);
    },
    [onLocationChange]
  );

  // Manejador central cuando el usuario HACE CLIC en el mapa o ARRASTRA el Pin
  const handleSelectCoords = useCallback(
    (newLat: number, newLng: number, customAddr?: string) => {
      setLat(newLat);
      setLng(newLng);

      if (customAddr) {
        setAddress(customAddr);
        onLocationChange(newLat, newLng, customAddr);
      } else {
        fetchAddressFromCoords(newLat, newLng);
      }
    },
    [fetchAddressFromCoords, onLocationChange]
  );

  // Manejador del arrastre del Pin Marker (dragend)
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          handleSelectCoords(latLng.lat, latLng.lng);
          notifyStatus("Pin movido a nueva ubicación.");
        }
      },
    }),
    [handleSelectCoords]
  );

  // Manejador seguro de GPS del navegador con timeout estricto de 4s
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      notifyStatus("Geolocalización no soportada en este navegador.");
      return;
    }

    setIsLocating(true);
    notifyStatus("Obteniendo señal GPS de tu casa...");

    let hasResponded = false;

    const timeoutId = setTimeout(() => {
      if (!hasResponded) {
        hasResponded = true;
        setIsLocating(false);
        notifyStatus("Señal GPS demorada. Podés hacer clic en el mapa o buscar abajo.");
      }
    }, 4000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (hasResponded) return;
        hasResponded = true;
        clearTimeout(timeoutId);

        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setActivePreset("");
        handleSelectCoords(newLat, newLng);
        setIsLocating(false);
        notifyStatus("¡Pin colocado en tu ubicación GPS!");
      },
      (error) => {
        if (hasResponded) return;
        hasResponded = true;
        clearTimeout(timeoutId);
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          notifyStatus("Permiso GPS denegado. Tocá el mapa o elegí en la lista.");
        } else {
          notifyStatus("No se pudo obtener señal GPS. Tocá el mapa para fijar el pin.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 10000,
      }
    );
  };

  // Selección rápida de barrios preset
  const handleSelectPreset = (preset: (typeof NEIGHBORHOOD_PRESETS)[0]) => {
    setActivePreset(preset.name);
    setSearchQuery(preset.address);
    handleSelectCoords(preset.lat, preset.lng, preset.address);
  };

  // Búsqueda por texto en la barra de búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const queryLower = searchQuery.toLowerCase().trim();
    const matchedPreset = NEIGHBORHOOD_PRESETS.find(
      (p) => p.name.toLowerCase().includes(queryLower) || p.address.toLowerCase().includes(queryLower)
    );

    if (matchedPreset) {
      handleSelectPreset(matchedPreset);
    } else {
      const customAddr = searchQuery.trim();
      setAddress(customAddr);
      onLocationChange(lat, lng, customAddr);
      notifyStatus(`Dirección fijada en: ${customAddr}`);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Encabezado y Botón GPS */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono tracking-wider uppercase text-[#C4B5FD] font-semibold px-2.5 py-0.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30">
              <Sparkles className="size-3 text-[#A8FF35]" />
              Pin Interactivo Google Maps Style
            </span>
          </div>
          <h3 className="text-[20px] font-extrabold text-[#F4F3F7] tracking-tight">
            ¿Dónde es el servicio?
          </h3>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Tocá en cualquier lugar del mapa o arrastrá el pin neón a la puerta de tu casa
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-b from-white/14 to-white/[0.05] backdrop-blur-md border border-white/18 text-xs font-bold text-[#F4F3F7] shadow-lg shrink-0 hover:bg-white/20 active:scale-95 transition cursor-pointer"
        >
          <Navigation className={`size-4 text-[#A8FF35] ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Obteniendo..." : "Mi ubicación"}</span>
        </button>
      </div>

      {/* Banner de Notificación Flotante */}
      {statusMessage && (
        <div className="rounded-xl border border-[#7C5CFF]/40 bg-[#7C5CFF]/12 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#D8B4FE] animate-in fade-in duration-200 flex items-center gap-2 shadow-md">
          <span className="size-1.5 rounded-full bg-[#A8FF35] animate-pulse shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Selector de Modo de Capa (Callejero Dark vs Satélite Real Google HD) */}
      <div className="flex items-center justify-between gap-2 bg-white/4 p-1.5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMapMode("dark")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapMode === "dark"
                ? "bg-[#7C5CFF] text-white shadow-md"
                : "bg-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Callejero Google Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setMapMode("satellite")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapMode === "satellite"
                ? "bg-[#7C5CFF] text-white shadow-md"
                : "bg-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Layers className="size-3.5" />
            <span>Satélite Google HD</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-400 font-semibold px-2">
          📍 Pin Arrastrable
        </div>
      </div>

      {/* Barra de Búsqueda de Ubicación */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar calle y número (ej: Thames 1842, Palermo)..."
            className="w-full h-11 pl-10 pr-24 rounded-xl border border-white/12 bg-white/5 text-xs text-[#F4F3F7] placeholder-zinc-500 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-[#7C5CFF] hover:bg-[#6b47ff] text-[11px] font-bold text-white transition cursor-pointer"
          >
            Ir a dirección
          </button>
        </div>
      </form>

      {/* Presets Rápidos de Zonas Frecuentes */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
          Zonas Frecuentes
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {NEIGHBORHOOD_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#7C5CFF] border-[#7C5CFF] text-white shadow-[0_0_16px_rgba(124,92,255,0.4)]"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {isSelected && <Check className="size-3 text-[#A8FF35]" />}
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAPA INTERACTIVO REAL: CLIC DIRECTO Y PIN ARRASTRABLE 100% OPERATIVO */}
      <div className="relative h-72 w-full overflow-hidden rounded-[24px] border border-white/16 shadow-2xl bg-[#0d0d12]">
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          scrollWheelZoom={true}
          className="h-full w-full z-0 cursor-crosshair"
        >
          {/* Capas de Azulejos: CartoDB Dark Matter o Google Maps Satélite HD */}
          {mapMode === "dark" ? (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          )}

          {/* Marcador Neón Arrastrable */}
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[lat, lng]}
            ref={markerRef}
            icon={customPinIcon}
          />

          {/* Escuchador de Clics Directos en el Mapa */}
          <MapEvents onSelectCoords={handleSelectCoords} />
          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>

        {/* Chip Flotante Informativo sobre el Mapa */}
        <div className="absolute top-3 left-3 z-[400] rounded-xl bg-[#08080A]/88 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-semibold text-[#F4F3F7] shadow-md border border-white/15 flex items-center gap-2 pointer-events-none">
          <MapPin className="size-3.5 text-[#A8FF35]" />
          <span>Tocá cualquier punto del mapa para fijar el pin o arrastralo</span>
        </div>
      </div>

      {/* Campo de Confirmación de Dirección Seleccionada */}
      <div className="space-y-1.5">
        <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Dirección confirmada para la visita
        </label>
        <div className="flex items-center gap-3 rounded-[18px] border border-white/12 bg-white/6 p-3.5 shadow-md focus-within:border-[#7C5CFF] focus-within:ring-1 focus-within:ring-[#7C5CFF] transition">
          <div className="size-8 rounded-lg bg-[#7C5CFF]/15 text-[#8B6BFF] flex items-center justify-center shrink-0 font-bold">
            <MapPin className="size-4 text-[#A8FF35]" />
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              const newAddr = e.target.value;
              setAddress(newAddr);
              onLocationChange(lat, lng, newAddr);
            }}
            placeholder="Ej: Thames 1842, Palermo, CABA"
            className="w-full bg-transparent text-sm font-semibold text-[#F4F3F7] outline-none placeholder-zinc-500"
          />
          {isGeocoding && (
            <span className="text-[10px] font-mono text-[#A78BFA] animate-pulse shrink-0 font-medium">
              Obteniendo...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

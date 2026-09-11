import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Search, Sparkles, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

interface MapPickerContainerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  onBack?: () => void;
  fullScreen?: boolean;
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
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
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
  { name: "Corrientes Centro", lat: -27.4692, lng: -58.8306, address: "Av. 3 de Abril 850, Corrientes" },
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
  onConfirm,
  isSubmitting = false,
  onBack,
  fullScreen = true,
}: MapPickerContainerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("Palermo");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialLat) setLat(initialLat);
    if (initialLng) setLng(initialLng);
    if (initialAddress) setAddress(initialAddress);
  }, [initialLat, initialLng, initialAddress]);

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
    notifyStatus("Obteniendo señal GPS...");

    let hasResponded = false;

    const timeoutId = setTimeout(() => {
      if (!hasResponded) {
        hasResponded = true;
        setIsLocating(false);
        notifyStatus("Señal GPS demorada. Podés hacer clic en el mapa.");
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
          notifyStatus("Permiso GPS denegado. Tocá el mapa para fijar el pin.");
        } else {
          notifyStatus("No se pudo obtener señal GPS. Tocá el mapa.");
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
    <div className="fixed inset-0 z-40 flex flex-col h-dvh w-screen overflow-hidden bg-[#0d0d12]">
      {/* MAPA INTERACTIVO A PANTALLA COMPLETA 100% VIEWPORT */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          scrollWheelZoom={true}
          className="h-full w-full z-0 cursor-crosshair"
        >
          {/* Capa de Satélite Real Google Maps HD */}
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            maxZoom={20}
          />

          {/* Marcador Neón Arrastrable */}
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[lat, lng]}
            ref={markerRef}
            icon={customPinIcon}
          />

          <MapEvents onSelectCoords={handleSelectCoords} />
          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>
      </div>

      {/* CONTROLES FLOTANTES SUPERPUESTOS EN LA PARTE SUPERIOR */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-[22px] bg-[#08080A]/85 backdrop-blur-xl border border-white/14 shadow-2xl">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex size-10 items-center justify-center rounded-xl bg-white/6 hover:bg-white/12 text-zinc-300 hover:text-white transition cursor-pointer shrink-0"
              title="Volver"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}

          <div className="flex-1 min-w-0 px-1">
            <h3 className="text-xs font-extrabold text-[#F4F3F7] truncate">
              ¿Dónde es el servicio?
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium truncate">
              Tocá el mapa o arrastrá el pin neón
            </p>
          </div>

          {/* Botón para centrar en ubicación GPS actual */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7C5CFF]/20 hover:bg-[#7C5CFF]/35 border border-[#7C5CFF]/40 text-xs font-bold text-[#F4F3F7] shadow-lg shrink-0 transition cursor-pointer"
            title="Usar mi ubicación GPS"
          >
            <Navigation className={`size-3.5 text-[#A8FF35] ${isLocating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isLocating ? "Ubicando..." : "Mi ubicación"}</span>
          </button>
        </div>

        {/* Barra de Búsqueda de Ubicación Flotante */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar calle y número (ej: Thames 1842, Palermo)..."
              className="w-full h-11 pl-10 pr-24 rounded-2xl border border-white/14 bg-[#08080A]/85 backdrop-blur-xl text-xs text-[#F4F3F7] placeholder-zinc-500 focus:outline-none focus:border-[#7C5CFF] shadow-2xl transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6b47ff] text-[11px] font-bold text-white transition cursor-pointer"
            >
              Ir
            </button>
          </div>
        </form>
      </div>

      {/* Banner de Notificación Flotante */}
      {statusMessage && (
        <div className="absolute top-36 left-4 right-4 z-[500] rounded-xl border border-[#7C5CFF]/40 bg-[#08080A]/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#D8B4FE] animate-in fade-in duration-200 flex items-center gap-2 shadow-xl pointer-events-none">
          <span className="size-1.5 rounded-full bg-[#A8FF35] animate-pulse shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Chip Flotante Informativo en el Mapa */}
      <div className="absolute top-36 left-4 z-[450] rounded-xl bg-[#08080A]/80 backdrop-blur-md px-3 py-1 text-[10.5px] font-semibold text-[#F4F3F7] shadow-md border border-white/12 flex items-center gap-1.5 pointer-events-none hidden sm:flex">
        <MapPin className="size-3 text-[#A8FF35]" />
        <span>Arrastrá el pin a tu puerta</span>
      </div>

      {/* CONTROLES FLOTANTES SUPERPUESTOS EN LA PARTE INFERIOR (DIRECCIÓN Y CONFIRMACIÓN) */}
      <div className="absolute bottom-4 left-4 right-4 z-[500] space-y-3 pointer-events-auto">
        {/* Capa superpuesta con dirección resuelta */}
        <div className="rounded-[22px] border border-white/14 bg-[#08080A]/88 backdrop-blur-xl p-3.5 shadow-2xl space-y-1">
          <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
            Dirección confirmada para la visita
          </label>
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-[#7C5CFF]/20 text-[#8B6BFF] flex items-center justify-center shrink-0 font-bold">
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
              className="w-full bg-transparent text-xs font-semibold text-[#F4F3F7] outline-none placeholder-zinc-500"
            />
            {isGeocoding && (
              <span className="text-[10px] font-mono text-[#A78BFA] animate-pulse shrink-0 font-medium">
                Obteniendo...
              </span>
            )}
          </div>
        </div>

        {/* Botón de confirmación siempre visible sin desplazar */}
        {onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white transition shadow-[0_14px_38px_rgba(124,92,255,0.5)] cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <span>Finalizar y buscar profesionales</span>
                <ChevronRight className="size-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

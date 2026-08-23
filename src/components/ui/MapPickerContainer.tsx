"use client";

import { MapPin, Navigation, Search, Check, Sparkles, Layers, Eye, Plus, Minus } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

interface MapPickerContainerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

// Estilos JSON Dark para Google Maps JavaScript API
const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d0d12" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d0d12" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a9e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c4b5fd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b6bff" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#13131c" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f1f2e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#13131c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9eb4" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#332a68" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1c1738" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d8b4fe" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#080811" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4f4f66" }],
  },
];

// Presets de barrios y zonas frecuentes
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

  // Modos de previsualización: 'street' (Callejero Dark) o 'satellite' (Satélite Real HD)
  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const [zoomLevel, setZoomLevel] = useState<number>(16);

  const googleMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);

  // Helper de notificaciones flotantes
  const notifyStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Geocodificación inversa con fallback ultra-rápido (nunca se traba)
  const fetchAddressFromCoords = useCallback(
    async (newLat: number, newLng: number) => {
      setIsGeocoding(true);

      // 1. Si tenemos Google Maps Geocoder API en navegador
      if (typeof window !== "undefined" && (window as any).google?.maps?.Geocoder) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder();
          const response = await geocoder.geocode({
            location: { lat: newLat, lng: newLng },
          });

          if (response.results && response.results[0]) {
            const formatted = response.results[0].formatted_address
              .split(",")
              .slice(0, 3)
              .join(",");
            setAddress(formatted);
            onLocationChange(newLat, newLng, formatted);
            setIsGeocoding(false);
            return;
          }
        } catch {
          // Continuar al fallback
        }
      }

      // 2. Intentar OSM Nominatim con timeout breve de 2s
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
        // Ignorar error de red
      }

      // 3. Fallback estético garantizado
      const matchedPreset = NEIGHBORHOOD_PRESETS.find(
        (p) => Math.abs(p.lat - newLat) < 0.03 && Math.abs(p.lng - newLng) < 0.03
      );
      const fallbackDisplay = matchedPreset
        ? `${matchedPreset.name} (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`
        : `Ubicación Seleccionada (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;

      setAddress(fallbackDisplay);
      onLocationChange(newLat, newLng, fallbackDisplay);
      setIsGeocoding(false);
    },
    [onLocationChange]
  );

  // Actualizar coordenadas y sincronizar estado
  const updateLocation = useCallback(
    (newLat: number, newLng: number, newAddr?: string) => {
      setLat(newLat);
      setLng(newLng);

      if (mapInstanceRef.current && markerInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: newLat, lng: newLng });
        markerInstanceRef.current.setPosition({ lat: newLat, lng: newLng });
      }

      if (newAddr) {
        setAddress(newAddr);
        onLocationChange(newLat, newLng, newAddr);
      } else {
        fetchAddressFromCoords(newLat, newLng);
      }
    },
    [fetchAddressFromCoords, onLocationChange]
  );

  // Carga opcional de Google Maps JS API si hay API key en variables de entorno
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (apiKey && typeof window !== "undefined") {
      if ((window as any).google?.maps) {
        initGoogleMap();
      } else {
        const existingScript = document.getElementById("google-maps-script");
        if (!existingScript) {
          const script = document.createElement("script");
          script.id = "google-maps-script";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.onload = () => initGoogleMap();
          script.onerror = () => setIsGoogleApiLoaded(false);
          document.head.appendChild(script);
        }
      }
    }

    function initGoogleMap() {
      if (!googleMapRef.current || !(window as any).google?.maps) return;

      try {
        const mapOptions = {
          center: { lat, lng },
          zoom: zoomLevel,
          styles: mapMode === "street" ? GOOGLE_MAPS_DARK_STYLE : [],
          mapTypeId: mapMode === "satellite" ? "hybrid" : "roadmap",
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        };

        const map = new (window as any).google.maps.Map(googleMapRef.current, mapOptions);
        const marker = new (window as any).google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
          animation: (window as any).google.maps.Animation.DROP,
        });

        map.addListener("click", (e: any) => {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          marker.setPosition({ lat: clickedLat, lng: clickedLng });
          updateLocation(clickedLat, clickedLng);
        });

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          updateLocation(pos.lat(), pos.lng());
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
        setIsGoogleApiLoaded(true);
      } catch {
        setIsGoogleApiLoaded(false);
      }
    }
  }, [lat, lng, mapMode, zoomLevel, updateLocation]);

  // Manejador seguro de GPS con timeout de 4 segundos (protección total contra trabas)
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
        notifyStatus("Señal GPS demorada. Podés elegir la dirección en la lista o buscador.");
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
        updateLocation(newLat, newLng);
        setIsLocating(false);
        notifyStatus("¡Ubicación GPS obtenida correctamente!");
      },
      (error) => {
        if (hasResponded) return;
        hasResponded = true;
        clearTimeout(timeoutId);
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          notifyStatus("Permiso GPS denegado. Escribí tu dirección o seleccioná en la lista.");
        } else {
          notifyStatus("No se pudo obtener señal GPS. Escribí tu dirección abajo.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 10000,
      }
    );
  };

  // Selección de barrio preset rápido
  const handleSelectPreset = (preset: (typeof NEIGHBORHOOD_PRESETS)[0]) => {
    setActivePreset(preset.name);
    setSearchQuery(preset.address);
    updateLocation(preset.lat, preset.lng, preset.address);
  };

  // Búsqueda por texto en barra de dirección
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
      notifyStatus(`Ubicación actualizada: ${customAddr}`);
    }
  };

  // Generación de URL estandarizada de Google Maps Embed para Previsualización Real
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    address || `${lat},${lng}`
  )}&t=${mapMode === "satellite" ? "k" : "m"}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="space-y-4 w-full">
      {/* Encabezado Principal y Botón GPS */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono tracking-wider uppercase text-[#C4B5FD] font-semibold px-2.5 py-0.5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30">
              <Sparkles className="size-3 text-[#A8FF35]" />
              Previsualización Google Maps Real
            </span>
          </div>
          <h3 className="text-[20px] font-extrabold text-[#F4F3F7] tracking-tight">
            ¿Dónde es el trabajo?
          </h3>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Comprobá la ubicación exacta de tu casa en el mapa de Google
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

      {/* Selector de Modo de Mapa (Callejero Dark vs Satélite Real HD) y Controles de Zoom */}
      <div className="flex items-center justify-between gap-2 bg-white/4 p-1.5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMapMode("street")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapMode === "street"
                ? "bg-[#7C5CFF] text-white shadow-md"
                : "bg-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Callejero Dark</span>
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
            <span>Satélite Real HD</span>
          </button>
        </div>

        {/* Controles de Zoom para Previsualización */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 1, 19))}
            className="size-7 rounded-lg bg-white/8 hover:bg-white/16 flex items-center justify-center text-white transition cursor-pointer"
            title="Acercar"
          >
            <Plus className="size-3.5" />
          </button>
          <span className="text-[10px] font-mono font-bold text-zinc-400 px-1">
            z{zoomLevel}
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 1, 12))}
            className="size-7 rounded-lg bg-white/8 hover:bg-white/16 flex items-center justify-center text-white transition cursor-pointer"
            title="Alejar"
          >
            <Minus className="size-3.5" />
          </button>
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
            placeholder="Escribí tu calle y altura (ej: Thames 1842, Palermo)..."
            className="w-full h-11 pl-10 pr-24 rounded-xl border border-white/12 bg-white/5 text-xs text-[#F4F3F7] placeholder-zinc-500 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-[#7C5CFF] hover:bg-[#6b47ff] text-[11px] font-bold text-white transition cursor-pointer"
          >
            Ver en mapa
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

      {/* CONTENEDOR DE PREVISUALIZACIÓN REAL EN GOOGLE MAPS */}
      <div className="relative h-72 w-full overflow-hidden rounded-[24px] border border-white/16 shadow-2xl bg-[#0d0d12]">
        {/* Instancia de Google Maps JS API (si existe API key) */}
        {isGoogleApiLoaded ? (
          <div ref={googleMapRef} className="h-full w-full" />
        ) : (
          /* Previsualizador Google Maps Embed Real con Filtro Oscuro / Satelital HD */
          <div className="relative h-full w-full overflow-hidden">
            <iframe
              title="Google Maps Location Preview"
              src={googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{
                border: 0,
                filter:
                  mapMode === "street"
                    ? "invert(90%) hue-rotate(180deg) contrast(1.15) saturate(1.2)"
                    : "contrast(1.08) brightness(0.95)",
              }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full pointer-events-auto"
            />
          </div>
        )}

        {/* Pin indicador Neón centrado sobre el mapa de Google */}
        <div className="absolute top-3 right-3 z-[20] rounded-xl bg-[#08080A]/90 backdrop-blur-md px-3.5 py-2 text-[11px] font-semibold text-[#F4F3F7] shadow-xl border border-white/15 flex items-center gap-2">
          <MapPin className="size-4 text-[#A8FF35]" />
          <span>
            {mapMode === "satellite" ? "Vista Satelital Google HD" : "Vista Google Maps Dark"}
          </span>
        </div>
      </div>

      {/* Campo de Confirmación de Dirección Seleccionada */}
      <div className="space-y-1.5">
        <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Dirección donde recibirás al profesional
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

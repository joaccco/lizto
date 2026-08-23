"use client";

import { MapPin, Navigation, Search, Check, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

interface MapPickerContainerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

// Google Maps Dark Theme Custom Styles JSON
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

  const googleMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Helper de notificación rápida
  const notifyStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Geocodificación inversa con fallback ultra-rápido (nunca se queda trabado)
  const fetchAddressFromCoords = useCallback(
    async (newLat: number, newLng: number) => {
      setIsGeocoding(true);

      // 1. Si tenemos Google Maps Geocoder disponible
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

      // 2. Intentar Nominatim u OpenStreetMap con timeout de 2.5s
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

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
        // Ignorar error de red y usar fallback estético de coordenadas
      }

      // 3. Fallback estético garantizado
      const matchedPreset = NEIGHBORHOOD_PRESETS.find(
        (p) => Math.abs(p.lat - newLat) < 0.03 && Math.abs(p.lng - newLng) < 0.03
      );
      const fallbackDisplay = matchedPreset
        ? `${matchedPreset.name} (Aprox. Lat: ${newLat.toFixed(4)}, Lng: ${newLng.toFixed(4)})`
        : `Zona Ubicación (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`;

      setAddress(fallbackDisplay);
      onLocationChange(newLat, newLng, fallbackDisplay);
      setIsGeocoding(false);
    },
    [onLocationChange]
  );

  // Actualizar coordenadas y sincronizar con mapa y padre
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

  // Inicializar Google Maps API si el Script está disponible en el entorno
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
          script.onerror = () => setIsGoogleMapsLoaded(false);
          document.head.appendChild(script);
        }
      }
    }

    function initGoogleMap() {
      if (!googleMapRef.current || !(window as any).google?.maps) return;

      try {
        const mapOptions = {
          center: { lat, lng },
          zoom: 15,
          styles: GOOGLE_MAPS_DARK_STYLE,
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
        setIsGoogleMapsLoaded(true);
      } catch {
        setIsGoogleMapsLoaded(false);
      }
    }
  }, [lat, lng, updateLocation]);

  // Manejador seguro de geolocalización del navegador con timeout estricto de 4s (NUNCA SE QUEDA TRABADO)
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      notifyStatus("Geolocalización no soportada en este navegador.");
      return;
    }

    setIsLocating(true);
    notifyStatus("Obteniendo tu ubicación GPS...");

    let hasResponded = false;

    const timeoutId = setTimeout(() => {
      if (!hasResponded) {
        hasResponded = true;
        setIsLocating(false);
        notifyStatus("La ubicación tardó demasiado. Usando posición predeterminada.");
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
        notifyStatus("Ubicación GPS obtenida exitosamente.");
      },
      (error) => {
        if (hasResponded) return;
        hasResponded = true;
        clearTimeout(timeoutId);
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          notifyStatus("Permiso de ubicación denegado. Seleccioná en el mapa o lista.");
        } else {
          notifyStatus("No se pudo obtener señal GPS. Podés elegir en el mapa.");
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
    updateLocation(preset.lat, preset.lng, preset.address);
  };

  // Búsqueda por texto en barra de búsqueda
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
      // Usar texto buscado directamente sin trabar la interfaz
      const customAddr = `${searchQuery.trim()}, Buenos Aires`;
      setAddress(customAddr);
      onLocationChange(lat, lng, customAddr);
      notifyStatus(`Ubicación fijada en: ${searchQuery}`);
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
              Google Maps Styled
            </span>
          </div>
          <h3 className="text-[20px] font-extrabold text-[#F4F3F7] tracking-tight">
            ¿Dónde necesitás el servicio?
          </h3>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Tocá en el mapa, usá tu GPS o seleccioná tu zona habitual
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-b from-white/14 to-white/[0.05] backdrop-blur-md border border-white/18 text-xs font-bold text-[#F4F3F7] shadow-lg shrink-0 hover:bg-white/20 active:scale-95 transition cursor-pointer"
        >
          <Navigation className={`size-4 text-[#A8FF35] ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Buscando GPS..." : "Mi ubicación"}</span>
        </button>
      </div>

      {/* Banner de Estado / Notificación Flotante */}
      {statusMessage && (
        <div className="rounded-xl border border-[#7C5CFF]/40 bg-[#7C5CFF]/12 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#D8B4FE] animate-in fade-in duration-200 flex items-center gap-2 shadow-md">
          <span className="size-1.5 rounded-full bg-[#A8FF35] animate-pulse shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Barra de Búsqueda de Ubicación */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar barrio o calle (ej: Palermo, Recoleta, Cabildo 2000)..."
            className="w-full h-11 pl-10 pr-24 rounded-xl border border-white/12 bg-white/5 text-xs text-[#F4F3F7] placeholder-zinc-500 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-[#7C5CFF] hover:bg-[#6b47ff] text-[11px] font-bold text-white transition cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Presets Rápidos de Barrios / Zonas */}
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

      {/* Google Maps Container Component / Styled Interactive Map Canvas */}
      <div className="relative h-72 w-full overflow-hidden rounded-[24px] border border-white/14 shadow-2xl bg-[#0d0d12]">
        {/* Contenedor DOM para la instancia de Google Maps */}
        <div ref={googleMapRef} className="h-full w-full" />

        {/* Fallback Interactive Visual Styling Canvas cuando Google Maps API Key no se ha inyectado en ENV */}
        {!isGoogleMapsLoaded && (
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              // Mapeo dinámico de coordenadas en el lienzo interactivo
              const offsetLat = ((clickY - rect.height / 2) / rect.height) * -0.04;
              const offsetLng = ((clickX - rect.width / 2) / rect.width) * 0.04;
              const newLat = lat + offsetLat;
              const newLng = lng + offsetLng;
              updateLocation(newLat, newLng);
            }}
            className="absolute inset-0 z-10 cursor-crosshair flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#11111a] via-[#0d0d14] to-[#09090d]"
          >
            {/* Grid de Fondo de Estilo Mapa Oscuro de Google Maps */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#7C5CFF_1px,transparent_1px)] [background-size:20px_20px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:40px_40px] opacity-25" />

            {/* Líneas de Calles Simuladas en Modo Oscuro */}
            <div className="absolute inset-x-0 top-1/3 h-2 bg-[#332a68]/40 border-y border-[#7C5CFF]/20" />
            <div className="absolute inset-x-0 top-2/3 h-1.5 bg-[#20202e]/60" />
            <div className="absolute inset-y-0 left-1/3 w-2 bg-[#332a68]/40 border-x border-[#7C5CFF]/20" />
            <div className="absolute inset-y-0 left-2/3 w-1.5 bg-[#20202e]/60" />

            {/* Pin de Ubicación en Estilo Neón Google Dark */}
            <div className="relative z-20 flex flex-col items-center animate-bounce">
              <div className="flex items-center justify-center size-12 rounded-full bg-[#7C5CFF] text-white shadow-[0_0_30px_#7C5CFF] border-2 border-[#A8FF35]">
                <MapPin className="size-6 text-white" />
              </div>
              <div className="w-3 h-1.5 bg-[#A8FF35] rounded-full blur-[2px] mt-1" />
            </div>

            {/* Chip de Coordenadas Flotantes */}
            <div className="mt-4 z-20 rounded-xl bg-[#08080A]/90 backdrop-blur-md px-4 py-2 text-xs font-semibold text-[#F4F3F7] shadow-xl border border-white/15 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#A8FF35] animate-ping" />
              <span>
                Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}

        {/* Chip Flotante Informativo sobre el Mapa */}
        <div className="absolute top-3 left-3 z-[20] rounded-xl bg-[#08080A]/85 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-semibold text-[#F4F3F7] shadow-md border border-white/12 flex items-center gap-2 pointer-events-none">
          <MapPin className="size-3.5 text-[#A8FF35]" />
          <span>Tocá en cualquier punto para mover el pin</span>
        </div>
      </div>

      {/* Campo de Dirección Seleccionada */}
      <div className="space-y-1.5">
        <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Dirección confirmada para la visita
        </label>
        <div className="flex items-center gap-3 rounded-[18px] border border-white/12 bg-white/6 p-3.5 shadow-md focus-within:border-[#7C5CFF] focus-within:ring-1 focus-within:ring-[#7C5CFF] transition">
          <div className="size-8 rounded-lg bg-[#7C5CFF]/15 text-[#8B6BFF] flex items-center justify-center shrink-0">
            <MapPin className="size-4" />
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

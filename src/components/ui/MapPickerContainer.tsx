"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Custom prominent pin icon for Leaflet
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
});

interface MapPickerContainerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Map Click Listener to pin anywhere on map click
function MapEvents({ onSelectCoords }: { onSelectCoords: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelectCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPickerContainer({
  initialLat = -27.4692,
  initialLng = -58.8306,
  initialAddress = "Córdoba 456, Corrientes",
  onLocationChange,
}: MapPickerContainerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState(initialAddress);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);

  const fetchAddressFromCoords = async (newLat: number, newLng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        const display = data.display_name
          ? data.display_name.split(",").slice(0, 3).join(",")
          : `Lat: ${newLat.toFixed(3)}, Lng: ${newLng.toFixed(3)}`;
        setAddress(display);
        onLocationChange(newLat, newLng, display);
      } else {
        const fallback = `Lat: ${newLat.toFixed(3)}, Lng: ${newLng.toFixed(3)}`;
        setAddress(fallback);
        onLocationChange(newLat, newLng, fallback);
      }
    } catch {
      const fallback = `Lat: ${newLat.toFixed(3)}, Lng: ${newLng.toFixed(3)}`;
      setAddress(fallback);
      onLocationChange(newLat, newLng, fallback);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSelectCoords = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    fetchAddressFromCoords(newLat, newLng);
  };

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          handleSelectCoords(latLng.lat, latLng.lng);
        }
      },
    }),
    []
  );

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        handleSelectCoords(newLat, newLng);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  const handleAddressInputChange = (newAddr: string) => {
    setAddress(newAddr);
    onLocationChange(lat, lng, newAddr);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            ¿Dónde necesitás el servicio?
          </h3>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Tocá cualquier lugar del mapa o arrastrá el pin para marcar tu casa
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs font-semibold text-[#4F46E5] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 shadow-sm"
        >
          <Navigation className={`size-3.5 ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Ubicando..." : "Mi ubicación"}</span>
        </button>
      </div>

      {/* Container Leaflet */}
      <div className="relative h-72 w-full overflow-hidden rounded-3xl border-2 border-indigo-200 dark:border-zinc-700 shadow-md">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full z-0 cursor-crosshair"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[lat, lng]}
            ref={markerRef}
            icon={customIcon}
          />
          <MapEvents onSelectCoords={handleSelectCoords} />
          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>

        {/* Floating helper overlay tag */}
        <div className="absolute top-3 left-3 z-[400] rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 shadow-md border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1.5">
          <MapPin className="size-3.5 text-[#4F46E5]" />
          <span>Tocá en el mapa o arrastrá el pin</span>
        </div>
      </div>

      {/* Address Input Field */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Dirección seleccionada
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 shadow-sm">
          <MapPin className="size-4 text-[#4F46E5] shrink-0" />
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressInputChange(e.target.value)}
            placeholder="Ej: Córdoba 456, Corrientes"
            className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none placeholder-zinc-400"
          />
          {isGeocoding && <span className="text-[10px] text-zinc-400 animate-pulse">Obteniendo dirección...</span>}
        </div>
      </div>
    </div>
  );
}

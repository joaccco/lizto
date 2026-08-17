"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

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
  initialAddress = "Thames 1842, Palermo",
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
    <div className="space-y-4 w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[20px] font-bold text-[#F4F3F7]">
            ¿Dónde necesitás el servicio?
          </h3>
          <p className="text-xs text-[#A78BFA] font-medium mt-0.5">
            Tocá cualquier lugar del mapa o arrastrá el pin para marcar tu casa
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-b from-white/12 to-white/[0.045] backdrop-blur-md border border-white/15 text-xs font-semibold text-[#F4F3F7] shadow-sm shrink-0 hover:bg-white/20 transition cursor-pointer"
        >
          <Navigation className={`size-3.5 text-[#A8FF35] ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Ubicando..." : "Mi ubicación"}</span>
        </button>
      </div>

      {/* Leaflet Map */}
      <div className="relative h-72 w-full overflow-hidden rounded-[24px] border border-white/12 shadow-2xl">
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

        {/* Map Helper Chip */}
        <div className="absolute top-3 left-3 z-[400] rounded-xl bg-[#08080A]/85 backdrop-blur-md px-3 py-1.5 text-[11px] font-semibold text-[#F4F3F7] shadow-md border border-white/12 flex items-center gap-1.5">
          <MapPin className="size-3.5 text-[#8B6BFF]" />
          <span>Tocá en el mapa o arrastrá el pin</span>
        </div>
      </div>

      {/* Address Field */}
      <div className="space-y-1.5">
        <label className="block text-[10.5px] font-mono tracking-wider uppercase text-zinc-400 font-semibold">
          Dirección seleccionada
        </label>
        <div className="flex items-center gap-2.5 rounded-[18px] border border-white/10 bg-white/5 p-3.5 shadow-sm">
          <MapPin className="size-4 text-[#8B6BFF] shrink-0" />
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressInputChange(e.target.value)}
            placeholder="Ej: Thames 1842, Palermo"
            className="w-full bg-transparent text-sm font-semibold text-[#F4F3F7] outline-none placeholder-zinc-500"
          />
          {isGeocoding && <span className="text-[10px] text-zinc-400 animate-pulse shrink-0">Obteniendo dirección...</span>}
        </div>
      </div>
    </div>
  );
}

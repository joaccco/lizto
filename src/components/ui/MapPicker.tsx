"use client";

import dynamic from "next/dynamic";

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  onBack?: () => void;
  fullScreen?: boolean;
}

const DynamicMapPickerContainer = dynamic(
  () => import("./MapPickerContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 w-full animate-pulse">
        <div className="h-6 w-1/2 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-64 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-12 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    ),
  }
);

export function MapPicker(props: MapPickerProps) {
  return <DynamicMapPickerContainer {...props} />;
}

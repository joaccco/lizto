"use client";

import {
  Calculator,
  Camera,
  Droplets,
  Grid2x2,
  Key,
  Palette,
  Scale,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface CategoryItem {
  slug: string;
  label: string;
  icon: typeof Camera;
}

const CATEGORIES: CategoryItem[] = [
  { slug: "cerrajeria", label: "Cerrajería", icon: Key },
  { slug: "electricista", label: "Electricista", icon: Zap },
  { slug: "plomeria", label: "Plomería", icon: Droplets },
  { slug: "fotografia", label: "Fotografía", icon: Camera },
  { slug: "abogado", label: "Abogado", icon: Scale },
  { slug: "contador", label: "Contador", icon: Calculator },
  { slug: "diseno", label: "Diseño", icon: Palette },
  { slug: "ver-mas", label: "Ver más", icon: Grid2x2 },
];

interface CategoryGridProps {
  className?: string;
}

export function CategoryGrid({ className }: CategoryGridProps) {
  const router = useRouter();

  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {CATEGORIES.map((category) => {
        const Icon = category.icon;

        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => router.push(`/search?category=${category.slug}`)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-2 py-3 text-center transition-colors hover:border-[#C7D2FE]"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <Icon className="size-5" />
            </div>
            <span className="text-[11px] leading-tight font-medium text-gray-700">
              {category.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

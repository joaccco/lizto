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
  hint: string;
}

const CATEGORIES: CategoryItem[] = [
  { slug: "cerrajeria", label: "Cerrajería", hint: "Aperturas y llaves", icon: Key },
  { slug: "electricista", label: "Electricidad", hint: "Hogar y comercios", icon: Zap },
  { slug: "plomeria", label: "Plomería", hint: "Pérdidas y arreglos", icon: Droplets },
  { slug: "fotografia", label: "Fotografía", hint: "Eventos y producto", icon: Camera },
  { slug: "abogado", label: "Abogacía", hint: "Consulta profesional", icon: Scale },
  { slug: "contador", label: "Contabilidad", hint: "Impuestos y gestión", icon: Calculator },
  { slug: "diseno", label: "Diseño", hint: "Marca y comunicación", icon: Palette },
  { slug: "ver-mas", label: "Más servicios", hint: "Ver categorías", icon: Grid2x2 },
];

interface CategoryGridProps {
  className?: string;
}

export function CategoryGrid({ className }: CategoryGridProps) {
  const router = useRouter();

  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)}>
      {CATEGORIES.map((category) => {
        const Icon = category.icon;

        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => router.push(`/search?category=${category.slug}`)}
            className="group flex items-center gap-3 rounded-2xl border border-[#E4E4E0] bg-white p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F0FF] text-[#4F46E5] transition-colors group-hover:bg-indigo-100">
              <Icon className="size-[18px]" />
            </div>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-zinc-800">
                {category.label}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-zinc-400">
                {category.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

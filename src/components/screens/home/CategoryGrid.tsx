"use client";

import {
  Brush,
  Calculator,
  Camera,
  Droplets,
  Grid2x2,
  Lock,
  Scale,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useCategories, type Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, LucideIcon> = {
  cerrajeria: Lock,
  electricidad: Zap,
  electricista: Zap,
  plomeria: Droplets,
  fotografia: Camera,
  abogacia: Scale,
  abogado: Scale,
  contaduria: Calculator,
  contador: Calculator,
  diseno: Brush,
  limpieza: Sparkles,
};

interface CategoryGridProps {
  categories?: Category[];
  onSelectCategory?: (categoryName: string) => void;
  className?: string;
}

export function CategoryGrid({
  categories: propCategories,
  onSelectCategory,
  className,
}: CategoryGridProps) {
  const router = useRouter();
  const { categories: fetchedCategories } = useCategories();

  const categories = propCategories || fetchedCategories;

  const handleClick = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category.name);
    } else {
      router.push(`/search?category=${category.slug}`);
    }
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)}>
      {categories.map((category) => {
        const Icon = categoryIcons[category.slug] || Grid2x2;

        return (
          <button
            key={category.id || category.slug}
            type="button"
            onClick={() => handleClick(category)}
            className="group flex min-h-[56px] items-center gap-3 rounded-2xl border border-[#E4E4E0] dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-left transition-colors hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F0FF] dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50">
              <Icon className="size-[18px]" />
            </div>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {category.name}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                Servicio profesional
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

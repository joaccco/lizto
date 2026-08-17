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
      router.push(`/?category=${category.slug}`);
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
            className="group flex h-[92px] flex-col justify-between rounded-[20px] bg-[#131318] border border-white/8 p-4 text-left transition-all hover:border-[#8B6BFF]/40 hover:bg-[#191920] cursor-pointer"
          >
            <div className="flex size-7 items-center justify-center rounded-lg border border-[#7C5CFF]/55 bg-[#7C5CFF]/10 text-[#C4B5FD]">
              <Icon className="size-4" />
            </div>
            <span className="text-base font-bold text-[#F4F3F7]">
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { CategoryGrid } from "@/components/screens/home/CategoryGrid";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { useCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";

export default function CategoriesPage() {
  const router = useRouter();
  const { categories } = useCategories();

  const handleSelectCategory = (catName: string) => {
    sessionStorage.setItem("selected_category", catName);
    router.push("/");
  };

  return (
    <ScreenShell className="py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-[28px] leading-tight font-extrabold text-[#F4F3F7]">
          Explorá profesionales por rubro
        </h1>
        <p className="text-sm text-zinc-400">
          O contale a Lizto qué necesitás y lo resolvemos por vos.
        </p>
      </div>

      <CategoryGrid categories={categories} onSelectCategory={handleSelectCategory} />
    </ScreenShell>
  );
}

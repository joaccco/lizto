"use client";

import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RankedList } from "@/components/screens/fast-mode/RankedList";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PrimaryActionProps {
  topProvider: Provider;
  providers: Provider[];
  className?: string;
}

export function PrimaryAction({
  topProvider,
  providers,
  className,
}: PrimaryActionProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      <Button
        onClick={() => router.push(`/chat/${topProvider.id}`)}
        className="h-12 w-full rounded-2xl bg-[#4F46E5] text-sm font-semibold text-white hover:bg-[#4338CA]"
      >
        <Zap className="size-4" />
        Contactar a {topProvider.name} ahora
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E5E7EB]" />
        <span className="text-xs text-gray-400">o</span>
        <div className="h-px flex-1 bg-[#E5E7EB]" />
      </div>

      <Button
        variant="outline"
        onClick={() => setIsDrawerOpen(true)}
        className="h-12 w-full rounded-2xl border-[#E5E7EB] bg-white text-sm font-medium text-gray-700"
      >
        Ver los 3 perfiles completos
      </Button>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="mx-auto max-w-[430px] rounded-t-2xl">
          <DrawerHeader>
            <DrawerTitle>Perfiles disponibles</DrawerTitle>
            <DrawerDescription>
              Los 3 profesionales más cercanos listos para atender tu urgencia.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <RankedList providers={providers} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

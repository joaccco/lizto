"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";

export function ConditionalBottomNav() {
  const pathname = usePathname();
  const hideOnPaths = ["/login", "/register", "/survey", "/work-confirmed"];

  if (hideOnPaths.includes(pathname)) {
    return null;
  }

  return <BottomNav />;
}

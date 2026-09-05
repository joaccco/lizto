"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";

export function ConditionalBottomNav() {
  const pathname = usePathname();
  const hideExactPaths = ["/login", "/register", "/survey", "/work-confirmed"];

  if (hideExactPaths.includes(pathname) || pathname.startsWith("/provider")) {
    return null;
  }

  return <BottomNav />;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, Home, ListOrdered, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Inicio",
      href: "/",
      icon: Home,
    },
    {
      label: "Rubros",
      href: "/categories",
      icon: Grid2x2,
    },
    {
      label: "Pedidos",
      href: "/my-requests",
      icon: ListOrdered,
    },
    {
      label: "Perfil",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto h-[64px] rounded-[22px] flex items-center justify-around bg-[#131318]/90 dark:bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1.5 transition-colors ${
              isActive
                ? "text-indigo-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <div className={`flex size-4 items-center justify-center rounded-md ${isActive ? "bg-[#8B6BFF] shadow-[0_0_14px_rgba(124,92,255,0.7)] text-white" : ""}`}>
              <Icon className="size-3.5" />
            </div>
            <span className={`text-[10.5px] font-semibold leading-none ${isActive ? "text-white font-bold" : "text-zinc-400"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

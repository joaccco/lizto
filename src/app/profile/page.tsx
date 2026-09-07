"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const userName = user?.name || "";
  const userEmail = user?.email || "";

  return (
    <ScreenShell className="py-8 space-y-8">
      {/* Header Profile Section */}
      <div className="flex items-center gap-4">
        <div className="size-[66px] rounded-full bg-[#1D1D25] border border-white/11 flex items-center justify-center font-bold text-lg text-zinc-300 shrink-0">
          {getInitials(userName)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-[#F4F3F7] truncate">
            {userName || "Mi Perfil"}
          </h1>
          <p className="text-[13.5px] text-zinc-400 truncate mt-0.5">
            {userEmail}
          </p>
        </div>
      </div>

      {/* Provider Mode Banner if Provider */}
      {isAuthenticated && user && (user.roles?.includes("provider") || user.has_provider_profile) && (
        <div className="rounded-[20px] border border-[#7C5CFF]/30 bg-[#7C5CFF]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#A78BFA] font-bold">
              Modo profesional
            </span>
            <ShieldCheck className="size-4 text-[#8B6BFF]" />
          </div>
          <p className="text-xs text-zinc-300">
            Gestioná tu disponibilidad, trabajos recibidos y configurá tu perfil profesional.
          </p>
          <Link
            href="/provider"
            className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#7C5CFF] text-xs font-bold text-white hover:bg-[#6b47ff] transition"
          >
            Ir a mi panel de trabajo
          </Link>
        </div>
      )}

      {/* Appearance Segmented Control */}
      <div className="space-y-3">
        <div className="text-[10.5px] font-mono tracking-widest uppercase text-zinc-500 font-semibold">
          Apariencia
        </div>
        <div className="flex gap-2 p-1.5 rounded-[16px] bg-white/5 border border-white/9">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex-1 h-[44px] rounded-[12px] text-[13.5px] font-semibold transition cursor-pointer ${
              theme === "light"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 text-[#F4F3F7] shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex-1 h-[44px] rounded-[12px] text-[13.5px] font-semibold transition cursor-pointer ${
              theme === "system"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 text-[#F4F3F7] shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Automático
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex-1 h-[44px] rounded-[12px] text-[13.5px] font-semibold transition cursor-pointer ${
              theme === "dark"
                ? "bg-gradient-to-b from-white/14 to-white/6 border border-white/16 text-[#F4F3F7] shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Oscuro
          </button>
        </div>
      </div>

      {/* Settings List Rows */}
      <div className="divide-y divide-white/6 pt-2">
        <Link
          href="/my-requests"
          className="flex items-center justify-between py-4 group cursor-pointer"
        >
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Mis solicitudes
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </Link>
        <div className="flex items-center justify-between py-4 group cursor-pointer">
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Direcciones guardadas
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </div>
        <div className="flex items-center justify-between py-4 group cursor-pointer">
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Notificaciones
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </div>
        <div className="flex items-center justify-between py-4 group cursor-pointer">
          <span className="text-[16px] font-semibold text-[#F4F3F7] group-hover:text-indigo-300 transition">
            Ayuda
          </span>
          <ChevronRight className="size-4 text-zinc-500 group-hover:text-white transition" />
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="pt-6 flex items-center justify-between">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="text-[15px] font-semibold text-zinc-400 hover:text-red-400 transition flex items-center gap-2"
          >
            <LogOut className="size-4" />
            <span>Cerrar sesión</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="text-[15px] font-semibold text-[#8B6BFF] hover:text-indigo-300 transition"
          >
            Iniciar sesión
          </Link>
        )}
        <span className="text-[11px] font-mono text-zinc-600">v 2.0</span>
      </div>
    </ScreenShell>
  );
}

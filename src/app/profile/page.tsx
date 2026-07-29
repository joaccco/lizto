"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Monitor, Moon, LogOut, User, ShieldCheck, ClipboardList, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
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

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-900 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Mi perfil
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gestioná tu cuenta y tus preferencias de aplicación
          </p>
        </div>

        {/* User Card or Guest Card */}
        {isAuthenticated && user ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-5 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#4F46E5] text-lg font-bold text-white shadow-sm">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {user.name}
                </h2>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </p>
                {user.roles && user.roles.length > 0 && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-semibold text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                    <ShieldCheck className="size-3" />
                    {user.roles.join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 p-6 text-center shadow-sm space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400">
              <User className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                ¿Aún no iniciaste sesión?
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Accedé a tu cuenta para gestionar tus solicitudes y contrataciones.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                className="w-full h-10 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-sm transition flex items-center justify-center shadow-sm"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="w-full h-10 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-800 dark:text-zinc-200 font-medium text-sm transition flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        )}

        {/* Configuration Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
            Configuración
          </h3>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-700/50 shadow-sm overflow-hidden">
            {/* Appearance Option */}
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Apariencia
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Claro, oscuro o automático
                </p>
              </div>

              {mounted && (
                <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      theme === "light"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Sun className="size-3.5" />
                    <span>Claro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      theme === "system"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Monitor className="size-3.5" />
                    <span>Auto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      theme === "dark"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Moon className="size-3.5" />
                    <span>Oscuro</span>
                  </button>
                </div>
              )}
            </div>

            {/* My Requests Option */}
            <Link
              href="/my-requests"
              className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400">
                  <ClipboardList className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Mis solicitudes
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ver tus búsquedas anteriores
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
            </Link>

            {/* Logout Option (only if authenticated) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-red-50/50 dark:hover:bg-red-950/20 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                    <LogOut className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Cerrar sesión
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Salir de tu cuenta actual
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

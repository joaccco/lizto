"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { User, Briefcase, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, fieldErrors } = useAuth();
  const [role, setRole] = useState<"client" | "provider">("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      router.push("/");
    } catch {
      // Error is handled in hook state
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center text-center">
          <Link href="/" className="inline-flex items-center text-3xl font-extrabold tracking-tight">
            <span className="text-slate-900 dark:text-zinc-100">Liz</span>
            <span className="text-[#4F46E5]">to</span>
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Crear cuenta
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-zinc-400">
          Unite a Lizto y comenzá en segundos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px]">
        <div className="bg-white dark:bg-zinc-800 py-8 px-6 shadow-sm border border-slate-200 dark:border-zinc-700/60 rounded-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                ¿Cómo vas a usar Lizto?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center transition ${
                    role === "client"
                      ? "border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/30 text-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                      : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-700/30 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <User className="size-5 mb-1" />
                  <span className="text-xs font-semibold text-center">Busco servicios</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 text-center mt-0.5">Cliente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("provider")}
                  className={`p-3 rounded-xl border text-left flex flex-col items-center justify-center transition ${
                    role === "provider"
                      ? "border-[#4F46E5] bg-indigo-50/50 dark:bg-indigo-950/30 text-[#4F46E5] ring-2 ring-[#4F46E5]/20"
                      : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-700/30 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <Briefcase className="size-5 mb-1" />
                  <span className="text-xs font-semibold text-center">Ofrezco servicios</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 text-center mt-0.5">Proveedor</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
              />
              {fieldErrors?.name && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.name[0]}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
              />
              {fieldErrors?.email && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full h-10 pl-3 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldErrors?.password && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.password[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-500 dark:text-zinc-400">¿Ya tenés cuenta? </span>
            <Link href="/login" className="font-semibold text-[#4F46E5] hover:underline">
              Iniciá sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

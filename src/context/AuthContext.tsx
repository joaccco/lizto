"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { ENDPOINTS } from "@/lib/endpoints";
import type { User, AuthResponse } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: "client" | "provider"
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    return authStorage.getUser();
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return authStorage.getToken();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const isAuthenticated = !!token && !!user;

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      setFieldErrors(null);

      try {
        const response = await apiFetch<AuthResponse>(ENDPOINTS.LOGIN, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        const { user: userData, token: userToken } = response.data;

        authStorage.clear();
        authStorage.setToken(userToken);
        authStorage.setUser(userData);

        setToken(userToken);
        setUser(userData);

        router.push("/");
      } catch (err: unknown) {
        const apiErr = err as { message?: string; errors?: Record<string, string[]> };
        setError(apiErr?.message || "Credenciales incorrectas.");
        if (apiErr?.errors) {
          setFieldErrors(apiErr.errors);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role: "client" | "provider") => {
      setIsLoading(true);
      setError(null);
      setFieldErrors(null);

      try {
        const response = await apiFetch<AuthResponse>(ENDPOINTS.REGISTER, {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            password_confirmation: password,
            role,
          }),
        });

        const { user: userData, token: userToken } = response.data;

        authStorage.clear();
        authStorage.setToken(userToken);
        authStorage.setUser(userData);

        setToken(userToken);
        setUser(userData);

        router.push("/");
      } catch (err: unknown) {
        const apiErr = err as { message?: string; errors?: Record<string, string[]> };
        setError(apiErr?.message || "Error al crear la cuenta.");
        if (apiErr?.errors) {
          setFieldErrors(apiErr.errors);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiFetch(ENDPOINTS.LOGOUT, { method: "POST" });
    } catch {
      // Ignorar errores de logout
    } finally {
      authStorage.clear();
      setUser(null);
      setToken(null);
      setError(null);
      setFieldErrors(null);
      setIsLoading(false);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        fieldErrors,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

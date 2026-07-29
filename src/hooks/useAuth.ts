"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { ENDPOINTS } from "@/lib/endpoints";
import type { User, AuthResponse } from "@/lib/types";

export interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "client" | "provider") => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUser();
    setToken(storedToken);
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setFieldErrors(null);

    try {
      const response = await apiFetch<AuthResponse>(ENDPOINTS.LOGIN, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const { user: fetchedUser, token: fetchedToken } = response.data;
      authStorage.setToken(fetchedToken);
      authStorage.setUser(fetchedUser);

      setToken(fetchedToken);
      setUser(fetchedUser);
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      setError(apiErr.message || "Error al iniciar sesión");
      if (apiErr.errors) {
        setFieldErrors(apiErr.errors);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: "client" | "provider") => {
      setIsLoading(true);
      setError(null);
      setFieldErrors(null);

      try {
        const response = await apiFetch<AuthResponse>(ENDPOINTS.REGISTER, {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        });

        const { user: fetchedUser, token: fetchedToken } = response.data;
        authStorage.setToken(fetchedToken);
        authStorage.setUser(fetchedUser);

        setToken(fetchedToken);
        setUser(fetchedUser);
      } catch (err: unknown) {
        const apiErr = err as { message?: string; errors?: Record<string, string[]> };
        setError(apiErr.message || "Error al crear la cuenta");
        if (apiErr.errors) {
          setFieldErrors(apiErr.errors);
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiFetch(ENDPOINTS.LOGOUT, { method: "POST" });
    } catch {
      // Ignore errors on logout endpoint
    } finally {
      authStorage.clear();
      setToken(null);
      setUser(null);
      setError(null);
      setFieldErrors(null);
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    token,
    isLoading,
    error,
    fieldErrors,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };
}

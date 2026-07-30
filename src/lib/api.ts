import { authStorage } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Leer token en cada llamada
  const token = authStorage.getToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const { headers: optionHeaders, ...restOptions } = options || {};

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      signal: controller.signal,
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...optionHeaders,
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401) {
        authStorage.clear();
      }
      const error = await res.json().catch(() => ({}));
      throw error;
    }

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

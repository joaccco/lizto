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
    let correlationId: string | undefined;

    if (optionHeaders && typeof optionHeaders === "object") {
      correlationId = (optionHeaders as Record<string, string>)["X-Correlation-ID"];
    }

    if (!correlationId) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        correlationId = crypto.randomUUID();
      } else {
        correlationId = "web_" + Math.random().toString(36).substring(2, 15);
      }
    }

    const isFormData = typeof FormData !== "undefined" && restOptions.body instanceof FormData;

    const baseHeaders: Record<string, string> = {
      Accept: "application/json",
      "X-Correlation-ID": correlationId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (!isFormData) {
      baseHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      signal: controller.signal,
      ...restOptions,
      headers: {
        ...baseHeaders,
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

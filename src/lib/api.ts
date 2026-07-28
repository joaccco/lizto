const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? `API error: ${res.status}`);
  }

  return res.json();
}

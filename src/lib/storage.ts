import type { ParsedRequest, Provider } from "@/lib/types";

const PARSED_REQUEST_KEY = "lizto:parsed-request";
const PROVIDERS_KEY = "lizto:providers";

export function saveSearchSession(
  parsedRequest: ParsedRequest,
  providers: Provider[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(PARSED_REQUEST_KEY, JSON.stringify(parsedRequest));
  sessionStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
}

export function loadParsedRequest(): ParsedRequest | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(PARSED_REQUEST_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ParsedRequest;
  } catch {
    return null;
  }
}

export function loadProviders(): Provider[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = sessionStorage.getItem(PROVIDERS_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Provider[];
  } catch {
    return [];
  }
}

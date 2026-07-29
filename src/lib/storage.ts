import type { ParsedRequest, Provider } from "@/lib/types";

const PARSED_REQUEST_KEY = "lizto:parsed-request";
const PROVIDERS_KEY = "lizto:providers";
const SESSION_CHANGE_EVENT = "lizto:session-change";

export interface SearchSession {
  parsedRequest: ParsedRequest;
  providers: Provider[];
}

let cachedParsedRaw: string | null = null;
let cachedProvidersRaw: string | null = null;
let cachedSession: SearchSession | null = null;

export function saveSearchSession(
  parsedRequest: ParsedRequest,
  providers: Provider[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(PARSED_REQUEST_KEY, JSON.stringify(parsedRequest));
  sessionStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function loadSearchSession(): SearchSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const parsedRaw = sessionStorage.getItem(PARSED_REQUEST_KEY);
  const providersRaw = sessionStorage.getItem(PROVIDERS_KEY);

  if (!parsedRaw || !providersRaw) {
    return null;
  }

  if (
    cachedSession &&
    parsedRaw === cachedParsedRaw &&
    providersRaw === cachedProvidersRaw
  ) {
    return cachedSession;
  }

  try {
    cachedSession = {
      parsedRequest: JSON.parse(parsedRaw) as ParsedRequest,
      providers: JSON.parse(providersRaw) as Provider[],
    };
    cachedParsedRaw = parsedRaw;
    cachedProvidersRaw = providersRaw;
    return cachedSession;
  } catch {
    return null;
  }
}

export function subscribeSearchSession(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(SESSION_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

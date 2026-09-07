/**
 * Frontend Error Tracker and Privacy Sanitizer.
 * Captures unhandled errors and unhandled promise rejections.
 * Configured via environment variables and sanitized to prevent personal data leaks.
 */

const SENSITIVE_KEYS = [
  "email",
  "phone",
  "phone_number",
  "address",
  "location_address",
  "base_address",
  "lat",
  "lng",
  "base_lat",
  "base_lng",
  "location_lat",
  "location_lng",
  "password",
  "password_confirmation",
  "token",
  "session_token",
  "device_token",
  "auth_token",
  "access_token",
  "authorization",
  "secret",
  "credentials",
  "api_key",
  "key",
  "name",
  "commercial_name",
  "user_name",
];

export function isFrontendErrorTrackerEnabled(): boolean {
  const enabled = process.env.NEXT_PUBLIC_ERROR_TRACKER_ENABLED;
  const dsn = process.env.NEXT_PUBLIC_ERROR_TRACKER_DSN;
  return Boolean(enabled === "true" || enabled === "1") && Boolean(dsn);
}

export function sanitizeFrontendPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFrontendPayload(item));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.includes(lowerKey)) {
      if (["name", "commercial_name", "user_name"].includes(lowerKey)) {
        continue;
      }
      sanitized[key] = "[FILTERED]";
      continue;
    }

    if (value && typeof value === "object") {
      sanitized[key] = sanitizeFrontendPayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function captureFrontendError(error: unknown, context?: Record<string, unknown>): void {
  if (!isFrontendErrorTrackerEnabled()) return;

  try {
    const sanitizedContext = context ? sanitizeFrontendPayload(context) : {};
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("[ERROR_TRACKER]", {
      message: errorMessage,
      stack: errorStack,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Graceful degradation: never crash UI
  }
}

let isInitialized = false;

export function initFrontendErrorTracker(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // Capture unhandled JS runtime exceptions
  window.addEventListener("error", (event) => {
    try {
      captureFrontendError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    } catch {
      // Graceful degradation
    }
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    try {
      captureFrontendError(event.reason, {
        type: "unhandledrejection",
      });
    } catch {
      // Graceful degradation
    }
  });
}

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

export interface PushNotificationPayload {
  event_type?: string;
  type?: string;
  target?: string;
  conversation_id?: string;
  service_request_id?: string;
  work_id?: string;
  target_id?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Retrieves Firebase Web configuration strictly from environment variables.
 */
export function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
  };
}

/**
 * Checks if Firebase configuration and VAPID key are provided in environment variables.
 */
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.vapidKey);
}

let firebaseAppInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;

  if (!firebaseAppInstance) {
    const config = getFirebaseConfig();
    firebaseAppInstance = getApps().length > 0 ? getApp() : initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });
  }
  return firebaseAppInstance;
}

function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;

  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch {
      messagingInstance = null;
    }
  }
  return messagingInstance;
}

/**
 * Resolves destination URL from push notification payload data.
 */
export function resolvePushRoute(data?: PushNotificationPayload): string {
  if (!data) return "/";

  if (typeof data.url === "string" && data.url.startsWith("/")) {
    return data.url;
  }

  const eventType = data.event_type || data.type || data.target || "";

  switch (eventType) {
    case "message_sent":
    case "new_message":
      if (data.conversation_id || data.target_id) {
        return `/conversations/${data.conversation_id || data.target_id}`;
      }
      return "/conversations";

    case "offer_created":
    case "work_created":
    case "work_request":
    case "incoming_request":
      return "/provider";

    case "offer_accepted":
    case "offer_rejected":
    case "quote_submitted":
    case "quote_confirmed":
    case "quote_rejected":
    case "final_quote":
      if (data.conversation_id) {
        return `/conversations/${data.conversation_id}`;
      }
      return "/provider";

    case "work_scheduled":
    case "work_completed":
      if (data.work_id) {
        return `/works/${data.work_id}`;
      }
      return "/provider";

    default:
      if (data.conversation_id) return `/conversations/${data.conversation_id}`;
      if (data.service_request_id) return `/survey`;
      return "/";
  }
}

/**
 * Requests push permission and obtains a REAL FCM token from Firebase Cloud Messaging.
 * Implements graceful degradation: if unsupported, denied, or unconfigured, returns null.
 */
export async function requestPushNotificationPermissionAndRegister(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  // Graceful degradation: Check environment variables
  if (!isFirebaseConfigured()) {
    console.warn("Firebase Push Notifications skipped: Environment variables not configured.");
    return null;
  }

  // Graceful degradation: Check browser FCM support
  try {
    const supported = await isSupported();
    if (!supported) return null;
  } catch {
    return null;
  }

  // If permission was previously denied, do NOT prompt again
  if (Notification.permission === "denied") {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    const config = getFirebaseConfig();
    const swParams = new URLSearchParams({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;
    const registration = await navigator.serviceWorker.register(swUrl, { scope: "/" });
    await navigator.serviceWorker.ready;

    const messaging = getMessagingInstance();
    if (!messaging) return null;

    // Obtain REAL FCM Token from Firebase Cloud Messaging
    const token = await getToken(messaging, {
      vapidKey: config.vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.warn("Firebase Cloud Messaging returned an empty token.");
      return null;
    }

    // Attach listener for messages received in foreground (visible app)
    // Coherent with app design: do NOT show system notification in foreground
    onMessage(messaging, (payload) => {
      console.log("[FCM Foreground Message]", payload);
    });

    // Check for token rotation (if FCM issued a new token or token wasn't registered yet)
    const storedToken = localStorage.getItem("lizto_fcm_token");
    if (storedToken !== token) {
      const { apiFetch } = await import("./api");
      const { ENDPOINTS } = await import("./endpoints");

      await apiFetch(ENDPOINTS.USER_DEVICES, {
        method: "POST",
        body: JSON.stringify({
          device_token: token,
          platform: "web",
          device_identifier: navigator.userAgent.substring(0, 100),
        }),
      });

      localStorage.setItem("lizto_fcm_token", token);
    }

    return token;
  } catch (err) {
    console.warn("Error requesting FCM push token:", err);
    return null;
  }
}

/**
 * Unregisters the FCM device token from the backend upon user logout.
 */
export async function unregisterPushDeviceToken(): Promise<void> {
  if (typeof window === "undefined") return;

  const deviceToken = localStorage.getItem("lizto_fcm_token");
  if (!deviceToken) return;

  try {
    const { apiFetch } = await import("./api");
    const { ENDPOINTS } = await import("./endpoints");

    await apiFetch(ENDPOINTS.USER_DEVICES, {
      method: "DELETE",
      body: JSON.stringify({ device_token: deviceToken }),
    });
  } catch {
    // Ignore unregister errors during logout cleanup
  } finally {
    localStorage.removeItem("lizto_fcm_token");
  }
}

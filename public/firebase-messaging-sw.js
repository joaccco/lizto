/* Lizto Firebase Cloud Messaging Service Worker */

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Extract Firebase Web config passed via URL search parameters
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: urlParams.get("apiKey") || "",
  authDomain: urlParams.get("authDomain") || "",
  projectId: urlParams.get("projectId") || "",
  storageBucket: urlParams.get("storageBucket") || "",
  messagingSenderId: urlParams.get("messagingSenderId") || "",
  appId: urlParams.get("appId") || "",
};

// Initialize Firebase in Service Worker if configuration is provided
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Handle messages received while the application is in background or closed
    messaging.onBackgroundMessage((payload) => {
      const data = payload.data || payload;
      const title = payload.notification?.title || data.title || "Lizto - Nueva notificación";
      const body = payload.notification?.body || data.body || "Tenés una novedad en Lizto";

      return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Do NOT show system notification if app window is in foreground (visible)
        const isForeground = clientList.some((client) => client.visibilityState === "visible");
        if (isForeground) {
          return;
        }

        return self.registration.showNotification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data,
          tag: data.event_type || data.type || "lizto-notification",
          renotify: true,
        });
      });
    });
  } catch (err) {
    console.warn("Error initializing Firebase in Service Worker:", err);
  }
}

// Deep-link route resolution when user clicks a notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = "/";

  if (typeof data.url === "string" && data.url.startsWith("/")) {
    targetUrl = data.url;
  } else {
    const eventType = data.event_type || data.type || data.target || "";
    if (eventType === "message_sent" || eventType === "new_message") {
      targetUrl = (data.conversation_id || data.target_id)
        ? `/conversations/${data.conversation_id || data.target_id}`
        : "/conversations";
    } else if (
      eventType === "offer_created" ||
      eventType === "work_created" ||
      eventType === "work_request" ||
      eventType === "incoming_request"
    ) {
      targetUrl = "/provider";
    } else if (
      eventType === "offer_accepted" ||
      eventType === "offer_rejected" ||
      eventType === "quote_submitted" ||
      eventType === "quote_confirmed" ||
      eventType === "quote_rejected"
    ) {
      targetUrl = data.conversation_id ? `/conversations/${data.conversation_id}` : "/provider";
    } else if (data.conversation_id) {
      targetUrl = `/conversations/${data.conversation_id}`;
    } else {
      targetUrl = "/provider";
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ("focus" in client) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

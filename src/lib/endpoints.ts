export const ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",

  // Service Requests
  REQUESTS: "/requests",
  REQUEST_DETAIL: (id: string) => `/requests/${id}`,
  REQUEST_PARSE: "/requests/parse",
  REQUEST_SURVEY: (id: string) => `/requests/${id}/survey`,
  REQUEST_MATCH: (id: string) => `/requests/${id}/match`,
  REQUEST_CANCEL: (id: string) => `/requests/${id}/cancel`,
  REQUESTS_CLEANUP: "/requests/cleanup",

  // Conversations & Messages
  CONVERSATION_MESSAGES: (id: string) => `/conversations/${id}/messages`,

  // Matching
  MATCH_SESSION: (id: string) => `/match-sessions/${id}`,
  CARD_ACCEPT: (sessionId: string, cardId: string) =>
    `/match-sessions/${sessionId}/cards/${cardId}/accept`,
  CARD_REJECT: (sessionId: string, cardId: string) =>
    `/match-sessions/${sessionId}/cards/${cardId}/reject`,
  CARD_RECOVER: (sessionId: string, cardId: string) =>
    `/match-sessions/${sessionId}/cards/${cardId}/recover`,

  // Categories
  CATEGORIES: "/categories",

  // Providers
  PROVIDERS: "/providers",
  PROVIDER_DETAIL: (id: string) => `/providers/${id}`,
  PROVIDER_REVIEWS: (id: string) => `/providers/${id}/reviews`,
  // Provider Profile & Dashboard
  PROVIDER_PROFILE: "/provider/profile",
  PROVIDER_AVAILABILITY: "/provider/availability",
  PROVIDER_AGENDA: "/provider/agenda",

  // Works
  WORKS: "/works",
  WORK_DETAIL: (id: string) => `/works/${id}`,
  WORK_COMPLETE: (id: string) => `/works/${id}/complete`,
  WORK_CANCEL: (id: string) => `/works/${id}/cancel`,
  WORK_RATE: (id: string) => `/works/${id}/rate`,
  WORK_REQUESTS: "/provider/work-requests",
  WORK_CONFIRM: (id: string) => `/provider/work-requests/${id}/confirm`,
  WORK_DECLINE: (id: string) => `/provider/work-requests/${id}/decline`,

  // User Devices (Push Notifications)
  USER_DEVICES: "/user/devices",
  USER_DEVICE_DELETE: (token: string) => `/user/devices/${token}`,
} as const;

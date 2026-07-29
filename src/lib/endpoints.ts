export const ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  ME: "/users/me",

  // Service Requests
  REQUESTS: "/requests",
  REQUEST_PARSE: "/requests/parse",
  REQUEST_SURVEY: (id: string) => `/requests/${id}/survey`,
  REQUEST_MATCH: (id: string) => `/requests/${id}/match`,

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
  PROVIDER_AVAILABILITY: "/provider/availability",

  // Works
  WORKS: "/works",
  WORK_DETAIL: (id: string) => `/works/${id}`,
  WORK_COMPLETE: (id: string) => `/works/${id}/complete`,
  WORK_REQUESTS: "/provider/work-requests",
  WORK_CONFIRM: (id: string) => `/provider/work-requests/${id}/confirm`,
  WORK_DECLINE: (id: string) => `/provider/work-requests/${id}/decline`,
} as const;

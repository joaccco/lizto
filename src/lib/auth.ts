import type { User } from "./types";

const TOKEN_KEY = "lizto_token";
const USER_KEY = "lizto_user";

export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      document.cookie = `lizto_token=${token}; path=/; SameSite=Lax`;
    }
  },
  removeToken: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      document.cookie = "lizto_token=; path=/; max-age=0";
    }
  },
  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const u = localStorage.getItem(USER_KEY);
    if (!u) return null;
    try {
      return JSON.parse(u) as User;
    } catch {
      return null;
    }
  },
  setUser: (user: User): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  removeUser: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_KEY);
    }
  },
  clear: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      document.cookie = "lizto_token=; path=/; max-age=0";
    }
  },
};

export const isAuthenticated = (): boolean => !!authStorage.getToken();

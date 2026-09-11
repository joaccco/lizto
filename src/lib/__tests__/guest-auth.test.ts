import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authStorage } from "@/lib/auth";
import { ensureGuestToken, generateStrongGuestPassword } from "@/hooks/useServiceRequest";

describe("Guest Registration & Token Reuse in Service Requests", () => {
  let mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
    mockLocalStorage = {};

    // Provide browser-like window and localStorage for unit test environment
    const storageMock = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockLocalStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
    };

    (global as any).window = {};
    (global as any).document = { cookie: "" };
    (global as any).localStorage = storageMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates strong passwords satisfying backend policies (uppercase, digits, min length)", () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generateStrongGuestPassword();
      expect(pwd.length).toBeGreaterThanOrEqual(10);
      expect(/[A-Z]/.test(pwd)).toBe(true);
      expect(/[0-9]/.test(pwd)).toBe(true);
      expect(pwd).not.toBe("password123");
    }
  });

  it("registers guest with compliant credentials, stores token, and persists in localStorage", async () => {
    let registerBody: any = null;

    const fetchMock = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (url.includes("/auth/register")) {
        registerBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              token: "guest-jwt-token-12345",
              user: { id: 999, name: registerBody.name, email: registerBody.email, role: "client" },
            },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    global.fetch = fetchMock;

    const token = await ensureGuestToken();

    expect(token).toBe("guest-jwt-token-12345");
    expect(registerBody).not.toBeNull();
    expect(registerBody.name).toBe("Cliente Invitado");
    expect(registerBody.password.length).toBeGreaterThanOrEqual(10);
    expect(/[A-Z]/.test(registerBody.password)).toBe(true);
    expect(/[0-9]/.test(registerBody.password)).toBe(true);
    expect(registerBody.password).toBe(registerBody.password_confirmation);

    // Persisted in localStorage and authStorage
    expect(mockLocalStorage["lizto_guest_token"]).toBe("guest-jwt-token-12345");
    expect(mockLocalStorage["lizto_token"]).toBe("guest-jwt-token-12345");
  });

  it("reuses stored guest token from localStorage without creating a new user", async () => {
    mockLocalStorage["lizto_guest_token"] = "existing-saved-guest-token";

    let registerCalled = false;
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/auth/register")) {
        registerCalled = true;
        return { ok: false, status: 429, json: async () => ({ message: "Too many attempts" }) };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    global.fetch = fetchMock;

    const token = await ensureGuestToken();

    expect(token).toBe("existing-saved-guest-token");
    expect(registerCalled).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when registration fails and raises an actionable error", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/auth/register")) {
        return {
          ok: false,
          status: 422,
          json: async () => ({ message: "Validation error on register" }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });

    global.fetch = fetchMock;

    await expect(ensureGuestToken()).rejects.toThrow("Validation error on register");
  });
});

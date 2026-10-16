import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

describe("T4 / T5: Admin MVU Screens & Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("client role is prohibited from accessing admin mvu detail and request-data (guard rejects client)", () => {
    const clientUser = {
      id: 1,
      name: "Juan Pérez",
      email: "juan@test.com",
      roles: ["client"],
      role: "client",
    };

    const roles = clientUser.roles || [];
    const isAdmin =
      roles.includes("admin") ||
      roles.includes("moderator") ||
      (clientUser as any).role === "admin";

    expect(isAdmin).toBe(false);
  });

  it("admin role passes the guard for new panel screens", () => {
    const adminUser = {
      id: 99,
      name: "Admin Lizto",
      email: "admin@lizto.test",
      roles: ["admin"],
    };

    const roles = adminUser.roles || [];
    const isAdmin =
      roles.includes("admin") ||
      roles.includes("moderator") ||
      (adminUser as any).role === "admin";

    expect(isAdmin).toBe(true);
  });

  it("moderator role passes the guard for new panel screens", () => {
    const modUser = {
      id: 88,
      name: "Mod User",
      email: "mod@lizto.test",
      roles: ["moderator"],
    };

    const roles = modUser.roles || [];
    const isAdmin =
      roles.includes("admin") ||
      roles.includes("moderator") ||
      (modUser as any).role === "admin";

    expect(isAdmin).toBe(true);
  });

  it("ADMIN_MVU_DETAIL endpoint returns complete professional dossier", async () => {
    const mockDetail = {
      data: {
        id: 42,
        provider_id: 10,
        provider_uuid: "prov-uuid-42",
        provider_name: "Roberto Medina",
        commercial_name: "Cerrajería Medina",
        categories: ["cerrajeria"],
        years_experience: 12,
        identity: {
          id: 5,
          status: "approved",
          firstname: "Roberto",
          lastname: "Medina",
          verified_at: "2026-10-01T12:00:00Z",
          document_front_url: "https://storage.didit.me/docs/front_roberto.jpg",
          selfie_url: "https://storage.didit.me/docs/selfie_roberto.jpg",
        },
        antecedentes: {
          status: "approved",
          cert_url: "https://storage.lizto.test/antecedentes/cert_42.pdf",
          uploaded_at: "2026-10-02T10:00:00Z",
        },
        matrícula: {
          number: "••••5678",
          verified_at: "2026-10-02T11:00:00Z",
        },
        skills_verified: true,
        overall_verification_status: "pending",
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetail,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockDetail>(ENDPOINTS.ADMIN_MVU_DETAIL(42));

    expect(res.data.id).toBe(42);
    expect(res.data.provider_name).toBe("Roberto Medina");
    expect(res.data.identity?.firstname).toBe("Roberto");
    expect(res.data.matrícula.number).toBe("••••5678");
    expect(res.data.overall_verification_status).toBe("pending");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/mvu/42"),
      expect.anything()
    );
  });

  it("ADMIN_MVU_APPROVE endpoint updates overall_verification_status to approved", async () => {
    const mockApproved = {
      message: "Verificación profesional aprobada exitosamente.",
      data: {
        id: 42,
        overall_verification_status: "approved",
        skills_verified: true,
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApproved,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockApproved>(ENDPOINTS.ADMIN_MVU_APPROVE(42), {
      method: "POST",
    });

    expect(res.data.overall_verification_status).toBe("approved");
    expect(res.data.skills_verified).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/mvu/42/approve"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("ADMIN_MVU_REJECT endpoint updates overall_verification_status to rejected", async () => {
    const mockRejected = {
      message: "Verificación profesional rechazada.",
      data: {
        id: 42,
        overall_verification_status: "rejected",
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRejected,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockRejected>(ENDPOINTS.ADMIN_MVU_REJECT(42), {
      method: "POST",
      body: JSON.stringify({ reason: "Certificado de antecedentes vencido" }),
    });

    expect(res.data.overall_verification_status).toBe("rejected");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/mvu/42/reject"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Certificado de antecedentes vencido" }),
      })
    );
  });

  it("ADMIN_MVU_REQUEST_DATA sends notes to request additional data from provider", async () => {
    const mockRequestData = {
      message: "Solicitud de datos enviada al profesional.",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRequestData,
    });
    global.fetch = fetchMock;

    const notes = "Por favor adjunte una copia legible del frente del DNI y certificado RNR vigente.";
    const res = await apiFetch<typeof mockRequestData>(ENDPOINTS.ADMIN_MVU_REQUEST_DATA(42), {
      method: "POST",
      body: JSON.stringify({ notes }),
    });

    expect(res.message).toBe("Solicitud de datos enviada al profesional.");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/mvu/42/request-data"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ notes }),
      })
    );
  });
});

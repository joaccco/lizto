import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { authStorage } from "@/lib/auth";

describe("E2E Section B: Provider KYC Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * B1. Provider NO autenticado intenta GET /kyc/status -> 401 Unauthorized
   */
  it("B1: unauthenticated provider receives 401 on kyc status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "No autenticado." }),
    });
    global.fetch = fetchMock;

    await expect(apiFetch("/kyc/status")).rejects.toEqual({
      message: "No autenticado.",
    });
  });

  /**
   * B2. Provider nuevo obtiene estado KYC inicial -> 200 OK
   */
  it("B2: new provider receives unverified status with empty documents", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-token-b2");

    const mockStatus = {
      kyc_status: "unverified",
      documents: [],
      rejection_reasons: [],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockStatus,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockStatus>("/kyc/status");
    expect(res.kyc_status).toBe("unverified");
    expect(res.documents).toEqual([]);
  });

  /**
   * B3. Provider carga documento válido (jpg, <5MB) -> 201 Created
   */
  it("B3: provider uploads valid document and status becomes pending", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-token-b3");

    const mockUploadResponse = {
      document_id: "doc-uuid-b3",
      document_type: "identity",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockUploadResponse,
    });
    global.fetch = fetchMock;

    const formData = new FormData();
    formData.append("document_type", "identity");
    formData.append("document_number", "12345678");
    formData.append("document_file", new Blob(["fake-image-binary"], { type: "image/jpeg" }));

    const res = await apiFetch<typeof mockUploadResponse>("/kyc/documents", {
      method: "POST",
      body: formData,
    });

    expect(res.document_id).toBe("doc-uuid-b3");
    expect(res.status).toBe("pending");

    // Verificar que omite Content-Type para permitir multipart boundary
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Content-Type"]).toBeUndefined();
    expect(options.headers["Authorization"]).toBe("Bearer provider-token-b3");
  });

  /**
   * B4. Provider obtiene signed_url para acceder documento (~5min expiry) -> 200 OK
   */
  it("B4: provider retrieves signed URL with 5-minute expiry", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-token-b4");

    const mockSignedUrlRes = {
      signed_url: "http://localhost:8000/api/v1/kyc/documents/doc-uuid-b3/view?expires=1788638021",
      expires_in_seconds: 300,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSignedUrlRes,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockSignedUrlRes>("/kyc/documents/doc-uuid-b3/signed-url");

    expect(res.signed_url).toContain("expires");
    expect(res.expires_in_seconds).toBe(300);
  });

  /**
   * B5. Provider intenta cargar documento duplicado -> 409 Conflict
   */
  it("B5: duplicate document upload returns 409 Conflict", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-token-b5");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        message: "Ya existe un documento registrado con este número y tipo para este proveedor.",
      }),
    });
    global.fetch = fetchMock;

    const formData = new FormData();
    formData.append("document_type", "identity");
    formData.append("document_number", "12345678");

    await expect(
      apiFetch("/kyc/documents", {
        method: "POST",
        body: formData,
      })
    ).rejects.toEqual({
      message: "Ya existe un documento registrado con este número y tipo para este proveedor.",
    });
  });

  /**
   * B6. Provider carga múltiples documentos (passport, license) -> 201 y 3 en total
   */
  it("B6: provider uploads multiple documents reflected in status list", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("provider-token-b6");

    const mockStatusWithDocs = {
      kyc_status: "pending",
      documents: [
        { id: "doc-1", document_type: "identity", status: "pending" },
        { id: "doc-2", document_type: "passport", status: "pending" },
        { id: "doc-3", document_type: "driver_license", status: "pending" },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockStatusWithDocs,
    });
    global.fetch = fetchMock;

    const res = await apiFetch<typeof mockStatusWithDocs>("/kyc/status");
    expect(res.documents.length).toBe(3);
    expect(res.kyc_status).toBe("pending");
  });

  /**
   * B7. Admin verifica KYC -> Provider ve status verified
   */
  it("B7: admin verification changes status to verified", async () => {
    const getTokenSpy = vi.spyOn(authStorage, "getToken");
    getTokenSpy.mockReturnValue("admin-token-b7");

    const fetchVerifyMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        message: "Documento verificado correctamente.",
        data: { status: "verified" },
      }),
    });
    global.fetch = fetchVerifyMock;

    const verifyRes = await apiFetch<{ data: { status: string } }>(
      "/admin/kyc/documents/doc-1/verify",
      { method: "POST" }
    );
    expect(verifyRes.data.status).toBe("verified");

    // Provider check
    getTokenSpy.mockReturnValue("provider-token-b7");
    const fetchStatusMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        kyc_status: "verified",
        documents: [{ id: "doc-1", status: "verified" }],
      }),
    });
    global.fetch = fetchStatusMock;

    const statusRes = await apiFetch<{ kyc_status: string }>("/kyc/status");
    expect(statusRes.kyc_status).toBe("verified");
  });

  /**
   * B8. Provider con kyc verified puede cargar documento adicional -> 201 Created
   */
  it("B8: verified provider can upload additional documents", async () => {
    vi.spyOn(authStorage, "getToken").mockReturnValue("verified-provider-b8");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        document_id: "doc-additional-b8",
        status: "pending",
      }),
    });
    global.fetch = fetchMock;

    const formData = new FormData();
    formData.append("document_type", "professional_license");
    formData.append("document_number", "MAT9988");

    const res = await apiFetch<{ document_id: string; status: string }>("/kyc/documents", {
      method: "POST",
      body: formData,
    });

    expect(res.document_id).toBe("doc-additional-b8");
    expect(res.status).toBe("pending");
  });
});

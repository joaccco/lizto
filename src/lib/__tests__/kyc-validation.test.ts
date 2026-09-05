import { describe, expect, it } from "vitest";
import type { KycStatus, KycStatusResponse } from "@/lib/types";

// Validation helper replicating frontend form rules
function validateKycSubmission(data: {
  documentType: string;
  documentNumber: string;
  file?: { name: string; size: number; type: string } | null;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const cleanNumber = data.documentNumber.trim();

  if (!cleanNumber) {
    errors.document_number = "El número de documento es obligatorio.";
  } else if (!/^[0-9A-Za-z]+$/.test(cleanNumber)) {
    errors.document_number = "Solo se permiten caracteres alfanuméricos sin espacios ni guiones.";
  } else if (cleanNumber.length < 4 || cleanNumber.length > 50) {
    errors.document_number = "El número debe tener entre 4 y 50 caracteres.";
  }

  if (!data.file) {
    errors.file = "Debés seleccionar o tomar una foto de tu documento.";
  } else {
    const maxSizeBytes = 10 * 1024 * 1024;
    if (data.file.size > maxSizeBytes) {
      errors.file = "El archivo supera el tamaño máximo permitido de 10MB.";
    }

    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const isValidMime =
      allowedMimes.includes(data.file.type) ||
      /\.(jpe?g|png|pdf)$/i.test(data.file.name);

    if (!isValidMime) {
      errors.file = "Formato inválido. Solo se admiten imágenes JPG, PNG o documentos PDF.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

describe("KYC Validation & Status Mapping Rules", () => {
  describe("Client-side KYC Document Submission Validation", () => {
    it("accepts a valid submission with JPG file under 10MB and alphanumeric number", () => {
      const result = validateKycSubmission({
        documentType: "dni_front",
        documentNumber: "38123456",
        file: {
          name: "dni-frente.jpg",
          size: 2 * 1024 * 1024, // 2MB
          type: "image/jpeg",
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("accepts a valid PDF certificate", () => {
      const result = validateKycSubmission({
        documentType: "certificate",
        documentNumber: "CERT2026A",
        file: {
          name: "antecedentes.pdf",
          size: 5 * 1024 * 1024,
          type: "application/pdf",
        },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("rejects files larger than 10MB", () => {
      const result = validateKycSubmission({
        documentType: "dni_front",
        documentNumber: "38123456",
        file: {
          name: "huge-scan.png",
          size: 11 * 1024 * 1024, // 11MB
          type: "image/png",
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.file).toContain("10MB");
    });

    it("rejects unsupported file formats (e.g. .txt, .zip, .exe)", () => {
      const result = validateKycSubmission({
        documentType: "dni_front",
        documentNumber: "38123456",
        file: {
          name: "document.docx",
          size: 100 * 1024,
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.file).toContain("Solo se admiten imágenes JPG, PNG o documentos PDF");
    });

    it("rejects empty or whitespace-only document numbers", () => {
      const result = validateKycSubmission({
        documentType: "dni_front",
        documentNumber: "    ",
        file: {
          name: "dni.jpg",
          size: 500 * 1024,
          type: "image/jpeg",
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.document_number).toBe("El número de documento es obligatorio.");
    });

    it("rejects document numbers with special characters or spaces", () => {
      const result = validateKycSubmission({
        documentType: "dni_front",
        documentNumber: "38.123.456-A",
        file: {
          name: "dni.jpg",
          size: 500 * 1024,
          type: "image/jpeg",
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.document_number).toContain("Solo se permiten caracteres alfanuméricos");
    });

    it("rejects document numbers shorter than 4 characters", () => {
      const result = validateKycSubmission({
        documentType: "dni_front",
        documentNumber: "12",
        file: {
          name: "dni.jpg",
          size: 500 * 1024,
          type: "image/jpeg",
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.document_number).toContain("entre 4 y 50 caracteres");
    });
  });

  describe("KYC Status Resolution", () => {
    it("handles unverified status with no documents", () => {
      const kycResponse: KycStatusResponse = {
        kyc_status: "unverified",
        documents: [],
        rejection_reasons: [],
      };

      expect(kycResponse.kyc_status).toBe("unverified");
      expect(kycResponse.documents).toHaveLength(0);
    });

    it("handles pending status with pending documents", () => {
      const kycResponse: KycStatusResponse = {
        kyc_status: "pending",
        documents: [
          {
            document_id: "uuid-1",
            document_type: "dni_front",
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ],
        rejection_reasons: [],
      };

      expect(kycResponse.kyc_status).toBe("pending");
      expect(kycResponse.documents[0].status).toBe("pending");
    });

    it("handles rejected status with reasons from reviewer", () => {
      const kycResponse: KycStatusResponse = {
        kyc_status: "rejected",
        documents: [
          {
            document_id: "uuid-1",
            document_type: "selfie",
            status: "rejected",
            created_at: new Date().toISOString(),
          },
        ],
        rejection_reasons: [
          {
            document_type: "selfie",
            reason: "La imagen está borrosa y no se distingue el rostro.",
          },
        ],
      };

      expect(kycResponse.kyc_status).toBe("rejected");
      expect(kycResponse.rejection_reasons).toHaveLength(1);
      expect(kycResponse.rejection_reasons[0].reason).toContain("borrosa");
    });

    it("handles verified status when identity documents are verified", () => {
      const kycResponse: KycStatusResponse = {
        kyc_status: "verified",
        documents: [
          {
            document_id: "uuid-1",
            document_type: "identity",
            status: "verified",
            verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
        rejection_reasons: [],
      };

      expect(kycResponse.kyc_status).toBe("verified");
      expect(kycResponse.documents[0].status).toBe("verified");
    });
  });
});

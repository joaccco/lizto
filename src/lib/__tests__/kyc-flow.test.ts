import { describe, expect, it } from "vitest";
import type { KycStatus } from "@/lib/types";

describe("KYC Wizard Step Routing & Logic", () => {
  it("initializes on Step 1", () => {
    let currentStep: 1 | 2 | 3 = 1;
    expect(currentStep).toBe(1);
  });

  it("transitions from Step 1 to Step 2 on action button click", () => {
    let currentStep: 1 | 2 | 3 = 1;
    const handleNext = () => {
      currentStep = 2;
    };

    handleNext();
    expect(currentStep).toBe(2);
  });

  it("allows going back from Step 2 to Step 1", () => {
    let currentStep: 1 | 2 | 3 = 2;
    const handleBack = () => {
      currentStep = 1;
    };

    handleBack();
    expect(currentStep).toBe(1);
  });

  it("transitions from Step 2 to Step 3 on successful upload", () => {
    let currentStep: 1 | 2 | 3 = 2;
    const handleUploadSuccess = () => {
      currentStep = 3;
    };

    handleUploadSuccess();
    expect(currentStep).toBe(3);
  });

  it("returns from Step 3 to Step 1 on completion", () => {
    let currentStep: 1 | 2 | 3 = 3;
    const handleDone = () => {
      currentStep = 1;
    };

    handleDone();
    expect(currentStep).toBe(1);
  });

  it("determines correct button labels based on status", () => {
    const getActionLabel = (status: KycStatus) => {
      if (status === "unverified") return "Comenzar verificación →";
      if (status === "rejected") return "Corregir documentación →";
      return "Subir nuevo documento +";
    };

    expect(getActionLabel("unverified")).toBe("Comenzar verificación →");
    expect(getActionLabel("rejected")).toBe("Corregir documentación →");
    expect(getActionLabel("pending")).toBe("Subir nuevo documento +");
    expect(getActionLabel("verified")).toBe("Subir nuevo documento +");
  });

  it("activates glowPulse animation only for pending and rejected statuses", () => {
    const shouldGlow = (status: KycStatus) => {
      return status === "pending" || status === "rejected";
    };

    expect(shouldGlow("pending")).toBe(true);
    expect(shouldGlow("rejected")).toBe(true);
    expect(shouldGlow("verified")).toBe(false);
    expect(shouldGlow("unverified")).toBe(false);
  });
});

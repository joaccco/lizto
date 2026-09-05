"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { KycStep01_Status } from "@/components/provider/kyc/KycStep01_Status";
import { KycStep02_Upload } from "@/components/provider/kyc/KycStep02_Upload";
import { KycStep03_Confirmation } from "@/components/provider/kyc/KycStep03_Confirmation";
import { ProviderBottomNav } from "@/components/provider/kyc/ProviderBottomNav";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { KycDocumentItem, KycRejectionReason, KycStatus, KycStatusResponse } from "@/lib/types";

export default function ProviderKycPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kycStatus, setKycStatus] = useState<KycStatus>("unverified");
  const [documents, setDocuments] = useState<KycDocumentItem[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<KycRejectionReason[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Guardia de autenticación
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      const isProvider =
        user?.roles?.includes("provider") ||
        user?.has_provider_profile ||
        (user as any)?.role === "provider";
      if (!isProvider) {
        router.push("/");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchKycStatus = async () => {
    try {
      const res = await apiFetch<KycStatusResponse>(ENDPOINTS.KYC_STATUS);
      if (res) {
        setKycStatus(res.kyc_status || "unverified");
        setDocuments(res.documents || []);
        setRejectionReasons(res.rejection_reasons || []);
      }
    } catch {
      setKycStatus("unverified");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchKycStatus();
    }
  }, [isAuthenticated]);

  return (
    <div className="w-full min-h-screen bg-[#08080A] text-[#F4F3F7] font-sans flex flex-col items-center">
      {/* CONTENEDOR PRINCIPAL MOBILE-FIRST (MÁXIMO 390PX) */}
      <main className="w-full max-w-[390px] min-h-screen px-4 flex flex-col justify-between pb-[88px] relative">
        {isLoading ? (
          <div className="flex-1 flex flex-col justify-center items-center py-24 space-y-3">
            <Loader2 className="size-8 animate-spin text-[#8B6BFF]" />
            <p className="text-xs text-zinc-400 font-mono">Cargando estado...</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <KycStep01_Status
                status={kycStatus}
                documents={documents}
                rejectionReasons={rejectionReasons}
                onNext={() => setStep(2)}
                onRefresh={fetchKycStatus}
                isLoading={isLoading}
              />
            )}

            {step === 2 && (
              <KycStep02_Upload
                onNext={() => {
                  fetchKycStatus();
                  setStep(3);
                }}
                onBack={() => setStep(1)}
                onSuccess={fetchKycStatus}
              />
            )}

            {step === 3 && (
              <KycStep03_Confirmation
                onDone={() => {
                  fetchKycStatus();
                  setStep(1);
                }}
              />
            )}
          </>
        )}

        {/* BOTTOM NAVIGATION PRESENTE EN LOS 3 PASOS */}
        <ProviderBottomNav />
      </main>
    </div>
  );
}

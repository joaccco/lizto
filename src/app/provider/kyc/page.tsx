"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KycStatusDisplay } from "@/components/provider/kyc/KycStatusDisplay";
import { KycUploadForm } from "@/components/provider/kyc/KycUploadForm";
import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { KycDocumentItem, KycRejectionReason, KycStatus, KycStatusResponse } from "@/lib/types";

export default function ProviderKycPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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
      // Fallback a unverified en error de red
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
    <div className="min-h-screen bg-[#08080A] text-[#F4F3F7] font-sans pb-24">
      {/* HEADER DE NAVEGACIÓN */}
      <header className="sticky top-0 z-20 bg-[#08080A]/90 backdrop-blur-xl border-b border-white/9 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/provider"
            className="flex size-10 items-center justify-center rounded-xl bg-white/6 hover:bg-white/12 text-zinc-300 hover:text-white transition border border-white/8 cursor-pointer"
            title="Volver al panel"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#8B6BFF]" />
            <h1 className="text-sm font-extrabold text-[#F4F3F7]">Verificación de Identidad (KYC)</h1>
          </div>

          <div className="size-10" />
        </div>
      </header>

      <ScreenShell className="pt-5 space-y-6">
        {isLoading ? (
          <div className="flex py-16 justify-center items-center">
            <Loader2 className="size-8 animate-spin text-[#8B6BFF]" />
          </div>
        ) : (
          <>
            {/* ESTADO GENERAL Y DOCUMENTOS EXISTENTES */}
            <KycStatusDisplay
              status={kycStatus}
              documents={documents}
              rejectionReasons={rejectionReasons}
              onDocumentDeleted={fetchKycStatus}
            />

            {/* FORMULARIO DE SUBIDA (Siempre disponible para sumar o reintentar documentos) */}
            <KycUploadForm onUploadSuccess={fetchKycStatus} />
          </>
        )}
      </ScreenShell>
    </div>
  );
}

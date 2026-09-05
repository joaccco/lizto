"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  Loader2,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { KycBadge } from "@/components/provider/kyc/KycBadge";
import { KycButton } from "@/components/provider/kyc/KycButton";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { KycDocumentItem, KycRejectionReason, KycStatus } from "@/lib/types";

interface KycStep01StatusProps {
  onNext: () => void;
  status: KycStatus;
  documents: KycDocumentItem[];
  rejectionReasons: KycRejectionReason[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  identity: "Documento de Identidad",
  dni_front: "DNI (Frente)",
  dni_back: "DNI (Dorso)",
  selfie: "Foto Selfie con Documento",
  driver_license: "Licencia de Conducir",
  passport: "Pasaporte",
  professional_license: "Matrícula Profesional",
  certificate: "Certificado de Antecedentes",
  other: "Otro Documento",
};

export function KycStep01_Status({
  onNext,
  status,
  documents,
  rejectionReasons,
  onRefresh,
  isLoading = false,
}: KycStep01StatusProps) {
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenSignedUrl = async (docId: string) => {
    setOpeningDocId(docId);
    setActionError(null);
    try {
      const res = await apiFetch<{ signed_url: string }>(ENDPOINTS.KYC_SIGNED_URL(docId));
      if (res.signed_url) {
        window.open(res.signed_url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      setActionError(err?.message || "No se pudo generar el enlace seguro.");
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("¿Deseás eliminar este documento?")) return;
    setDeletingDocId(docId);
    setActionError(null);
    try {
      await apiFetch(ENDPOINTS.KYC_DOCUMENT_DELETE(docId), { method: "DELETE" });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionError(err?.message || "Error al eliminar el documento.");
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 justify-between py-4 space-y-6 animate-in fade-in duration-200">
      <div className="space-y-5">
        {/* HEADER SUPERIOR */}
        <div className="flex items-center justify-between">
          <Link
            href="/provider"
            className="flex size-10 items-center justify-center rounded-2xl bg-white/6 hover:bg-white/12 text-zinc-300 hover:text-white border border-white/8 transition cursor-pointer"
            title="Volver al panel"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E8D99]">
            Paso 1 de 3
          </span>
          <div className="size-10" />
        </div>

        {/* TÍTULO Y BADGE PRINCIPAL */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-[#8B6BFF]" />
            <h1 className="text-xl font-extrabold text-[#F4F3F7] tracking-tight">
              Verificación de Identidad
            </h1>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Protegemos la confianza en la plataforma verificando la documentación oficial de cada
            profesional.
          </p>
          <div className="pt-1">
            <KycBadge status={status} size="md" />
          </div>
        </div>

        {/* MOTIVOS DE RECHAZO (SI APLICA) */}
        {status === "rejected" && rejectionReasons && rejectionReasons.length > 0 && (
          <div className="rounded-[20px] bg-[#FF5A5A]/10 border border-[#FF5A5A]/35 p-4 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-[#FF5A5A]">
              <AlertTriangle className="size-4" />
              <span>Motivos de observación:</span>
            </div>
            <ul className="space-y-1.5 pl-1">
              {rejectionReasons.map((item, idx) => (
                <li key={idx} className="text-xs text-zinc-300 leading-snug">
                  • <strong className="text-white">{DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type}:</strong>{" "}
                  {item.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {actionError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {actionError}
          </div>
        )}

        {/* LISTADO DE DOCUMENTOS PREVIOS */}
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="size-6 animate-spin text-[#8B6BFF]" />
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Documentos Registrados ({documents.length})
            </h3>
            <div className="space-y-2">
              {documents.map((doc) => {
                const isVerified = doc.status === "verified" || doc.status === "approved";
                const isRejected = doc.status === "rejected";
                const label = DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type;
                const formattedDate = doc.created_at
                  ? new Date(doc.created_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                    })
                  : null;

                return (
                  <div
                    key={doc.document_id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-[18px] bg-[#131318] border border-white/8"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isVerified
                            ? "bg-[#3DDC84]/15 border-[#3DDC84]/30 text-[#3DDC84]"
                            : isRejected
                            ? "bg-[#FF5A5A]/15 border-[#FF5A5A]/30 text-[#FF5A5A]"
                            : "bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#C4B5FD]"
                        }`}
                      >
                        {isVerified ? <FileCheck className="size-4" /> : <FileText className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#F4F3F7] truncate">{label}</p>
                        <p className="text-[10.5px] font-mono text-zinc-400">
                          {isVerified ? "Aprobado" : isRejected ? "Rechazado" : "En revisión"}
                          {formattedDate ? ` · ${formattedDate}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenSignedUrl(doc.document_id)}
                        disabled={openingDocId === doc.document_id}
                        className="p-2 rounded-xl bg-white/6 hover:bg-white/12 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Ver documento seguro (URL 5 min)"
                      >
                        {openingDocId === doc.document_id ? (
                          <Loader2 className="size-3.5 animate-spin text-[#8B6BFF]" />
                        ) : (
                          <ExternalLink className="size-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.document_id)}
                        disabled={deletingDocId === doc.document_id}
                        className="p-2 rounded-xl bg-white/6 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                        title="Eliminar documento"
                      >
                        {deletingDocId === doc.document_id ? (
                          <Loader2 className="size-3.5 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] bg-[#131318] border border-white/8 p-6 text-center space-y-2">
            <Shield className="mx-auto size-8 text-zinc-600" />
            <p className="text-xs font-bold text-zinc-300">Aún no has subido documentación</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Subí una foto de tu DNI o pasaporte para completar tu registro profesional.
            </p>
          </div>
        )}
      </div>

      {/* BOTÓN DE ACCIÓN PRINCIPAL (PASO 1 -> PASO 2) */}
      <div className="pt-4 space-y-2">
        <KycButton
          variant={status === "rejected" || status === "unverified" ? "primary" : "glass"}
          onClick={onNext}
        >
          {status === "unverified"
            ? "Comenzar verificación →"
            : status === "rejected"
            ? "Corregir documentación →"
            : "Subir nuevo documento +"}
        </KycButton>

        {status === "verified" && (
          <Link href="/provider" className="block w-full">
            <KycButton variant="tertiary">Volver a mi panel de trabajo</KycButton>
          </Link>
        )}
      </div>
    </div>
  );
}

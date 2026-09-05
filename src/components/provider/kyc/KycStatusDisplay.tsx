"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";
import type { KycDocumentItem, KycRejectionReason, KycStatus } from "@/lib/types";

interface KycStatusDisplayProps {
  status: KycStatus;
  documents: KycDocumentItem[];
  rejectionReasons: KycRejectionReason[];
  onDocumentDeleted?: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  identity: "Documento de Identidad",
  dni_front: "DNI (Frente)",
  dni_back: "DNI (Dorso)",
  selfie: "Foto Selfie con Documento",
  driver_license: "Licencia de Conducir",
  passport: "Pasaporte",
  professional_license: "Matrícula Profesional",
  certificate: "Certificado de Antecedentes / Capacitación",
  other: "Otro Documento",
};

export function KycStatusDisplay({
  status,
  documents,
  rejectionReasons,
  onDocumentDeleted,
}: KycStatusDisplayProps) {
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
      setActionError(err?.message || "No se pudo obtener el enlace seguro del documento.");
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("¿Seguro que deseás eliminar este documento?")) return;
    setDeletingDocId(docId);
    setActionError(null);
    try {
      await apiFetch(ENDPOINTS.KYC_DOCUMENT_DELETE(docId), { method: "DELETE" });
      if (onDocumentDeleted) {
        onDocumentDeleted();
      }
    } catch (err: any) {
      setActionError(err?.message || "Error al eliminar el documento.");
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* BANNER PRINCIPAL DE ESTADO */}
      {status === "verified" && (
        <div className="rounded-[22px] bg-gradient-to-b from-[#3DDC84]/15 to-[#3DDC84]/5 border border-[#3DDC84]/40 p-5 space-y-2 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#3DDC84]/20 border border-[#3DDC84]/50 flex items-center justify-center text-[#3DDC84] shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#F4F3F7]">Identidad Verificada</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#3DDC84]/20 px-2 py-0.5 text-[10px] font-bold text-[#3DDC84]">
                  <CheckCircle2 className="size-3" /> Aprobado
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Tu documentación fue validada con éxito. Tu perfil profesional está activo.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="rounded-[22px] bg-gradient-to-b from-[#7C5CFF]/15 to-[#7C5CFF]/5 border border-[#7C5CFF]/40 p-5 space-y-2 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/50 flex items-center justify-center text-[#A8FF35] shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#F4F3F7]">Documentación en Revisión</h3>
                <span className="rounded-full bg-[#7C5CFF]/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#C4B5FD] border border-[#7C5CFF]/40 uppercase">
                  Pendiente
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Nuestro equipo está auditando tus documentos. Te notificaremos cuando se complete la verificación.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="rounded-[22px] bg-gradient-to-b from-[#FF5A5A]/15 to-[#FF5A5A]/5 border border-[#FF5A5A]/45 p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#FF5A5A]/20 border border-[#FF5A5A]/50 flex items-center justify-center text-[#FF5A5A] shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#F4F3F7]">Documentación Rechazada</h3>
                <span className="rounded-full bg-[#FF5A5A]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#FF5A5A] border border-[#FF5A5A]/40 uppercase">
                  Requiere Atención
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Revisá los motivos indicados a continuación y volvé a subir los documentos correspondientes.
              </p>
            </div>
          </div>

          {/* MOTIVOS DE RECHAZO */}
          {rejectionReasons && rejectionReasons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/8">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF5A5A]">
                Motivos señalados por el equipo:
              </span>
              <ul className="space-y-1.5">
                {rejectionReasons.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-xl bg-black/40 border border-[#FF5A5A]/30 p-2.5 text-xs text-zinc-200"
                  >
                    <span className="font-bold text-[#FF5A5A] shrink-0">
                      {DOCUMENT_TYPE_LABELS[item.document_type] || item.document_type}:
                    </span>
                    <span className="text-zinc-300">{item.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {status === "unverified" && (
        <div className="rounded-[22px] bg-gradient-to-b from-[#F2B441]/15 to-[#F2B441]/5 border border-[#F2B441]/40 p-5 space-y-2 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#F2B441]/20 border border-[#F2B441]/50 flex items-center justify-center text-[#F2B441] shrink-0">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#F4F3F7]">Verificación Requerida</h3>
                <span className="rounded-full bg-[#F2B441]/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[#F2B441] border border-[#F2B441]/40 uppercase">
                  Sin verificar
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                Subí tus documentos para verificar tu identidad y comenzar a recibir solicitudes de clientes.
              </p>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          {actionError}
        </div>
      )}

      {/* LISTADO DE DOCUMENTOS SUBIDOS */}
      {documents && documents.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Documentos Subidos ({documents.length})
            </h4>
          </div>

          <div className="space-y-2.5">
            {documents.map((doc) => {
              const isDocVerified = doc.status === "verified" || doc.status === "approved";
              const isDocRejected = doc.status === "rejected";
              const isDocPending = doc.status === "pending";

              const label = DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type;
              const formattedDate = doc.created_at
                ? new Date(doc.created_at).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              return (
                <div
                  key={doc.document_id}
                  className="rounded-[18px] bg-[#131318] border border-white/8 p-4 flex items-center justify-between gap-3 shadow-sm hover:border-white/14 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDocVerified
                          ? "bg-[#3DDC84]/12 border-[#3DDC84]/30 text-[#3DDC84]"
                          : isDocRejected
                          ? "bg-[#FF5A5A]/12 border-[#FF5A5A]/30 text-[#FF5A5A]"
                          : "bg-[#7C5CFF]/12 border-[#7C5CFF]/30 text-[#C4B5FD]"
                      }`}
                    >
                      {isDocVerified ? <FileCheck className="size-5" /> : <FileText className="size-5" />}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-[#F4F3F7] truncate">{label}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase ${
                            isDocVerified
                              ? "text-[#3DDC84]"
                              : isDocRejected
                              ? "text-[#FF5A5A]"
                              : "text-[#C4B5FD]"
                          }`}
                        >
                          {isDocVerified ? "Verificado" : isDocRejected ? "Rechazado" : "En revisión"}
                        </span>
                        {formattedDate && (
                          <span className="text-[10px] text-zinc-500 font-mono">· {formattedDate}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACCIONES DEL DOCUMENTO */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenSignedUrl(doc.document_id)}
                      disabled={openingDocId === doc.document_id}
                      className="p-2 rounded-xl bg-white/6 hover:bg-white/12 text-zinc-300 hover:text-white border border-white/8 transition cursor-pointer"
                      title="Ver documento seguro (URL de 5 min)"
                    >
                      {openingDocId === doc.document_id ? (
                        <Loader2 className="size-4 animate-spin text-[#8B6BFF]" />
                      ) : (
                        <ExternalLink className="size-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(doc.document_id)}
                      disabled={deletingDocId === doc.document_id}
                      className="p-2 rounded-xl bg-white/6 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/8 hover:border-red-500/30 transition cursor-pointer"
                      title="Eliminar documento"
                    >
                      {deletingDocId === doc.document_id ? (
                        <Loader2 className="size-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

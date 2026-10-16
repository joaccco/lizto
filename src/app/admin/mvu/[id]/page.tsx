"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  Loader2, 
  ArrowLeft,
  MessageSquarePlus,
  Lock,
  User,
  Calendar,
  Briefcase
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface MVUDetail {
  id: number;
  provider_id: number;
  provider_uuid: string;
  provider_name: string;
  commercial_name: string | null;
  categories: string[];
  years_experience: number | null;
  identity: {
    id: number;
    status: string;
    firstname: string | null;
    lastname: string | null;
    verified_at: string | null;
    document_front_url: string | null;
    selfie_url: string | null;
  } | null;
  antecedentes: {
    status: string;
    cert_url: string | null;
    uploaded_at: string | null;
  };
  matrícula: {
    number: string | null;
    verified_at: string | null;
  };
  skills_verified: boolean;
  overall_verification_status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export default function AdminMVUDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [item, setItem] = useState<MVUDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Admin Guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      const roles = user?.roles || [];
      const isAdmin = roles.includes("admin") || roles.includes("moderator") || (user as any)?.role === "admin";
      if (!isAdmin) {
        router.push("/");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await apiFetch<{ data: MVUDetail }>(ENDPOINTS.ADMIN_MVU_DETAIL(id));
      if (res && res.data) {
        setItem(res.data);
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Error al cargar el expediente de verificación." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchDetail();
    }
  }, [isAuthenticated, id]);

  const handleApprove = async () => {
    if (!item) return;
    try {
      setActionLoading(true);
      await apiFetch(ENDPOINTS.ADMIN_MVU_APPROVE(item.id), { method: "POST" });
      setFeedbackMessage({ 
        type: "success", 
        text: "Verificación aprobada exitosamente. El prestador ha sido habilitado para operar en Lizto." 
      });
      setShowApproveModal(false);
      await fetchDetail();
    } catch {
      setFeedbackMessage({ type: "error", text: "Error al aprobar la verificación." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!item || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await apiFetch(ENDPOINTS.ADMIN_MVU_REJECT(item.id), {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      setFeedbackMessage({ 
        type: "success", 
        text: "Verificación rechazada. El prestador no podrá operar y fue notificado del motivo." 
      });
      setShowRejectModal(false);
      setRejectReason("");
      await fetchDetail();
    } catch {
      setFeedbackMessage({ type: "error", text: "Error al rechazar la verificación." });
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#08080A] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-[#7C5CFF] animate-spin mb-4" />
        <p className="text-[#8E8D99] font-mono text-sm">Cargando expediente #{id}...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#08080A] text-white p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/admin/mvu"
            className="inline-flex items-center gap-2 text-sm text-[#8E8D99] hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Solicitudes Pendientes
          </Link>
          <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-8 text-center text-[#8E8D99]">
            <AlertCircle className="w-10 h-10 text-[#EF4444] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white">Expediente no encontrado</h2>
            <p className="text-sm mt-1">No se encontró la solicitud de verificación #{id}.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-[#EDEDED] font-sans antialiased p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/admin/mvu"
            className="inline-flex items-center gap-2 text-sm text-[#8E8D99] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Solicitudes Pendientes
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222228] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[#7C5CFF]">
                  Expediente de Verificación #{item.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold ${
                    item.overall_verification_status === "approved"
                      ? "bg-[#143320] text-[#4ADE80] border border-[#166534]"
                      : item.overall_verification_status === "rejected"
                      ? "bg-[#2D1517] text-[#F87171] border border-[#991B1B]"
                      : "bg-[#332514] text-[#FBBF24] border border-[#78350F]"
                  }`}
                >
                  {item.overall_verification_status}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">
                {item.provider_name || item.commercial_name || "Prestador"}
              </h1>
              {item.commercial_name && (
                <p className="text-sm text-[#A1A0AB] mt-0.5">
                  Nombre comercial / Fantasía: <span className="text-white font-medium">{item.commercial_name}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/mvu/${item.id}/request-data`}
                className="px-4 py-2.5 rounded-xl border border-[#7C5CFF]/40 hover:bg-[#7C5CFF]/10 text-[#B49DFF] text-xs font-semibold flex items-center gap-2 transition"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Pedir Más Datos</span>
              </Link>
              <button
                disabled={actionLoading || item.overall_verification_status === "rejected"}
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 rounded-xl border border-[#EF4444]/40 hover:bg-[#EF4444]/10 text-[#EF4444] text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar Verificación</span>
              </button>
              <button
                disabled={actionLoading || item.overall_verification_status === "approved"}
                onClick={() => setShowApproveModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-lg shadow-[#7C5CFF]/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar Verificación</span>
              </button>
            </div>
          </div>

          {feedbackMessage && (
            <div
              className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm ${
                feedbackMessage.type === "success"
                  ? "bg-[#102A1E] text-[#4ADE80] border border-[#166534]"
                  : "bg-[#2D1517] text-[#F87171] border border-[#991B1B]"
              }`}
            >
              {feedbackMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Metadata quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs">
            <div className="bg-[#16161D] p-3.5 rounded-xl border border-[#222228]">
              <div className="text-[#8E8D99]">Categorías / Rubros:</div>
              <div className="text-white font-medium mt-1">
                {item.categories.length > 0 ? item.categories.join(", ") : "Sin rubros especificados"}
              </div>
            </div>
            <div className="bg-[#16161D] p-3.5 rounded-xl border border-[#222228]">
              <div className="text-[#8E8D99]">Experiencia declarada:</div>
              <div className="text-white font-medium mt-1">
                {item.years_experience ? `${item.years_experience} años de oficio` : "No especificada"}
              </div>
            </div>
            <div className="bg-[#16161D] p-3.5 rounded-xl border border-[#222228]">
              <div className="text-[#8E8D99]">Dictamen de Oficio (Skills):</div>
              <div className="text-white font-medium mt-1">
                {item.skills_verified ? (
                  <span className="text-[#4ADE80]">Acreditado</span>
                ) : (
                  <span className="text-[#FBBF24]">Pendiente de dictamen</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expediente Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Identity Section (Didit & RENAPER) */}
          <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-white text-base">
                  <ShieldCheck className="w-5 h-5 text-[#7C5CFF]" />
                  <span>Identidad (Didit / RENAPER)</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono uppercase ${
                    item.identity?.status === "approved"
                      ? "bg-[#143320] text-[#4ADE80] border border-[#166534]"
                      : "bg-[#332514] text-[#FBBF24] border border-[#78350F]"
                  }`}
                >
                  {item.identity?.status || "NO INICIADO"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#8E8D99]">Nombre completo verificado:</span>
                  <p className="text-white font-medium mt-0.5 text-sm">
                    {item.identity?.firstname} {item.identity?.lastname}
                  </p>
                </div>
                <div>
                  <span className="text-[#8E8D99]">Fecha y hora de verificación:</span>
                  <p className="text-white font-medium mt-0.5 font-mono">
                    {item.identity?.verified_at
                      ? new Date(item.identity.verified_at).toLocaleString()
                      : "Pendiente"}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Links with Privacy Protection */}
            <div className="mt-6 pt-4 border-t border-[#222228]">
              <div className="flex items-center gap-2 text-[11px] text-[#A1A0AB] mb-3">
                <Lock className="w-3.5 h-3.5 text-[#7C5CFF]" />
                <span>Imágenes protegidas (Ley 25.326 · Sin registro en historial)</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {item.identity?.document_front_url ? (
                  <a
                    href={item.identity.document_front_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#7C5CFF] hover:underline font-mono bg-[#181822] px-3 py-1.5 rounded-lg border border-[#2A2A38]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver DNI Frontal
                  </a>
                ) : (
                  <span className="text-xs text-[#71717A] italic">Sin foto de DNI disponible</span>
                )}

                {item.identity?.selfie_url ? (
                  <a
                    href={item.identity.selfie_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#7C5CFF] hover:underline font-mono bg-[#181822] px-3 py-1.5 rounded-lg border border-[#2A2A38]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver Selfie Biometría
                  </a>
                ) : (
                  <span className="text-xs text-[#71717A] italic">Sin selfie de biometría disponible</span>
                )}
              </div>
            </div>
          </div>

          {/* Antecedentes Penales */}
          <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-white text-base">
                  <FileText className="w-5 h-5 text-[#7C5CFF]" />
                  <span>Antecedentes Penales</span>
                </div>
                <span className="text-xs font-mono uppercase bg-[#20202A] px-2.5 py-0.5 rounded text-[#D4D4D8]">
                  {item.antecedentes?.status || "NO REGISTRADO"}
                </span>
              </div>

              <p className="text-xs text-[#8E8D99] mb-4">
                Certificado oficial expedido por el Registro Nacional de Reincidencia (RNR).
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#8E8D99]">Fecha de presentación del certificado:</span>
                  <p className="text-white font-medium mt-0.5 font-mono">
                    {item.antecedentes?.uploaded_at
                      ? new Date(item.antecedentes.uploaded_at).toLocaleString()
                      : "No presentado"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#222228]">
              {item.antecedentes?.cert_url ? (
                <a
                  href={item.antecedentes.cert_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#7C5CFF] hover:underline font-medium bg-[#181822] px-3 py-1.5 rounded-lg border border-[#2A2A38]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Descargar Certificado RNR
                </a>
              ) : (
                <span className="text-xs text-[#71717A] italic">Sin archivo de antecedentes cargado</span>
              )}
            </div>
          </div>

          {/* Matrícula Profesional */}
          <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-6">
            <div className="flex items-center gap-2 font-semibold text-white text-base mb-3">
              <ShieldCheck className="w-5 h-5 text-[#7C5CFF]" />
              <span>Matrícula y Colegiatura</span>
            </div>
            <p className="text-xs text-[#8E8D99] mb-4">
              Registro formal ante colegio profesional o ente habilitante del oficio correspondiente.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#8E8D99]">Número de matrícula (enmascarado):</span>
                <p className="text-white font-mono font-medium mt-0.5 text-sm">
                  {item.matrícula?.number || "No requerida / No declarada"}
                </p>
              </div>
              <div>
                <span className="text-[#8E8D99]">Fecha de acreditación:</span>
                <p className="text-white font-medium mt-0.5 font-mono">
                  {item.matrícula?.verified_at
                    ? new Date(item.matrícula.verified_at).toLocaleDateString()
                    : "Pendiente"}
                </p>
              </div>
            </div>
          </div>

          {/* Experiencia y Competencias */}
          <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-6">
            <div className="flex items-center gap-2 font-semibold text-white text-base mb-3">
              <Briefcase className="w-5 h-5 text-[#7C5CFF]" />
              <span>Evaluación Técnica del Oficio</span>
            </div>
            <p className="text-xs text-[#8E8D99] mb-4">
              Verificación de idoneidad, referencias y años de práctica en los rubros solicitados.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#8E8D99]">Años de experiencia acreditados:</span>
                <p className="text-white font-medium mt-0.5 text-sm">
                  {item.years_experience ? `${item.years_experience} años de oficio comprobables` : "No declarados"}
                </p>
              </div>
              <div>
                <span className="text-[#8E8D99]">Estado de acreditación técnica:</span>
                <p className="mt-0.5 font-medium">
                  {item.skills_verified ? (
                    <span className="text-[#4ADE80]">Acreditación técnica aprobada por moderación</span>
                  ) : (
                    <span className="text-[#FBBF24]">Pendiente de dictamen definitivo</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Approve */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161D] border border-[#2E2E38] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 text-[#4ADE80] mb-3">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirmar Aprobación de Verificación</h3>
            </div>
            <p className="text-sm text-[#D4D4D8] mb-4 leading-relaxed">
              ¿Confirmar la aprobación definitiva de este expediente profesional?
            </p>
            <div className="bg-[#102A1E] border border-[#166534] rounded-xl p-4 text-xs text-[#86EFAC] space-y-2 mb-6">
              <p className="font-semibold text-white">Consecuencias de esta acción sobre el prestador:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El perfil cambiará de estado a <strong>Verificado (Verified)</strong>.</li>
                <li>El profesional quedará habilitado de forma inmediata para recibir solicitudes de clientes, emitir presupuestos y confirmar trabajos.</li>
                <li>Se registrará una entrada formal en el registro de auditoría con tu identificador.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-[#8E8D99] hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6A4BE8] text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? "Aprobando..." : "Confirmar y Habilitar Prestador"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Reject */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161D] border border-[#2E2E38] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 text-[#EF4444] mb-3">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirmar Rechazo de Verificación</h3>
            </div>
            <p className="text-sm text-[#D4D4D8] mb-3 leading-relaxed">
              Indica el motivo técnico fundamentado del rechazo.
            </p>
            <div className="bg-[#2D1517] border border-[#991B1B] rounded-xl p-4 text-xs text-[#FCA5A5] space-y-2 mb-4">
              <p className="font-semibold text-white">Consecuencias de esta acción sobre el prestador:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El perfil profesional será marcado como <strong>Rechazado</strong>.</li>
                <li>El prestador no podrá ofertar ni prestar servicios en la plataforma Lizto.</li>
                <li>El motivo ingresado será notificado al prestador.</li>
              </ul>
            </div>

            <label htmlFor="modal-reject-reason" className="block text-xs text-[#8E8D99] mb-1.5 font-medium">
              Motivo técnico del rechazo (obligatorio)
            </label>
            <textarea
              id="modal-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: Documentación de identidad apócrifa o antecedentes penales incompatibles con la función..."
              rows={4}
              className="w-full bg-[#0E0E12] border border-[#2A2A35] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#EF4444] resize-none mb-6"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-[#8E8D99] hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="px-5 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? "Rechazando..." : "Confirmar Rechazo Definitivo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

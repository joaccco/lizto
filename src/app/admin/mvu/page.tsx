"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  FileText, 
  AlertCircle,
  ExternalLink,
  Loader2,
  Search,
  UserCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface MVUItem {
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
}

export default function AdminMVUPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [items, setItems] = useState<MVUItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MVUItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const fetchPendingMVUs = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<{ data: MVUItem[] }>(ENDPOINTS.ADMIN_MVU_PENDING);
      if (res && res.data) {
        setItems(res.data);
        if (res.data.length > 0 && !selectedItem) {
          setSelectedItem(res.data[0]);
        }
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Error al cargar solicitudes de verificación." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingMVUs();
    }
  }, [isAuthenticated]);

  const handleApprove = async (id: number) => {
    if (!confirm("¿Confirmar aprobación de verificación profesional (MVU)? El prestador será habilitado para recibir solicitudes.")) {
      return;
    }

    try {
      setActionLoading(true);
      await apiFetch(ENDPOINTS.ADMIN_MVU_APPROVE(id), { method: "POST" });
      setFeedbackMessage({ type: "success", text: "Prestador verificado exitosamente." });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedItem(null);
    } catch {
      setFeedbackMessage({ type: "error", text: "Error al aprobar la verificación." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !rejectReason.trim()) return;

    try {
      setActionLoading(true);
      await apiFetch(ENDPOINTS.ADMIN_MVU_REJECT(selectedItem.id), {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      setFeedbackMessage({ type: "success", text: "Verificación rechazada correctamente." });
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedItem(null);
    } catch {
      setFeedbackMessage({ type: "error", text: "Error al rechazar la verificación." });
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || (isLoading && items.length === 0)) {
    return (
      <div className="min-h-screen bg-[#08080A] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-[#7C5CFF] animate-spin mb-4" />
        <p className="text-[#8E8D99] font-mono text-sm">Cargando Panel de Verificación MVU...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-[#EDEDED] font-sans antialiased p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#26262B] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#7C5CFF]" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Panel de Verificación Profesional (MVU)
            </h1>
          </div>
          <p className="text-sm text-[#8E8D99] mt-1">
            Revisión manual y acreditación técnica de prestadores de servicios
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-[#1A1A22] border border-[#2E2E38] text-xs font-mono px-3 py-1.5 rounded-full text-[#A1A0AB]">
            Pendientes: <span className="text-[#7C5CFF] font-bold">{items.length}</span>
          </span>
          <button
            onClick={fetchPendingMVUs}
            className="text-xs bg-[#1A1A22] hover:bg-[#252530] text-white px-4 py-2 rounded-lg border border-[#2E2E38] transition"
          >
            Refrescar
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`max-w-7xl mx-auto mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedbackMessage.type === "success"
              ? "bg-[#102A1E] text-[#4ADE80] border border-[#166534]"
              : "bg-[#2D1517] text-[#F87171] border border-[#991B1B]"
          }`}
        >
          {feedbackMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[#8E8D99] mb-1">
            Solicitudes pendientes
          </div>

          {items.length === 0 ? (
            <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-8 text-center text-[#8E8D99]">
              <UserCheck className="w-10 h-10 text-[#3F3F46] mx-auto mb-3" />
              <p className="font-medium text-white">No hay verificaciones pendientes</p>
              <p className="text-xs mt-1">Todos los prestadores postulados han sido revisados.</p>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl cursor-pointer border transition ${
                    isSelected
                      ? "bg-[#16161D] border-[#7C5CFF] shadow-[0_0_20px_rgba(124,92,255,0.15)]"
                      : "bg-[#111115] border-[#222228] hover:border-[#33333E]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white text-base">
                        {item.provider_name || item.commercial_name || "Prestador sin nombre"}
                      </div>
                      <div className="text-xs text-[#8E8D99] mt-0.5">
                        {item.commercial_name ? `Fantasía: ${item.commercial_name}` : `ID: #${item.provider_id}`}
                      </div>
                    </div>
                    <span className="bg-[#272732] text-[#A1A0AB] text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                      {item.categories[0] || "General"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.identity?.status === "approved"
                          ? "bg-[#132A1C] text-[#4ADE80]"
                          : "bg-[#2A2413] text-[#FBBF24]"
                      }`}
                    >
                      Didit KYC: {item.identity?.status || "Pendiente"}
                    </span>

                    {item.antecedentes?.status && (
                      <span className="bg-[#1C1C24] text-[#A1A0AB] px-2 py-0.5 rounded text-[11px]">
                        Antecedentes: {item.antecedentes.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-start justify-between border-b border-[#222228] pb-5">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#7C5CFF]">
                    Detalle de Verificación #{selectedItem.id}
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                    {selectedItem.provider_name || "Prestador"}
                  </h2>
                  <p className="text-xs text-[#8E8D99] mt-0.5">
                    Categorías postuladas: {selectedItem.categories.join(", ") || "No especificadas"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 rounded-xl border border-[#EF4444]/40 hover:bg-[#EF4444]/10 text-[#EF4444] text-xs font-medium transition disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedItem.id)}
                    className="px-5 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-lg shadow-[#7C5CFF]/20 transition disabled:opacity-50"
                  >
                    Aprobar Verificación
                  </button>
                </div>
              </div>

              {/* Identity & RENAPER Didit Section */}
              <div className="bg-[#16161D] border border-[#222228] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-medium text-white text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#7C5CFF]" />
                    <span>Identidad (Didit / RENAPER)</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                      selectedItem.identity?.status === "approved"
                        ? "bg-[#143320] text-[#4ADE80] border border-[#166534]"
                        : "bg-[#332514] text-[#FBBF24] border border-[#78350F]"
                    }`}
                  >
                    {selectedItem.identity?.status?.toUpperCase() || "NO INICIADO"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#8E8D99]">Nombre verificado:</span>
                    <p className="text-white font-medium mt-0.5">
                      {selectedItem.identity?.firstname} {selectedItem.identity?.lastname}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#8E8D99]">Fecha de verificación:</span>
                    <p className="text-white font-medium mt-0.5">
                      {selectedItem.identity?.verified_at
                        ? new Date(selectedItem.identity.verified_at).toLocaleString()
                        : "Pendiente"}
                    </p>
                  </div>
                </div>

                {/* Evidence Links */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#222228]">
                  {selectedItem.identity?.document_front_url && (
                    <a
                      href={selectedItem.identity.document_front_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#7C5CFF] hover:underline flex items-center gap-1 font-mono"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver DNI Frontal
                    </a>
                  )}
                  {selectedItem.identity?.selfie_url && (
                    <a
                      href={selectedItem.identity.selfie_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#7C5CFF] hover:underline flex items-center gap-1 font-mono"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver Selfie Biometría
                    </a>
                  )}
                </div>
              </div>

              {/* Technical / Antecedentes Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#16161D] border border-[#222228] rounded-xl p-5">
                  <div className="flex items-center gap-2 font-medium text-white text-sm mb-2">
                    <FileText className="w-4 h-4 text-[#7C5CFF]" />
                    <span>Antecedentes Penales</span>
                  </div>
                  <p className="text-xs text-[#8E8D99] mb-3">
                    Certificado de antecedentes penales emitido por RNR.
                  </p>
                  <span className="text-xs font-mono uppercase bg-[#20202A] px-2.5 py-1 rounded text-[#D4D4D8]">
                    Estado: {selectedItem.antecedentes.status}
                  </span>
                  {selectedItem.antecedentes.cert_url && (
                    <div className="mt-3">
                      <a
                        href={selectedItem.antecedentes.cert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#7C5CFF] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Descargar Certificado
                      </a>
                    </div>
                  )}
                </div>

                <div className="bg-[#16161D] border border-[#222228] rounded-xl p-5">
                  <div className="flex items-center gap-2 font-medium text-white text-sm mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#7C5CFF]" />
                    <span>Matrícula Profesional</span>
                  </div>
                  <p className="text-xs text-[#8E8D99] mb-3">
                    Colegiatura técnica o matrícula habilitante.
                  </p>
                  <div className="text-xs font-mono text-white">
                    {selectedItem.matrícula.number ? (
                      <span className="bg-[#20202A] px-2.5 py-1 rounded">
                        N° {selectedItem.matrícula.number}
                      </span>
                    ) : (
                      <span className="text-[#71717A]">No declarada / No requerida</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Experience and Skills */}
              <div className="bg-[#16161D] border border-[#222228] rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#8E8D99]">Años de Experiencia declarados:</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {selectedItem.years_experience ? `${selectedItem.years_experience} años` : "No especificado"}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-[#8E8D99]">Verificación de Oficio:</span>
                  <div className="mt-0.5">
                    {selectedItem.skills_verified ? (
                      <span className="text-xs font-medium text-[#4ADE80]">Acreditado</span>
                    ) : (
                      <span className="text-xs font-medium text-[#FBBF24]">Pendiente de dictamen</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-12 text-center text-[#8E8D99]">
              <Search className="w-10 h-10 text-[#3F3F46] mx-auto mb-3" />
              <p className="text-white font-medium">Selecciona una solicitud para evaluar</p>
              <p className="text-xs mt-1">Podrás revisar los documentos y validar la aptitud profesional.</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161D] border border-[#2E2E38] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Rechazar Verificación Profesional</h3>
            <p className="text-xs text-[#8E8D99] mb-4">
              Indica el motivo técnico del rechazo. Este mensaje será notificado al prestador.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: Certificado de antecedentes ilegible o vencido..."
              rows={4}
              className="w-full bg-[#0E0E12] border border-[#2A2A35] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#7C5CFF] resize-none mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#8E8D99] hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? "Rechazando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

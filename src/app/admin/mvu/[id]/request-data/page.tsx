"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MessageSquarePlus, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  SendHorizontal,
  Info
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface MVUBasicInfo {
  id: number;
  provider_id: number;
  provider_name: string;
  commercial_name: string | null;
  categories: string[];
  overall_verification_status: string;
}

export default function AdminMVURequestDataPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [item, setItem] = useState<MVUBasicInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  useEffect(() => {
    const fetchInfo = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await apiFetch<{ data: MVUBasicInfo }>(ENDPOINTS.ADMIN_MVU_DETAIL(id));
        if (res && res.data) {
          setItem(res.data);
        }
      } catch {
        setFeedback({ type: "error", message: "Error al cargar la información del expediente." });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchInfo();
    }
  }, [isAuthenticated, id]);

  const handleSubmit = async () => {
    if (!id || !notes.trim()) return;

    try {
      setIsSubmitting(true);
      await apiFetch(ENDPOINTS.ADMIN_MVU_REQUEST_DATA(id), {
        method: "POST",
        body: JSON.stringify({ notes: notes.trim() }),
      });
      setShowConfirmModal(false);
      setFeedback({
        type: "success",
        message: "Solicitud de datos enviada con éxito. El profesional fue notificado para subsanar los requisitos.",
      });
      setNotes("");
    } catch {
      setFeedback({ type: "error", message: "Error al registrar la solicitud de datos adicionales." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#08080A] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-[#7C5CFF] animate-spin mb-4" />
        <p className="text-[#8E8D99] font-mono text-sm">Cargando formulario de solicitud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-[#EDEDED] font-sans antialiased p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/admin/mvu/${id}`}
            className="inline-flex items-center gap-2 text-sm text-[#8E8D99] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Expediente #{id}
          </Link>
          <span className="text-[#3A3A44]">/</span>
          <Link
            href="/admin/mvu"
            className="text-sm text-[#8E8D99] hover:text-white transition"
          >
            Panel MVU
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-[#111115] border border-[#26262B] rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4 border-b border-[#222228] pb-6 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center shrink-0">
              <MessageSquarePlus className="w-6 h-6 text-[#7C5CFF]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Solicitar Información Adicional al Prestador
              </h1>
              <p className="text-sm text-[#8E8D99] mt-1">
                Expediente #{id} · Prestador:{" "}
                <span className="text-white font-medium">
                  {item?.provider_name || item?.commercial_name || `ID #${item?.provider_id}`}
                </span>
              </p>
              {item?.categories && item.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="bg-[#1C1C26] text-[#A1A0AB] text-[11px] font-mono px-2 py-0.5 rounded border border-[#2B2B38]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Context Notice */}
          <div className="bg-[#161622] border border-[#2E2E44] rounded-xl p-4 mb-6 flex items-start gap-3 text-xs text-[#C5C4D4] leading-relaxed">
            <Info className="w-5 h-5 text-[#7C5CFF] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-1">
                Subsanación proporcional de requisitos
              </p>
              <p>
                Utiliza esta opción para requerir documentación complementaria (ej. foto de DNI poco legible, certificado de antecedentes vencido o matrícula pendiente) sin rechazar el expediente profesional ni obligar al prestador a iniciar todo el trámite de cero.
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
                feedback.type === "success"
                  ? "bg-[#102A1E] text-[#4ADE80] border border-[#166534]"
                  : "bg-[#2D1517] text-[#F87171] border border-[#991B1B]"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (notes.trim()) {
                setShowConfirmModal(true);
              }
            }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="request-notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#A1A0AB]"
                >
                  Observaciones y documentación requerida <span className="text-[#EF4444]">*</span>
                </label>
                <span className="text-[11px] font-mono text-[#71717A]">
                  {notes.length} / 1000 caracteres
                </span>
              </div>

              <textarea
                id="request-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={6}
                required
                placeholder="Detalla qué documentación o información necesita subsanar el prestador (ej. 'El certificado de antecedentes penales adjunto no es legible en su código de validación digital; por favor adjuntar el PDF original descargado del RNR...')"
                className="w-full bg-[#0E0E12] border border-[#2A2A35] rounded-xl p-4 text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#7C5CFF] resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#222228]">
              <Link
                href={`/admin/mvu/${id}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#2A2A35] hover:bg-[#1C1C24] text-xs font-semibold text-[#8E8D99] hover:text-white transition text-center"
              >
                Volver sin cambios
              </Link>

              <button
                type="submit"
                disabled={isSubmitting || !notes.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-lg shadow-[#7C5CFF]/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <SendHorizontal className="w-4 h-4" />
                <span>Revisar y Enviar Solicitud</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161D] border border-[#2E2E38] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 text-[#7C5CFF] mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirmar Envío de Solicitud de Datos</h3>
            </div>

            <p className="text-sm text-[#D4D4D8] mb-4 leading-relaxed">
              ¿Confirmar el envío de esta solicitud de información adicional al prestador?
            </p>

            <div className="bg-[#181824] border border-[#2B2B40] rounded-xl p-4 text-xs text-[#C4C3D4] space-y-2 mb-6">
              <p className="font-semibold text-white">Consecuencias de esta acción:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El expediente se mantendrá en estado de evaluación sin ser rechazado.</li>
                <li>Se registrará un evento de auditoría formal con las notas ingresadas.</li>
                <li>El profesional recibirá la notificación con el detalle para adjuntar los datos solicitados.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs text-[#8E8D99] hover:text-white transition"
              >
                Modificar notas
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl bg-[#7C5CFF] hover:bg-[#6A4BE8] text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Confirmar y Notificar Prestador</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

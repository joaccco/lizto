"use client";

import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  Lock,
  Loader2,
  MapPin,
  Plus,
  Send,
  ShieldCheck,
  Star,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ScreenShell } from "@/components/screens/shared/ScreenShell";
import { apiFetch } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

interface MessageItem {
  id: string;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
  is_me: boolean;
}

interface WorkQuote {
  id: string;
  uuid: string;
  amount: number;
  currency: string;
  breakdown_items?: { concept: string; price: number }[];
  estimated_hours?: number;
  terms_conditions?: string;
  status: "pending" | "accepted" | "rejected" | "revision_requested";
  accepted_at?: string;
  created_at: string;
}

interface ConversationData {
  conversation_id: string;
  work_id?: string;
  client_name: string;
  provider_name: string;
  provider_avatar?: string;
  provider_rating?: number;
  provider_reviews?: number;
  category_name?: string;
  raw_prompt?: string;
  work_status?: string;
  is_closed?: boolean;
  messages: MessageItem[];
}

const SUGGESTION_CHIPS = [
  "¿A qué hora calculás llegar?",
  "Ya estoy esperando en la puerta.",
  "¿Necesitás algún detalle más?",
  "Envié el presupuesto para que lo revises.",
];

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [quotes, setQuotes] = useState<WorkQuote[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteTerms, setQuoteTerms] = useState("");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteActionLoading, setQuoteActionLoading] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchQuotes = async (workId: string) => {
    try {
      const res = await apiFetch<{ data: WorkQuote[] }>(`/works/${workId}/quotes`);
      if (res.data) {
        setQuotes(res.data);
      }
    } catch (e) {
      console.warn("Could not fetch quotes", e);
    }
  };

  const fetchMessages = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const res = await apiFetch<{ data: ConversationData }>(
        ENDPOINTS.CONVERSATION_MESSAGES(conversationId),
        { headers: { "Cache-Control": "no-store" } }
      );

      if (res.data) {
        setConversation(res.data);
        setMessages(res.data.messages || []);
        if (res.data.work_id) {
          fetchQuotes(res.data.work_id);
        }
        if (isInitial) {
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (err: any) {
      if (isInitial) {
        setError("No se pudo cargar el chat.");
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSendMessage = async (customContent?: string) => {
    if (isClosed) return;
    const textToSend = customContent || newMessageText.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await apiFetch<{ data: MessageItem }>(
        ENDPOINTS.CONVERSATION_MESSAGES(conversationId),
        {
          method: "POST",
          body: JSON.stringify({ content: textToSend }),
        }
      );

      if (!customContent) {
        setNewMessageText("");
      }

      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
        setTimeout(scrollToBottom, 100);
      } else {
        fetchMessages(false);
      }
    } catch (err: any) {
      const msg = err?.message || "No se pudo enviar el mensaje.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendQuote = async () => {
    if (!conversation?.work_id || !quoteAmount) return;
    setIsSubmittingQuote(true);
    setError(null);

    try {
      await apiFetch(`/works/${conversation.work_id}/quotes`, {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(quoteAmount),
          terms_conditions: quoteTerms || "Presupuesto acordado.",
        }),
      });

      setShowQuoteModal(false);
      setQuoteAmount("");
      setQuoteTerms("");
      if (conversation.work_id) {
        await fetchQuotes(conversation.work_id);
      }
      handleSendMessage(`📄 He enviado una propuesta comercial por $${parseFloat(quoteAmount).toLocaleString("es-AR")}`);
    } catch (err: any) {
      setError(err?.message || "Error enviando presupuesto.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleAcceptQuote = async (quoteUuid: string) => {
    if (!conversation?.work_id) return;
    setQuoteActionLoading(quoteUuid);
    try {
      await apiFetch(`/works/${conversation.work_id}/quotes/${quoteUuid}/accept`, {
        method: "POST",
      });
      await fetchQuotes(conversation.work_id);
      handleSendMessage("✅ He aceptado la propuesta comercial.");
    } catch (err: any) {
      setError(err?.message || "Error al aceptar presupuesto.");
    } finally {
      setQuoteActionLoading(null);
    }
  };

  const handleRejectQuote = async (quoteUuid: string) => {
    if (!conversation?.work_id) return;
    setQuoteActionLoading(quoteUuid);
    try {
      await apiFetch(`/works/${conversation.work_id}/quotes/${quoteUuid}/reject`, {
        method: "POST",
      });
      await fetchQuotes(conversation.work_id);
      handleSendMessage("❌ He rechazado la propuesta comercial.");
    } catch (err: any) {
      setError(err?.message || "Error al rechazar presupuesto.");
    } finally {
      setQuoteActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <ScreenShell className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto size-7 animate-spin text-[#8B6BFF]" />
          <p className="text-sm font-semibold text-zinc-400">Cargando conversación...</p>
        </div>
      </ScreenShell>
    );
  }

  const providerName = conversation?.provider_name || "Profesional";
  const initials = providerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isClosed =
    conversation?.is_closed ||
    conversation?.work_status === "completed" ||
    conversation?.work_status === "cancelled";

  const latestQuote = quotes[0];

  return (
    <ScreenShell className="flex flex-col h-screen py-4 justify-between relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[320px] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.18)_0%,transparent_65%)] blur-xl pointer-events-none" />

      {/* HEADER BAR */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/9">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="relative size-10 rounded-full bg-[#1D1D25] border border-white/12 flex items-center justify-center shrink-0">
            {!imageError && conversation?.provider_avatar ? (
              <Image
                src={conversation.provider_avatar}
                alt={providerName}
                fill
                sizes="40px"
                className="object-cover rounded-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-xs font-bold text-zinc-300" suppressHydrationWarning>{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-[#F4F3F7] truncate" suppressHydrationWarning>
                {providerName}
              </h1>
              <span className="size-3.5 rounded-full bg-[#3DDC84]/16 border border-[#3DDC84]/45 text-[#3DDC84] font-bold text-[9px] flex items-center justify-center shrink-0">
                ✓
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate flex items-center gap-1">
              <span>{conversation?.category_name || "Servicio"}</span>
              <span>·</span>
              <Star className="size-3 fill-[#F2B441] text-[#F2B441] inline" />
              <span>{conversation?.provider_rating?.toFixed(1) || "4.9"}</span>
            </p>
          </div>
        </div>

        {!isClosed && conversation?.work_id && (
          <button
            type="button"
            onClick={() => setShowQuoteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C5CFF]/16 border border-[#7C5CFF]/40 text-[#C4B5FD] hover:bg-[#7C5CFF]/26 text-xs font-bold transition cursor-pointer shrink-0"
          >
            <DollarSign className="size-3.5" />
            <span>Presupuesto</span>
          </button>
        )}
      </div>

      {/* CHAT MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 relative z-10 px-1">
        {/* Original Request Prompt Banner */}
        {conversation?.raw_prompt && (
          <div className="rounded-[18px] bg-gradient-to-b from-white/8 to-white/3 border border-white/10 p-3.5 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-[#A78BFA] font-medium">
              <span>Pedido de Servicio</span>
              {isClosed ? (
                <span className="text-zinc-400 flex items-center gap-1">
                  <Lock className="size-3" /> Finalizado
                </span>
              ) : (
                <span className="text-[#3DDC84]">✓ Confirmado</span>
              )}
            </div>
            <p className="text-xs text-[#F4F3F7] font-medium italic">
              «{conversation.raw_prompt}»
            </p>
          </div>
        )}

        {/* LATEST COMMERCIAL QUOTE CARD */}
        {latestQuote && (
          <div className="rounded-[20px] bg-[#16161E] border border-[#7C5CFF]/30 p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A78BFA] font-semibold">
                <FileText className="size-4" />
                <span>Presupuesto Comercial</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                  latestQuote.status === "accepted"
                    ? "bg-emerald-500/16 text-emerald-400 border border-emerald-500/30"
                    : latestQuote.status === "rejected"
                    ? "bg-red-500/16 text-red-400 border border-red-500/30"
                    : "bg-amber-500/16 text-amber-400 border border-amber-500/30 animate-pulse"
                }`}
              >
                {latestQuote.status === "accepted"
                  ? "Aceptado ✓"
                  : latestQuote.status === "rejected"
                  ? "Rechazado"
                  : "Pendiente de aprobación"}
              </span>
            </div>

            <div className="flex items-baseline justify-between border-y border-white/8 py-2">
              <span className="text-xs text-zinc-400 font-medium">Monto Total</span>
              <span className="text-xl font-extrabold text-[#F4F3F7]">
                ${latestQuote.amount.toLocaleString("es-AR")} {latestQuote.currency}
              </span>
            </div>

            {latestQuote.terms_conditions && (
              <p className="text-xs text-zinc-300 italic bg-white/4 p-2.5 rounded-xl border border-white/6">
                "{latestQuote.terms_conditions}"
              </p>
            )}

            {latestQuote.status === "pending" && !isClosed && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleAcceptQuote(latestQuote.uuid)}
                  disabled={quoteActionLoading === latestQuote.uuid}
                  className="flex-1 flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-md cursor-pointer"
                >
                  {quoteActionLoading === latestQuote.uuid ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>Aceptar presupuesto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleRejectQuote(latestQuote.uuid)}
                  disabled={quoteActionLoading === latestQuote.uuid}
                  className="flex h-[42px] px-4 items-center justify-center gap-1.5 rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  <XCircle className="size-4 text-zinc-400" />
                  <span>Rechazar</span>
                </button>
              </div>
            )}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <span className="size-2 rounded-full bg-[#8B6BFF] animate-pulse" />
            <p className="text-sm font-bold text-[#F4F3F7]">Chat directo activo</p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Escribile a {providerName} para coordinar los detalles del servicio.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const timeStr = new Date(m.created_at).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={m.id}
                className={`flex flex-col ${m.is_me ? "items-end" : "items-start"} space-y-1`}
              >
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-[20px] text-sm leading-relaxed ${
                    m.is_me
                      ? "bg-[#7C5CFF] text-white font-medium rounded-br-xs shadow-[0_8px_24px_rgba(124,92,255,0.35)]"
                      : "bg-[#131318] border border-white/10 text-[#F4F3F7] rounded-bl-xs font-normal"
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[10px] font-mono text-zinc-500 px-1">
                  {timeStr} hs
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTION CHIPS OR CLOSED BANNER */}
      {isClosed ? (
        <div className="relative z-10 p-4 rounded-[20px] bg-white/4 border border-white/10 text-center space-y-2 my-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
            <Lock className="size-4 text-zinc-500" />
            <span>Chat Cerrado</span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Este trabajo fue {conversation?.work_status === "completed" ? "completado" : "cancelado"}. Ya no es posible enviar mensajes en este chat.
          </p>

          {conversation?.work_status === "completed" && (
            <button
              type="button"
              onClick={() => router.push(`/rate/${conversation.work_id || conversationId}`)}
              className="mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#F2B441] hover:bg-[#e0a230] text-xs font-extrabold text-zinc-950 shadow-[0_8px_24px_rgba(242,180,65,0.35)] transition cursor-pointer"
            >
              <Star className="size-4 fill-zinc-950 text-zinc-950" />
              <span>★ Calificar trabajo de {providerName}</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative z-10 py-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-3.5 py-1.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition whitespace-nowrap cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative z-10 pt-2 pb-1 space-y-2"
          >
            {error && (
              <div className="rounded-xl bg-red-950/60 border border-red-900/80 p-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-[20px] bg-[#131318] border border-white/12 p-2 focus-within:border-[#8B6BFF] transition shadow-lg">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Escribí un mensaje..."
                maxLength={500}
                className="flex-1 bg-transparent px-3 text-sm text-[#F4F3F7] outline-none placeholder:text-zinc-500"
              />

              <button
                type="submit"
                disabled={!newMessageText.trim() || isSending}
                className="size-[44px] rounded-[14px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shrink-0 shadow-md"
                aria-label="Enviar mensaje"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between px-2 text-[10px] font-mono text-zinc-500">
              <span>Lizto Protegido · Chat seguro</span>
              <span>{newMessageText.length}/500</span>
            </div>
          </form>
        </>
      )}

      {/* CREATE QUOTE MODAL */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#16161E] border border-white/12 rounded-[24px] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h3 className="text-lg font-bold text-white">Enviar Presupuesto Comercial</h3>
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-1">
                  Monto Total ($ ARS) *
                </label>
                <input
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="Ej: 18500"
                  className="w-full h-12 px-4 rounded-xl bg-white/6 border border-white/12 text-base font-bold text-white outline-none focus:border-[#7C5CFF]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-1">
                  Términos o Desglose
                </label>
                <textarea
                  rows={3}
                  value={quoteTerms}
                  onChange={(e) => setQuoteTerms(e.target.value)}
                  placeholder="Ej: Incluye repuesto de cerradura y garantía de 30 días."
                  className="w-full p-3 rounded-xl bg-white/6 border border-white/12 text-sm text-white outline-none focus:border-[#7C5CFF]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendQuote}
              disabled={!quoteAmount || isSubmittingQuote}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7C5CFF] hover:bg-[#6b47ff] text-sm font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-lg"
            >
              {isSubmittingQuote ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span>Enviar propuesta al cliente →</span>
              )}
            </button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

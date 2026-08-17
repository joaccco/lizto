"use client";

import {
  ArrowLeft,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  Star,
  User,
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
  messages: MessageItem[];
}

const SUGGESTION_CHIPS = [
  "¿A qué hora calculás llegar?",
  "Ya estoy esperando en la puerta.",
  "¿Necesitás algún detalle más?",
  "¿El presupuesto es el acordado?",
];

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <ScreenShell className="flex flex-col h-screen py-4 justify-between relative overflow-hidden">
      {/* Background Subtle Radial Glow */}
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
              <span className="text-xs font-bold text-zinc-300">{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-[#F4F3F7] truncate">
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
      </div>

      {/* CHAT MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 relative z-10 px-1">
        {/* Original Request Prompt Banner */}
        {conversation?.raw_prompt && (
          <div className="rounded-[18px] bg-gradient-to-b from-white/8 to-white/3 border border-white/10 p-3.5 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-[#A78BFA] font-medium">
              <span>Pedido de Servicio</span>
              <span className="text-[#3DDC84]">✓ Confirmado</span>
            </div>
            <p className="text-xs text-[#F4F3F7] font-medium italic">
              «{conversation.raw_prompt}»
            </p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
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

      {/* SUGGESTION CHIPS */}
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

      {/* INPUT BAR */}
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
    </ScreenShell>
  );
}

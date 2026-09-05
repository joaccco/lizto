"use client";

import { Check, Clock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { KycButton } from "@/components/provider/kyc/KycButton";

interface KycStep03ConfirmationProps {
  onDone: () => void;
}

export function KycStep03_Confirmation({ onDone }: KycStep03ConfirmationProps) {
  return (
    <div className="flex flex-col flex-1 justify-between py-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center text-center space-y-5 pt-8">
        {/* ICONO ANIMADO CON POPIN Y GLOW */}
        <div className="relative">
          <div className="size-24 rounded-full bg-[#3DDC84]/15 border-2 border-[#3DDC84]/50 flex items-center justify-center text-[#3DDC84] shadow-[0_0_36px_rgba(61,220,132,0.35)] animate-popIn">
            <Check className="size-12 stroke-[3]" />
          </div>
          <span className="absolute -top-1 -right-1 size-7 rounded-full bg-[#7C5CFF] border-2 border-[#08080A] flex items-center justify-center text-[#A8FF35]">
            <Sparkles className="size-3.5" />
          </span>
        </div>

        {/* TÍTULO Y MENSAJE */}
        <div className="space-y-2 max-w-[320px]">
          <h1 className="text-2xl font-extrabold text-[#F4F3F7] tracking-tight">
            ¡Documento Enviado!
          </h1>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Hemos recibido tu archivo de forma segura. Nuestro equipo auditará los datos para
            habilitar tu perfil profesional.
          </p>
        </div>

        {/* TARJETA INFORMATIVA */}
        <div className="w-full rounded-[22px] bg-[#131318] border border-white/10 p-4 text-left space-y-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#C4B5FD] shrink-0 mt-0.5">
              <Clock className="size-4 text-[#A8FF35]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#F4F3F7]">Tiempo estimado de revisión</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Entre 24 y 48 horas hábiles. Te avisaremos en cuanto tu cuenta esté activa.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-white/6 pt-3">
            <div className="size-9 rounded-xl bg-[#3DDC84]/15 border border-[#3DDC84]/30 flex items-center justify-center text-[#3DDC84] shrink-0 mt-0.5">
              <ShieldCheck className="size-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#F4F3F7]">Privacidad garantizada</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tus archivos están encriptados y protegidos bajo normas estrictas de confidencialidad.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="pt-4 space-y-2.5">
        <KycButton variant="primary" onClick={onDone}>
          Ver estado de mi documentación →
        </KycButton>

        <Link href="/provider" className="block w-full">
          <KycButton variant="glass">Ir a mi panel de trabajo</KycButton>
        </Link>
      </div>
    </div>
  );
}

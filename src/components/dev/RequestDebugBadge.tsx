"use client";

/**
 * Etiqueta de diagnóstico para pruebas manuales.
 *
 * Responde una sola pregunta: ¿este pedido es realmente de la cuenta con la que
 * estoy logueado, o aparece por otro motivo?
 *
 * La bandeja del profesional une tres condiciones con OR y sólo dos significan
 * que el pedido es suyo. La tercera son pedidos abiertos de su rubro, que
 * aparecen en la bandeja de TODOS los profesionales de ese rubro.
 *
 * El bloque `_debug` lo emite la API únicamente en los entornos `local` y
 * `testing` (ProviderDashboardController::debugAttribution). En producción no
 * llega, y entonces este componente no dibuja nada.
 */

export interface RequestDebugInfo {
  motivo: "trabajo_asignado" | "tarjeta_de_matching" | "rubro_abierto";
  explicacion: string;
  es_mio: boolean;
  provider_id: number;
  provider_nombre: string | null;
  card_status: string | null;
  request_uuid: string;
}

export function RequestDebugBadge({ debug }: { debug?: RequestDebugInfo | null }) {
  if (!debug) return null;

  const tono = debug.es_mio
    ? "border-[#A8FF35]/35 bg-[#A8FF35]/8 text-[#A8FF35]"
    : "border-[#FF5A5A]/35 bg-[#FF5A5A]/8 text-[#FF5A5A]";

  return (
    <div className={`rounded-xl border px-3 py-2 font-mono text-[10.5px] leading-relaxed ${tono}`}>
      <div className="font-bold uppercase tracking-wider">
        {debug.es_mio ? "ES DE ESTA CUENTA" : "NO ES DE ESTA CUENTA"}
      </div>
      <div className="mt-1 text-zinc-300">{debug.explicacion}</div>
      <div className="mt-1.5 space-y-0.5 text-zinc-400">
        <div>
          profesional · {debug.provider_nombre ?? "sin nombre"} (id {debug.provider_id})
        </div>
        <div>motivo · {debug.motivo}</div>
        {debug.card_status && <div>tarjeta · {debug.card_status}</div>}
        <div>pedido · {debug.request_uuid.slice(0, 8)}</div>
      </div>
    </div>
  );
}

import { MODELO_DE_DECISION } from "./clasificador.ts";
import { supabaseAdmin } from "./supabaseAdmin.ts";

/**
 * Constancia de una decisión del modelo en una función edge: el gemelo Deno
 * de `src/lib/server/ia/auditoria.ts`, y por el mismo motivo que el
 * clasificador (dos runtimes, sin código compartido posible).
 *
 * Nunca lanza. Perder una estadística es un problema pequeño; que el webhook
 * de correo entrante devuelva un error y Postmark reintente el mensaje de un
 * cliente, no.
 */
export async function registrarDecision(
  organizacionId: string,
  decision: {
    kind: string;
    value: string | null;
    confianza: number | null;
    aplicada: boolean;
    entidad?: { tabla: string; id: number };
  },
): Promise<void> {
  if (!organizacionId) return;

  try {
    const { error } = await supabaseAdmin.from("ai_decisions").insert({
      organization_id: organizacionId,
      kind: decision.kind,
      value: decision.value,
      // numeric(4,3) en la base.
      confidence:
        decision.confianza === null
          ? null
          : Math.round(decision.confianza * 1000) / 1000,
      applied: decision.aplicada,
      model: MODELO_DE_DECISION,
      entity_table: decision.entidad?.tabla ?? null,
      entity_id: decision.entidad?.id ?? null,
    });
    if (error) {
      console.error("[auditoria-ia] no se pudo apuntar la decisión", error);
    }
  } catch (e) {
    console.error("[auditoria-ia] no se pudo apuntar la decisión", e);
  }
}

import { MODELO_DE_DECISION } from "./clasificador";
import { getServiceClient } from "../supabase-service";

/**
 * Constancia de lo que decidió el modelo de decisión, para uso EXCLUSIVO en
 * servidor.
 *
 * El CRM actúa solo a partir de estas decisiones: clasifica un ticket que
 * entra por la web, descarta un formulario como spam. Sin una constancia,
 * ajustar los umbrales sería adivinar — nadie sabría cuántas veces acertó, ni
 * cuánto se quedó a las puertas del corte, ni qué se descartó. Con ella, subir
 * el filtro de spam a 0.95 o bajar el de la prioridad a 0.6 es una consulta,
 * no una corazonada.
 *
 * Se guarda TODO lo que el modelo responde, aplicado o no: lo que no se aplicó
 * es justo la mitad interesante (¿el umbral está dejando fuera trabajo bueno?).
 *
 * Del texto del cliente no se guarda nada, con una excepción: un formulario
 * descartado por spam no deja rastro en ningún otro sitio — ni contacto, ni
 * nota, ni ticket —, así que sin un extracto nadie podría revisar nunca si se
 * tiró un cliente de verdad. Ver `detalle`.
 */

/**
 * Qué se decidió. En la base es texto libre a propósito (un caso nuevo no
 * debería necesitar una migración); aquí es una unión para que una errata no
 * parta la serie histórica en dos.
 */
export type TipoDeDecision =
  | "form_spam"
  | "ticket_priority"
  | "ticket_category"
  | "survey_topic"
  | "survey_severity"
  | "email_intent"
  | "duplicate_contact"
  | "duplicate_company"
  | "deal_loss_reason";

export interface DecisionDelModelo {
  kind: TipoDeDecision;
  /** La opción elegida, o `"true"`/`"false"` en una pregunta de sí/no. */
  value: string | null;
  /** De 0 a 1. `null` cuando el modelo no la devolvió. */
  confianza: number | null;
  /** Si el CRM actuó con ella o se quedó mirando (por debajo del umbral). */
  aplicada: boolean;
  /** La fila sobre la que se actuó, cuando existe una. */
  entidad?: { tabla: string; id: number };
  /**
   * Extracto de lo que se juzgó. SOLO para lo que no deja otro rastro (un
   * envío descartado): donde hay fila que mirar, se mira la fila.
   */
  detalle?: string;
}

const MAX_DETALLE = 500;

/** numeric(4,3) en la base: tres decimales es de sobra para un umbral. */
const aTresDecimales = (valor: number | null): number | null =>
  typeof valor === "number" && Number.isFinite(valor)
    ? Math.round(valor * 1000) / 1000
    : null;

/**
 * Apunta las decisiones de una organización. Varias en una sola llamada
 * porque una pregunta a Jev devuelve varias respuestas de golpe (prioridad y
 * categoría del mismo ticket) y no hay razón para dos viajes a la base.
 *
 * **Nunca lanza ni bloquea la operación de la que da constancia.** Si la
 * inserción falla, se queda en el registro del servidor: perder una
 * estadística es un problema pequeño, y romper por ella el ticket de un
 * cliente sería un problema grande.
 *
 * Se espera (`await`) en vez de dejarla suelta porque en serverless el proceso
 * puede morir al devolver la respuesta, y una constancia que se pierde la
 * mitad de las veces no sirve para decidir nada. Es una inserción pequeña.
 */
export async function registrarDecisiones(
  organizacionId: string,
  decisiones: DecisionDelModelo[],
): Promise<void> {
  if (!organizacionId || !decisiones.length) return;

  try {
    const filas = decisiones.map((d) => ({
      organization_id: organizacionId,
      kind: d.kind,
      value: d.value,
      confidence: aTresDecimales(d.confianza),
      applied: d.aplicada,
      model: MODELO_DE_DECISION,
      entity_table: d.entidad?.tabla ?? null,
      entity_id: d.entidad?.id ?? null,
      detalle: d.detalle ? d.detalle.slice(0, MAX_DETALLE) : null,
    }));

    const { error } = await getServiceClient()
      .from("ai_decisions")
      .insert(filas);
    if (error) {
      console.error("[auditoria-ia] no se pudo apuntar la decisión", error);
    }
  } catch (e) {
    console.error("[auditoria-ia] no se pudo apuntar la decisión", e);
  }
}

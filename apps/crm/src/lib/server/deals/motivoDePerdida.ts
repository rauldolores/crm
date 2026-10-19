import { registrarDecisiones } from "../ia/auditoria";
import type { PreguntaDeJev } from "../ia/clasificador";
import {
  hayClasificador,
  preguntarAlClasificador,
} from "../ia/clasificador";
import { getServiceClient } from "../supabase-service";

/**
 * Propone el motivo por el que se perdió una oportunidad, leyendo sus notas.
 *
 * El CRM ya pregunta al mover una tarjeta a una etapa de pérdida, y el propio
 * informe de oportunidades acusa el resultado: «%{count} sin motivo anotado».
 * Con la prisa se pulsa «Omitir», y sin motivos no hay informe de pérdidas
 * que valga — justo el informe que diría si se pierde por precio o porque
 * nadie hace seguimiento.
 *
 * Así que en vez de pedir que alguien recuerde, se propone: las notas de esa
 * oportunidad casi siempre lo dicen («se fueron con la competencia», «no
 * tienen presupuesto este año»). El desplegable llega con una opción puesta y
 * quien mueve la tarjeta solo confirma o la cambia.
 *
 * Aquí SÍ hay una persona mirando, así que no se aplica umbral: ve el valor
 * elegido antes de guardar. Lo que se propuso queda apuntado en la auditoría
 * con `applied: false`; comparar eso con el `loss_reason` que acabó en la
 * oportunidad es lo que dirá si el modelo acierta.
 */

export interface Opcion {
  value: string;
  label: string;
}

/** Valor reservado: «ninguno de los motivos de la lista encaja». */
const NINGUNO = "_ninguno";

/** Las últimas notas bastan: el motivo se ve al final de la conversación. */
const NOTAS = 10;
const MAX_NOTA = 600;

export interface MotivoSugerido {
  loss_reason: string | null;
  confianza: number | null;
}

export async function sugerirMotivoDePerdida(
  organizacionId: string,
  dealId: number,
  motivos: Opcion[],
): Promise<MotivoSugerido> {
  if (!hayClasificador() || !motivos.length) {
    return { loss_reason: null, confianza: null };
  }

  const supabase = getServiceClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, description, amount")
    .eq("id", dealId)
    .maybeSingle();
  if (!deal || deal.organization_id !== organizacionId) {
    return { loss_reason: null, confianza: null };
  }

  const { data: notas } = await supabase
    .from("deal_notes")
    .select("date, text")
    .eq("deal_id", dealId)
    .order("date", { ascending: false })
    .limit(NOTAS);

  // En orden cronológico para que el modelo lea la conversación como pasó.
  const historia = (notas ?? [])
    .slice()
    .reverse()
    .map((n) => (n.text as string | null)?.slice(0, MAX_NOTA) ?? "")
    .filter(Boolean)
    .join("\n---\n");

  // Sin una sola nota no hay nada que leer: el nombre de la oportunidad no
  // dice por qué se perdió, y una corazonada sobre la nada es peor que una
  // casilla vacía.
  if (!historia) return { loss_reason: null, confianza: null };

  const preguntas: Record<string, PreguntaDeJev> = {
    motivo: {
      type: "choice",
      instructions:
        "Por qué se perdió esta oportunidad de venta, según lo que cuentan sus notas",
      criteria: {
        ...Object.fromEntries(motivos.map((m) => [m.value, m.label])),
        [NINGUNO]: "Las notas no dicen por qué se perdió, o no encaja ninguno",
      },
    },
  };

  const resultado = await preguntarAlClasificador(
    {
      oportunidad: deal.name,
      descripcion: (deal.description as string | null) ?? "",
      importe: deal.amount,
      notas: historia,
    },
    preguntas,
  );
  if (!resultado.ok || !resultado.respuestas) {
    return { loss_reason: null, confianza: null };
  }

  const respuesta = resultado.respuestas.motivo;
  const elegido = motivos.some((m) => m.value === respuesta?.choice)
    ? (respuesta?.choice as string)
    : null;
  const confianza =
    typeof respuesta?.confidence === "number" ? respuesta.confidence : null;

  if (respuesta) {
    await registrarDecisiones(organizacionId, [
      {
        kind: "deal_loss_reason",
        value: respuesta.choice ?? null,
        confianza,
        // Propuesto, no aplicado: decide la persona que mueve la tarjeta. Lo
        // que acabó guardándose está en deals.loss_reason.
        aplicada: false,
        entidad: { tabla: "deals", id: dealId },
      },
    ]);
  }

  return { loss_reason: elegido, confianza };
}

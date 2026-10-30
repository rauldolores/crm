import { getServiceClient } from "../supabase-service";
import { tareaEnElEmbudo } from "@/lib/miDia/etapas";

/**
 * Las oportunidades abiertas de los contactos de unas tareas, y el filtro de
 * esas tareas por embudo. Lo usan la cola de «Mi día» y el reparto de
 * vencidas, para que las dos cuenten las mismas tareas.
 */

export interface OportunidadLeida {
  id: number;
  name: string;
  stage: string;
  pipeline: string;
  contact_ids: number[] | null;
  company_id: number | null;
  sales_id: number | null;
  updated_at: string | null;
}

export const COLUMNAS_DE_OPORTUNIDAD =
  "id, name, stage, pipeline, contact_ids, company_id, sales_id, updated_at";

/** Los ids de `overlaps` van en la URL: se piden por tandas. */
const CONTACTOS_POR_CONSULTA = 200;

export async function oportunidadesAbiertasDe(
  organizacionId: string,
  contactoIds: number[],
): Promise<OportunidadLeida[]> {
  const tandas: number[][] = [];
  for (let i = 0; i < contactoIds.length; i += CONTACTOS_POR_CONSULTA) {
    tandas.push(contactoIds.slice(i, i + CONTACTOS_POR_CONSULTA));
  }
  const respuestas = await Promise.all(
    tandas.map((tanda) =>
      getServiceClient()
        .from("deals")
        .select(COLUMNAS_DE_OPORTUNIDAD)
        .eq("organization_id", organizacionId)
        .is("archived_at", null)
        .overlaps("contact_ids", tanda),
    ),
  );
  const fallida = respuestas.find((respuesta) => respuesta.error);
  if (fallida?.error) {
    throw new Error(
      `No se pudieron leer las oportunidades de las tareas: ${fallida.error.message}`,
    );
  }
  // Una oportunidad con varios contactos puede salir en más de una tanda.
  const porId = new Map<number, OportunidadLeida>();
  for (const respuesta of respuestas) {
    for (const oportunidad of (respuesta.data ?? []) as OportunidadLeida[]) {
      porId.set(oportunidad.id, oportunidad);
    }
  }
  return [...porId.values()];
}

/** Las tareas que van en la cola del embudo; sin embudo, todas. */
export function filtrarPorEmbudo<T extends { contact_id: number }>(
  tareas: T[],
  oportunidades: OportunidadLeida[],
  embudo: string | null,
): T[] {
  if (!embudo) return tareas;
  const embudosPorContacto = new Map<number, string[]>();
  for (const oportunidad of oportunidades) {
    for (const contactoId of oportunidad.contact_ids ?? []) {
      embudosPorContacto.set(contactoId, [
        ...(embudosPorContacto.get(contactoId) ?? []),
        oportunidad.pipeline,
      ]);
    }
  }
  return tareas.filter((tarea) =>
    tareaEnElEmbudo(embudosPorContacto.get(tarea.contact_id) ?? [], embudo),
  );
}

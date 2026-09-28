import { llamarApi } from "./llamarApi";

/**
 * Pregunta al servidor cuáles de los parecidos que ha encontrado el
 * formulario son de verdad el mismo contacto (o la misma empresa).
 *
 * La búsqueda de parecidos se queda donde estaba, en el navegador: es
 * instantánea y funciona igual en la demo. Esto solo afina lo que ya se
 * encontró, y por eso puede fallar sin consecuencias — un mapa vacío
 * significa «no hay opinión» y quien llama se queda con su lista entera.
 */

/** Por debajo de esto no se avisa: el modelo ve dos fichas distintas. */
export const UMBRAL_DE_DUPLICADO = 0.5;

export type RecursoConDuplicados = "contacts" | "companies";

export async function confirmarDuplicados(
  recurso: RecursoConDuplicados,
  nuevo: Record<string, string | string[]>,
  candidatos: number[],
): Promise<Record<number, number>> {
  if (candidatos.length === 0) return {};
  try {
    const { veredicto } = await llamarApi<{
      veredicto: Record<number, number>;
    }>("/api/duplicados", {
      method: "POST",
      body: JSON.stringify({ recurso, nuevo, candidatos }),
    });
    return veredicto ?? {};
  } catch {
    // En la demo no hay servidor con datos, y una caída puntual tampoco debe
    // quitar un aviso que antes salía.
    return {};
  }
}

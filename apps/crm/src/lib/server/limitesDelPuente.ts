/**
 * Qué límite del plan toca una escritura que pasa por el puente /api/datos.
 *
 * El puente es el único camino del navegador (y de las claves de API) a la
 * base, así que es el sitio donde un alta se puede contar sin depender de
 * que cada formulario se acuerde. Aquí solo se decide QUÉ contar y CUÁNTO;
 * quién consulta a KontrolIA Auth es `consumo.ts`.
 *
 * Dos recursos cobrables:
 * - `contacts`: cada fila nueva es un contacto registrado.
 * - `configuration`: los embudos viven dentro del jsonb `config.dealPipelines`;
 *   se cuenta cada embudo cuyo `value` no existía antes.
 *
 * Todo puro y sin red, para poder probarlo sin servidor.
 */

/** Filas que un POST a PostgREST crea: una o varias. */
const filasDe = (cuerpo: string): Record<string, unknown>[] => {
  try {
    const datos: unknown = JSON.parse(cuerpo);
    const lista = Array.isArray(datos) ? datos : [datos];
    return lista.filter(
      (fila): fila is Record<string, unknown> =>
        fila != null && typeof fila === "object" && !Array.isArray(fila),
    );
  } catch {
    return [];
  }
};

/** Cuántos contactos crea el cuerpo de un POST a `contacts`. */
export const contactosNuevos = (cuerpo: string): number =>
  filasDe(cuerpo).length;

/** Identificadores de las filas devueltas por PostgREST (`return=representation`). */
export const idsDe = (cuerpoDeRespuesta: string): (string | number)[] =>
  filasDe(cuerpoDeRespuesta)
    .map((fila) => fila.id)
    .filter(
      (id): id is string | number =>
        typeof id === "number" || typeof id === "string",
    );

type ConfiguracionConEmbudos = {
  config?: { dealPipelines?: { value?: unknown }[] } | null;
};

const valoresDeEmbudos = (config: ConfiguracionConEmbudos["config"]) =>
  (config?.dealPipelines ?? [])
    .map((embudo) => embudo?.value)
    .filter((valor): valor is string => typeof valor === "string" && !!valor);

/**
 * Embudos que la escritura añade respecto a lo guardado. Una modificación
 * que no toca `dealPipelines` (o que solo quita o renombra etapas) no añade
 * ninguno. Quitar un embudo tampoco cuenta: el límite es de altas.
 */
export const embudosNuevos = (
  cuerpo: string,
  configActual: unknown,
): string[] => {
  const enviados = embudosEnviados(cuerpo);
  if (enviados === null) return [];
  const existentes = new Set(
    valoresDeEmbudos(configActual as ConfiguracionConEmbudos["config"]),
  );
  return enviados.filter((valor) => !existentes.has(valor));
};

/**
 * Embudos guardados que la escritura ya no trae: se borraron y liberan
 * cupo. Una escritura sin `dealPipelines` no quita ninguno.
 */
export const embudosQuitados = (
  cuerpo: string,
  configActual: unknown,
): string[] => {
  const enviados = embudosEnviados(cuerpo);
  if (enviados === null) return [];
  const conservados = new Set(enviados);
  return valoresDeEmbudos(
    configActual as ConfiguracionConEmbudos["config"],
  ).filter((valor) => !conservados.has(valor));
};

/** Los embudos del cuerpo, o null si la escritura no toca `dealPipelines`. */
const embudosEnviados = (cuerpo: string): string[] | null => {
  const [fila] = filasDe(cuerpo);
  const config = fila ? (fila as ConfiguracionConEmbudos).config : null;
  if (!config || !Array.isArray(config.dealPipelines)) return null;
  return valoresDeEmbudos(config);
};

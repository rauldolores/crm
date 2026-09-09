/**
 * Ayudas puras de las herramientas del MCP.
 *
 * Viven aparte de `nucleo.ts` a propósito: ese arrastra el cliente de
 * Postgres, y las pruebas corren en un navegador, donde importarlo rompe la
 * carga del módulo. Aquí no hay ni un import.
 */

/** Máximo de filas que devuelve una herramienta de listado. */
export const LIMITE_POR_DEFECTO = 25;
export const LIMITE_MAXIMO = 100;

/**
 * Acota lo que pida el agente. Sin tope, un `limite: 10000` le llenaría su
 * propio contexto con filas que no va a leer.
 */
export const acotarLimite = (valor?: number): number =>
  Math.min(Math.max(1, valor ?? LIMITE_POR_DEFECTO), LIMITE_MAXIMO);

/**
 * Construye la parte `SET` de un UPDATE con los campos que llegaron
 * definidos, y sus parámetros.
 *
 * Las herramientas de edición reciben todos sus campos como opcionales: el
 * agente manda solo lo que cambia. Sin esto, cada una repetiría el mismo
 * bucle de «si viene, añádelo».
 */
export function construirSet(
  campos: Record<string, unknown>,
  desde = 1,
): { set: string; parametros: unknown[] } {
  const partes: string[] = [];
  const parametros: unknown[] = [];

  for (const [columna, valor] of Object.entries(campos)) {
    if (valor === undefined) continue;
    parametros.push(valor);
    partes.push(`${columna} = $${desde + parametros.length - 1}`);
  }

  return { set: partes.join(", "), parametros };
}

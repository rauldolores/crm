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

/** Fecha sola (`2026-09-11`) o fecha y hora ISO 8601 con desfase. */
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FECHA_Y_HORA_CON_DESFASE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Valida el vencimiento que manda el agente para una tarea o cita.
 *
 * La columna es `timestamptz` y la sesión del MCP corre en UTC, así que una
 * hora sin desfase («16:00») se guardaría como las 16:00 UTC y la cita
 * aparecería a las diez de la mañana en México. Antes que adivinar la zona
 * del usuario, se le pide al agente que la incluya; él sí sabe dónde está.
 */
export function validarVencimiento(
  valor: string | undefined,
): { ok: true; valor: string | null } | { ok: false; motivo: string } {
  if (!valor) return { ok: true, valor: null };
  if (FECHA.test(valor) || FECHA_Y_HORA_CON_DESFASE.test(valor)) {
    return { ok: true, valor };
  }
  return {
    ok: false,
    motivo:
      "Vencimiento no válido. Usa aaaa-mm-dd para un plazo sin hora, " +
      "o aaaa-mm-ddThh:mm con desfase horario (p. ej. 2026-09-11T16:00-06:00) " +
      "para una cita a una hora concreta.",
  };
}

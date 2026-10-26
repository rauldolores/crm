/**
 * Las reglas del correo comercial: el que sale de la cola por una
 * automatización o un envío masivo para vender, no para atender a un cliente.
 *
 * A ese correo le aplican protecciones que el transaccional no necesita: un
 * enlace de baja (Gmail y Yahoo lo exigen a quien envía en volumen), un tope
 * diario, no repetir la misma plantilla a una dirección y no seguir
 * escribiendo a quien ya contestó. Un recordatorio de cotización, la encuesta
 * de un ticket o el aviso de una renovación son respuestas a algo que el
 * cliente pidió: esos salen siempre.
 *
 * Está separado del despachador para poder probarlo sin base de datos.
 */

export interface FilaDeCorreo {
  quote_id: number | null;
  ticket_id: number | null;
  contract_id: number | null;
}

export const esComercial = (fila: FilaDeCorreo): boolean =>
  fila.quote_id == null && fila.ticket_id == null && fila.contract_id == null;

/** Por qué un correo de la cola se canceló en vez de salir. */
export type MotivoDeCancelacion =
  /** La dirección se dio de baja. */
  | "baja"
  /** Esa plantilla ya salió a esa dirección (otra ficha la comparte). */
  | "repetido"
  /** Desde esa dirección ya contestaron: ahora le toca a una persona. */
  | "respondio";

export const MOTIVOS_DE_CANCELACION: Record<MotivoDeCancelacion, string> = {
  baja: "La dirección se dio de baja.",
  repetido: "Esa plantilla ya se envió a esta dirección.",
  respondio: "El contacto ya contestó; ahora le toca a una persona.",
};

export const normalizarCorreo = (correo: string): string =>
  correo.trim().toLowerCase();

export interface AjustesDeEnvio {
  /** Máximo de correos comerciales en 24 horas. */
  limiteDiario: number;
  /** Llegar al máximo poco a poco. */
  calentamiento: boolean;
}

export const AJUSTES_DE_ENVIO_POR_DEFECTO: AjustesDeEnvio = {
  limiteDiario: 200,
  calentamiento: true,
};

/** Con calentamiento: el primer día salen estos… */
export const CALENTAMIENTO_INICIAL = 20;
/** …y cada día siguiente, estos más, hasta el máximo. */
export const CALENTAMIENTO_DIARIO = 20;

const UN_DIA = 24 * 60 * 60 * 1000;

/**
 * Cuántos correos comerciales pueden salir en las 24 horas que acaban
 * `ahora`.
 *
 * El calentamiento cuenta desde el primer correo comercial que salió de la
 * organización: un dominio que nunca ha enviado en volumen y manda cientos el
 * primer día acaba en la carpeta de spam, y de ahí cuesta semanas salir.
 */
export const limiteDeHoy = (
  ajustes: AjustesDeEnvio,
  primerEnvio: Date | null,
  ahora: Date,
): number => {
  if (!ajustes.calentamiento) return ajustes.limiteDiario;
  const dias = primerEnvio
    ? Math.max(0, Math.floor((ahora.getTime() - primerEnvio.getTime()) / UN_DIA))
    : 0;
  return Math.min(
    ajustes.limiteDiario,
    CALENTAMIENTO_INICIAL + CALENTAMIENTO_DIARIO * dias,
  );
};

/**
 * Desde cuándo una respuesta de esa dirección detiene el correo: desde que
 * se abrió la oportunidad que lo originó. Sin oportunidad, los 30 días
 * anteriores a que se encolara.
 */
export const respuestasDesde = (
  creacionDeLaOportunidad: string | null,
  encolado: string,
): string =>
  creacionDeLaOportunidad ??
  new Date(new Date(encolado).getTime() - 30 * UN_DIA).toISOString();

/** El enlace de baja de un correo. */
export const enlaceDeBaja = (origen: string, token: string): string =>
  `${origen}/api/correos/baja/${token}`;

/**
 * Cabeceras de baja de un clic (RFC 8058): el programa de correo muestra su
 * propio botón «Cancelar suscripción» y hace un POST a la dirección, sin
 * abrir nada.
 */
export const cabecerasDeBaja = (enlace: string): Record<string, string> => ({
  "List-Unsubscribe": `<${enlace}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

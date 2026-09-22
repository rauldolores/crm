/**
 * Excedentes de los límites del plan (billing.md B7b), lado navegador.
 *
 * Cuando un límite tiene precio por unidad extra, agotarlo no bloquea: el
 * servidor deja pasar la operación y responde con la cabecera
 * `X-Vinqulia-Excedente` (ver lib/server/kontrolia-auth/consumo.ts). Aquí
 * se lee esa cabecera en cada respuesta y se convierte en un evento del
 * documento, que <AvisoDeExcedente> muestra como notificación. Este módulo
 * no importa nada del servidor: lo comparten el puente de datos y las rutas
 * /api del CRM desde el navegador.
 */

/** Cabecera con la que el servidor avisa de una operación en excedente. */
export const CABECERA_EXCEDENTE = "x-vinqulia-excedente";

/** Evento del documento con el excedente en `detail`. */
export const EVENTO_EXCEDENTE = "vinqulia:excedente";

export type Excedente = {
  key: string;
  limit: number | null;
  used: number;
  period: "day" | "month" | "year" | "lifetime";
  /** Centavos por unidad extra. */
  overagePriceAmount: number | null;
  /** Unidades por encima del límite en el periodo. */
  overageUnits: number;
  /** overageUnits × overagePriceAmount, en centavos. */
  overageAmount: number;
  currency: string;
};

const esExcedente = (valor: unknown): valor is Excedente =>
  typeof valor === "object" &&
  valor !== null &&
  typeof (valor as Excedente).key === "string" &&
  typeof (valor as Excedente).overagePriceAmount === "number";

/** El excedente que anuncia una respuesta, o null si no trae ninguno. */
export const excedenteDe = (respuesta: Response): Excedente | null => {
  const valor = respuesta.headers.get(CABECERA_EXCEDENTE);
  if (!valor) return null;
  try {
    const parseado: unknown = JSON.parse(valor);
    return esExcedente(parseado) ? parseado : null;
  } catch {
    return null;
  }
};

/**
 * Si la respuesta viene de una operación en excedente, lo anuncia al
 * documento. Devuelve la misma respuesta para encadenar en un `fetch`.
 */
export const avisarExcedenteDe = (respuesta: Response): Response => {
  const excedente = excedenteDe(respuesta);
  if (excedente && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<Excedente>(EVENTO_EXCEDENTE, { detail: excedente }),
    );
  }
  return respuesta;
};

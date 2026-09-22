/**
 * Límites de consumo del plan, reportados a KontrolIA Auth desde el servidor.
 *
 * El uso lo reporta el backend cuando lo cobrable realmente ocurre —se creó
 * el contacto, entró el usuario, se añadió el embudo— con la clave de API de
 * la aplicación, que nunca llega al navegador. KontrolIA cuenta y dice si se
 * pasó; qué hacer con eso lo decide cada punto de este CRM (ver
 * `exigirCupo`, `contarUso` y `liberarUso`).
 *
 * Sin KONTROLIA_AUTH_SERVER_URL o KONTROLIA_APPLICATION_API_KEY todo esto
 * queda inerte: no se reporta nada y no se bloquea nada. El interruptor
 * «Exigir plan» vive en KontrolIA Auth, no aquí.
 *
 * Excedentes (billing.md B7b, @kontrolia/auth ≥ 2.5): un límite puede tener
 * precio por unidad extra (`overagePriceAmount`). Con precio, agotar el
 * límite NO bloquea: la operación sigue, KontrolIA cobra solo la parte por
 * encima en la siguiente factura, y aquí se avisa a la persona (cabecera
 * `X-Vinqulia-Excedente`, que el navegador convierte en una notificación).
 * Sin precio, todo sigue igual: 402.
 */
import { reportUsage, type UsageReport } from "@kontrolia/auth/server";

import { configuracionDeUso } from "./configuracionDeUso";

/** Claves de límite que el administrador configuró en los planes de esta app. */
export const LIMITE_CONTACTOS = "contactos.registrados";
export const LIMITE_USUARIOS = "usuarios";
export const LIMITE_EMBUDOS = "pipelines";

/** true si el servidor está configurado para reportar consumo. */
export const limitesConfigurados = (): boolean => configuracionDeUso() !== null;

/**
 * Cabecera con la que una respuesta del servidor avisa de que la operación
 * se hizo en excedente (límite agotado, con precio por unidad extra). El
 * navegador la lee en su `fetch` y la muestra como notificación; ver
 * lib/kontrolia-auth/excedentes.ts.
 */
export const CABECERA_EXCEDENTE = "x-vinqulia-excedente";

/** Lo que viaja en la cabecera: lo justo para el aviso y el acumulado. */
export type Excedente = Pick<
  UsageReport,
  | "key"
  | "limit"
  | "used"
  | "period"
  | "overagePriceAmount"
  | "overageUnits"
  | "overageAmount"
  | "currency"
>;

/** true si el reporte dice «pasado del límite, y el plan lo cobra por unidad». */
export const enExcedente = (
  uso: UsageReport | null | undefined,
): uso is UsageReport =>
  !!uso &&
  uso.limit !== null &&
  uso.overagePriceAmount !== null &&
  uso.used >= uso.limit;

/**
 * El valor de la cabecera de excedente para un reporte, o null si no hay
 * excedente que contar (sin precio, sin límite o con cupo).
 */
export const cabeceraDeExcedente = (
  uso: UsageReport | null | undefined,
): string | null => {
  if (!enExcedente(uso)) return null;
  const excedente: Excedente = {
    key: uso.key,
    limit: uso.limit,
    used: uso.used,
    period: uso.period,
    overagePriceAmount: uso.overagePriceAmount,
    overageUnits: uso.overageUnits ?? 0,
    overageAmount: uso.overageAmount ?? 0,
    currency: uso.currency ?? "MXN",
  };
  return JSON.stringify(excedente);
};

/** Añade la cabecera de excedente a una respuesta si algún reporte lo trae. */
export const conAvisoDeExcedente = (
  respuesta: Response,
  reportes: (UsageReport | null | undefined)[],
): Response => {
  const valor = reportes.map(cabeceraDeExcedente).find(Boolean);
  if (!valor) return respuesta;
  const cabeceras = new Headers(respuesta.headers);
  cabeceras.set(CABECERA_EXCEDENTE, valor);
  return new Response(respuesta.body, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: cabeceras,
  });
};

/** Texto para la persona, con lo que le queda y de qué. */
const mensajeDeLimite = (uso: UsageReport, cantidad: number): string => {
  const periodo: Record<UsageReport["period"], string> = {
    day: " hoy",
    month: " este mes",
    year: " este año",
    lifetime: "",
  };
  const quedan = uso.remaining ?? 0;
  return cantidad > 1
    ? `Tu plan permite ${uso.limit}${periodo[uso.period]} y solo quedan ${quedan}; intentabas añadir ${cantidad}. Amplía tu plan para continuar.`
    : `Has alcanzado el límite de tu plan (${uso.used} de ${uso.limit}${periodo[uso.period]}). Amplía tu plan para continuar.`;
};

/**
 * Antes de crear: comprueba que quedan al menos `cantidad` unidades del
 * límite. Devuelve la respuesta 402 que hay que devolver al cliente, o null
 * si se puede seguir.
 *
 * Además de lo que hace requireLimit del SDK (¿ya está agotado?), comprueba
 * que caben TODAS las unidades que se van a crear: una importación de 50
 * contactos con 3 de cupo debe rechazarse entera, no pasar 50 con 3.
 *
 * Misma regla que requireLimit del SDK para los excedentes: si el límite
 * tiene precio por unidad extra, no se bloquea aunque no quede cupo; la
 * operación sigue y el aviso lo pone quien cuenta el uso (`contarUso` +
 * `conAvisoDeExcedente`). Sin precio, 402 como siempre.
 *
 * Si KontrolIA Auth no responde, se deja pasar: un fallo de red en el
 * proveedor de planes no debe dejar al cliente sin poder trabajar. El
 * consumo se reportará igual después, y el siguiente intento lo verá.
 */
export async function exigirCupo(
  organizacionId: string,
  clave: string,
  cantidad = 1,
): Promise<Response | null> {
  const config = configuracionDeUso();
  if (!config || cantidad <= 0) return null;

  let uso: UsageReport;
  try {
    uso = await reportUsage(config, {
      organizationId: organizacionId,
      limitKey: clave,
      amount: 0,
    });
  } catch (error: unknown) {
    console.error("[limites] no se pudo consultar el cupo", clave, error);
    return null;
  }

  if (uso.limit === null) return null;
  const quedan = uso.remaining ?? Math.max(0, uso.limit - uso.used);
  if (quedan >= cantidad) return null;
  // Hay precio por excedente: KontrolIA cobra lo que pase del límite y la
  // operación continúa.
  if (uso.overagePriceAmount !== null && uso.overagePriceAmount !== undefined)
    return null;

  return Response.json(
    { message: mensajeDeLimite(uso, cantidad), limit: uso },
    { status: 402 },
  );
}

/**
 * Reporta una unidad (o la devuelve, con `cantidad` -1) de forma idempotente
 * por recurso. Nunca lanza: lo cobrable ya ocurrió y no se va a deshacer
 * porque el contador no responda; queda en el registro del servidor.
 *
 * La clave de idempotencia lleva el límite y el sentido delante del id: en
 * KontrolIA es única por aplicación, y sin prefijo el contacto 5 y la ficha
 * 5 se pisarían.
 */
async function reportar(
  organizacionId: string,
  clave: string,
  sentido: "alta" | "baja",
  idRecurso: string | number,
): Promise<UsageReport | null> {
  const config = configuracionDeUso();
  if (!config) return null;
  try {
    return await reportUsage(config, {
      organizationId: organizacionId,
      limitKey: clave,
      amount: sentido === "alta" ? 1 : -1,
      idempotencyKey: `${clave}:${sentido}:${idRecurso}`,
    });
  } catch (error: unknown) {
    console.error(
      `[limites] no se pudo reportar la ${sentido}`,
      clave,
      idRecurso,
      error,
    );
    return null;
  }
}

/** Después de crear: cuenta una unidad del límite. */
export const contarUso = (
  organizacionId: string,
  clave: string,
  idRecurso: string | number,
): Promise<UsageReport | null> =>
  reportar(organizacionId, clave, "alta", idRecurso);

/**
 * Después de borrar: devuelve una unidad al cupo. Un límite «de por vida»
 * como contactos registrados o embudos cuenta lo que EXISTE, así que
 * borrar tiene que liberar; si no, el cupo se agota para siempre.
 */
export const liberarUso = (
  organizacionId: string,
  clave: string,
  idRecurso: string | number,
): Promise<UsageReport | null> =>
  reportar(organizacionId, clave, "baja", idRecurso);

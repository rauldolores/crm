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
 */
import {
  reportUsage,
  type UsageConfig,
  type UsageReport,
} from "@kontrolia/auth/server";

import { env } from "@/lib/env";

/** Claves de límite que el administrador configuró en los planes de esta app. */
export const LIMITE_CONTACTOS = "contactos.registrados";
export const LIMITE_USUARIOS = "usuarios";
export const LIMITE_EMBUDOS = "pipelines";

const configuracionDeUso = (): UsageConfig | null => {
  const authServerUrl = process.env.KONTROLIA_AUTH_SERVER_URL ?? "";
  const apiKey = process.env.KONTROLIA_APPLICATION_API_KEY ?? "";
  if (!authServerUrl || !apiKey) return null;
  return { authServerUrl, apiKey, applicationSlug: env.kontroliaApplicationSlug };
};

/** true si el servidor está configurado para reportar consumo. */
export const limitesConfigurados = (): boolean => configuracionDeUso() !== null;

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

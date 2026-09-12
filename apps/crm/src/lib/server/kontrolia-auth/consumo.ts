/**
 * Límites de consumo del plan, reportados a KontrolIA Auth desde el servidor.
 *
 * El uso lo reporta el backend cuando lo cobrable realmente ocurre —se creó
 * el contacto, entró el usuario, se añadió el embudo— con la clave de API de
 * la aplicación, que nunca llega al navegador. KontrolIA cuenta y dice si se
 * pasó; qué hacer con eso lo decide cada punto de este CRM (ver
 * `exigirCupo` y `contarUso`).
 *
 * `reportUsage` y `requireLimit` son una réplica exacta de las que trae
 * `@kontrolia/auth/server` a partir de la 2.3 (la 2.2.0 publicada no las
 * incluye aún). En cuanto se publique, se sustituyen por los imports del SDK.
 *
 * Sin KONTROLIA_AUTH_SERVER_URL o KONTROLIA_APPLICATION_API_KEY todo esto
 * queda inerte: no se reporta nada y no se bloquea nada. El interruptor
 * «Exigir plan» vive en KontrolIA Auth, no aquí.
 */
import { env } from "@/lib/env";

/** Claves de límite que el administrador configuró en los planes de esta app. */
export const LIMITE_CONTACTOS = "contactos.registrados";
export const LIMITE_USUARIOS = "usuarios";
export const LIMITE_EMBUDOS = "pipelines";

export interface UsageConfig {
  authServerUrl: string;
  applicationSlug: string;
  /** Clave kapp_ de la aplicación: solo servidor. */
  apiKey: string;
}

export interface UsageReport {
  key: string;
  used: number;
  /** null = ilimitado. */
  limit: number | null;
  remaining: number | null;
  period: "day" | "month" | "year" | "lifetime";
  periodStart: string;
  exceeded: boolean;
  planSlug: string | null;
}

const configuracionDeUso = (): UsageConfig | null => {
  const authServerUrl = process.env.KONTROLIA_AUTH_SERVER_URL ?? "";
  const apiKey = process.env.KONTROLIA_APPLICATION_API_KEY ?? "";
  if (!authServerUrl || !apiKey) return null;
  return { authServerUrl, apiKey, applicationSlug: env.kontroliaApplicationSlug };
};

/** true si el servidor está configurado para reportar consumo. */
export const limitesConfigurados = (): boolean => configuracionDeUso() !== null;

/**
 * Reporta consumo de un límite. Devuelve el estado del contador; la
 * aplicación decide qué significa `exceeded`. Con `idempotencyKey` estable
 * (el id del recurso) un reintento nunca cuenta doble.
 */
export async function reportUsage(
  config: UsageConfig,
  input: {
    organizationId: string;
    limitKey: string;
    amount?: number;
    idempotencyKey?: string;
  },
): Promise<UsageReport> {
  const respuesta = await fetch(
    `${config.authServerUrl.replace(/\/$/, "")}/api/usage`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug: config.applicationSlug,
        organizationId: input.organizationId,
        limitKey: input.limitKey,
        amount: input.amount ?? 1,
        idempotencyKey: input.idempotencyKey ?? null,
      }),
    },
  );
  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    usage?: UsageReport;
    error?: string;
  };
  if (!respuesta.ok || !cuerpo.usage) {
    throw new Error(
      cuerpo.error ?? `No se pudo reportar el uso (${respuesta.status}).`,
    );
  }
  return cuerpo.usage;
}

/**
 * Comprueba un límite SIN consumirlo (amount 0) y lanza una Response 402
 * si ya está agotado: el equivalente de requirePermission() para cupos.
 */
export async function requireLimit(
  config: UsageConfig,
  organizationId: string,
  limitKey: string,
): Promise<UsageReport> {
  const usage = await reportUsage(config, {
    organizationId,
    limitKey,
    amount: 0,
  });
  if (usage.limit !== null && usage.used >= usage.limit) {
    throw new Response(
      JSON.stringify({ error: "Límite del plan alcanzado", limit: usage }),
      { status: 402, headers: { "Content-Type": "application/json" } },
    );
  }
  return usage;
}

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
 * Además de lo que hace requireLimit (¿ya está agotado?), comprueba que
 * caben TODAS las unidades que se van a crear: una importación de 50
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
 * Después de crear: cuenta una unidad del límite, idempotente por el id del
 * recurso. Nunca lanza: lo cobrable ya ocurrió y no se va a deshacer porque
 * el contador no responda; queda en el registro del servidor.
 */
export async function contarUso(
  organizacionId: string,
  clave: string,
  idRecurso: string | number,
): Promise<UsageReport | null> {
  const config = configuracionDeUso();
  if (!config) return null;
  try {
    return await reportUsage(config, {
      organizationId: organizacionId,
      limitKey: clave,
      idempotencyKey: `${clave}:${idRecurso}`,
    });
  } catch (error: unknown) {
    console.error("[limites] no se pudo reportar el uso", clave, idRecurso, error);
    return null;
  }
}

import type { UsageConfig } from "@kontrolia/auth/server";

import { env } from "@/lib/env";

/**
 * Con qué se reporta el consumo a KontrolIA Auth: la URL del auth-server y
 * la clave de API de la aplicación (`kapp_…`, solo en el servidor). Sin
 * alguna de las dos, null: los límites quedan inertes. Va en su propio
 * módulo para que las pruebas de `consumo.ts` puedan sustituirlo.
 */
export const configuracionDeUso = (): UsageConfig | null => {
  const authServerUrl = process.env.KONTROLIA_AUTH_SERVER_URL ?? "";
  const apiKey = process.env.KONTROLIA_APPLICATION_API_KEY ?? "";
  if (!authServerUrl || !apiKey) return null;
  return { authServerUrl, apiKey, applicationSlug: env.kontroliaApplicationSlug };
};

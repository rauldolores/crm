import { env } from "@/lib/env";

/**
 * Los textos legales viven en el sitio público (apps/web), no en la app:
 * aquí solo se enlazan, sobre la misma URL del sitio que usa el resto del
 * CRM (NEXT_PUBLIC_SITIO_URL).
 */
export const URL_AVISO_DE_PRIVACIDAD = `${env.sitioUrl}/aviso-de-privacidad`;
export const URL_TERMINOS = `${env.sitioUrl}/terminos`;

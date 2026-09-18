/**
 * Los textos legales viven en el sitio público (apps/web), no en la app:
 * aquí solo se enlazan. Configurable por si una instalación por cuenta
 * propia quiere apuntar a los suyos.
 */
const SITIO =
  process.env.NEXT_PUBLIC_SITIO_PUBLICO?.replace(/\/$/, "") ||
  "https://vinqulia.com";

export const URL_AVISO_DE_PRIVACIDAD = `${SITIO}/aviso-de-privacidad`;
export const URL_TERMINOS = `${SITIO}/terminos`;

/**
 * URL base del sitio, para canonical, Open Graph y sitemap.
 *
 * En desarrollo y en local no hay dominio real: se cae a un valor por defecto
 * y se puede sobreescribir con NEXT_PUBLIC_SITE_URL en el despliegue.
 */
export const URL_SITIO = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vinqulia.com"
).replace(/\/$/, "");

export const urlAbsoluta = (ruta: string) => URL_SITIO + ruta;

/** La aplicación en producción: a donde mandan los botones de «empezar». */
export const URL_APP = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://crm.kontrolia.io"
).replace(/\/$/, "");

/** Recorta una descripción para las meta etiquetas sin cortar palabras. */
export const metaDescripcion = (texto: string, limite = 158) => {
  if (texto.length <= limite) return texto;
  const recorte = texto.slice(0, limite);
  return recorte.slice(0, recorte.lastIndexOf(" ")) + "…";
};

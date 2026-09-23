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
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.vinqulia.com"
).replace(/\/$/, "");

/**
 * Canales de contacto públicos: el correo general de Kontrolia y, si está
 * configurado, el WhatsApp — un número inventado sería peor que ninguno.
 */
export const CONTACTO = {
  correo: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@kontrolia.io",
  /** En formato internacional sin espacios, p. ej. 5215512345678. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "",
};

export const urlWhatsapp = (mensaje = "Hola, me interesa Vinqulia") =>
  CONTACTO.whatsapp
    ? `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(mensaje)}`
    : "";

/**
 * Identidad del responsable para el aviso de privacidad y los términos.
 * La razón social y el domicilio son datos legales que deben venir del
 * despliegue; mientras no estén, el aviso nombra a Kontrolia como nombre
 * comercial y omite el domicilio.
 */
export const RESPONSABLE = {
  nombreComercial: "Kontrolia",
  producto: "Vinqulia",
  razonSocial: process.env.NEXT_PUBLIC_RAZON_SOCIAL ?? "Kontrolia",
  domicilio: process.env.NEXT_PUBLIC_DOMICILIO_FISCAL ?? "",
  correoPrivacidad:
    process.env.NEXT_PUBLIC_PRIVACY_EMAIL ??
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ??
    "hola@kontrolia.io",
  /** Fecha de la última actualización de los textos legales. */
  actualizado: "17 de septiembre de 2026",
};

/** Recorta una descripción para las meta etiquetas sin cortar palabras. */
export const metaDescripcion = (texto: string, limite = 158) => {
  if (texto.length <= limite) return texto;
  const recorte = texto.slice(0, limite);
  return recorte.slice(0, recorte.lastIndexOf(" ")) + "…";
};

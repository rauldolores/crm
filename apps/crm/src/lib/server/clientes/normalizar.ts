/**
 * Normalizaciones puras de la reconciliación de clientes. Aparte de
 * reconciliar.ts para poder probarlas sin tocar la base.
 */

/** Dominios de correo genéricos: un @gmail.com no identifica a ninguna empresa. */
const DOMINIOS_GENERICOS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
  "protonmail.com",
]);

/**
 * Cada sistema escribe el RFC a su manera (guiones, minúsculas, espacios).
 * Se compara sin nada de eso, o «XAXX-010101-000» y «xaxx010101000» serían
 * dos clientes distintos.
 */
export const normalizarRfc = (valor: string): string =>
  valor.trim().toUpperCase().replace(/[^A-Z0-9&Ñ]/g, "");

/** El dominio de un correo si sirve para identificar una empresa. */
export const dominioDe = (email: string): string | null => {
  const dominio = email.trim().toLowerCase().split("@")[1];
  if (!dominio || DOMINIOS_GENERICOS.has(dominio)) return null;
  return dominio;
};

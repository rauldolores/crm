/**
 * Qué escrituras del programa de afiliados exigen ser administrador.
 *
 * Estas tablas deciden cuánto dinero se le paga a un afiliado: su comisión,
 * los meses que cobra y sus tasas por producto. Leerlas sigue abierto a
 * cualquiera con sesión, como el resto del CRM; escribirlas, no.
 *
 * El alta automática no pasa por el puente: la hace la base
 * (crm.gestionar_modulo_afiliados) al cerrarse una oportunidad del embudo de
 * afiliados, así que esta regla no la toca.
 *
 * Separado del puente para poder probar la regla sin una sesión de verdad: una
 * clave de API se la salta a propósito, así que el 403 solo se ve con un
 * usuario normal.
 */

export const RECURSOS_SOLO_ADMINISTRADOR: ReadonlySet<string> = new Set([
  "affiliates",
  "affiliate_rates",
]);

/**
 * true si esta petición solo la puede hacer un administrador.
 *
 * Una clave de API pasa: solo un administrador puede crearlas (ver
 * /api/claves), así que ya lleva su autoridad.
 */
export const exigeAdministrador = (
  recurso: string,
  metodo: string,
  viaClaveDeApi: boolean,
): boolean =>
  RECURSOS_SOLO_ADMINISTRADOR.has(recurso) &&
  metodo !== "GET" &&
  metodo !== "HEAD" &&
  !viaClaveDeApi;

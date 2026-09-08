import { cuentaDeEnvioDeOrganizacion } from "./configuracion";
import type { MensajeDeCorreo, ResultadoDeEnvio } from "./proveedores";
import { enviarConProveedor } from "./proveedores";

/**
 * Punto único de salida del correo del CRM: todo lo que envía la aplicación
 * (el envío manual desde una ficha, y lo que venga de automatizaciones) pasa
 * por aquí, y por tanto por el proveedor que haya configurado esa
 * organización. Ver `cuentaDeEnvioDeOrganizacion`.
 */

export async function enviarCorreoDeOrganizacion(
  organizacionId: string,
  mensaje: MensajeDeCorreo,
): Promise<ResultadoDeEnvio> {
  const cuenta = await cuentaDeEnvioDeOrganizacion(organizacionId);
  if (!cuenta) {
    return {
      ok: false,
      mensaje:
        "No hay un servidor de correo configurado. Configúralo en Ajustes → Correo saliente.",
    };
  }
  return enviarConProveedor(cuenta, mensaje);
}

/** ¿Puede esta organización enviar correo ahora mismo? */
export async function puedeEnviarCorreo(
  organizacionId: string,
): Promise<boolean> {
  return Boolean(await cuentaDeEnvioDeOrganizacion(organizacionId));
}

/**
 * Construye la dirección de Reply-To con el hash de hilo (sub-addressing
 * `local+hash@dominio`) que identifica al contacto, para que la respuesta
 * llegue de vuelta al webhook de entrada ya enlazada a su ficha. Devuelve
 * null si no hay dirección de captura configurada (instalación sin correo
 * entrante): en ese caso se envía sin Reply-To, sin encadenar hilo.
 */
export function construirResponderA(
  inboundEmail: string,
  contactId: string | number,
): string | null {
  const [local, dominio] = inboundEmail.split("@");
  if (!local || !dominio) return null;
  return `${local}+contacto-${contactId}@${dominio}`;
}

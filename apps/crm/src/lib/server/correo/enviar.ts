import { direccionDeRespuesta } from "../bandeja/configuracion";
import { cuentaDeEnvioDeOrganizacion } from "./configuracion";
import type { MensajeDeCorreo, ResultadoDeEnvio } from "./proveedores";
import { enviarConProveedor } from "./proveedores";

/**
 * Punto único de salida del correo del CRM: todo lo que envía la aplicación
 * (el envío manual desde una ficha, y lo que venga de automatizaciones) pasa
 * por aquí, y por tanto por el proveedor que haya configurado esa
 * organización. Ver `cuentaDeEnvioDeOrganizacion`.
 *
 * Si la organización tiene bandeja de correo, todo sale con su dirección
 * como Reply-To: la respuesta del cliente llega a la bandeja del equipo y no
 * al buzón de quien sea el remitente.
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
  const responderA =
    mensaje.responderA ?? (await direccionDeRespuesta(organizacionId));
  return enviarConProveedor(cuenta, {
    ...mensaje,
    responderA: responderA ?? undefined,
  });
}

/** ¿Puede esta organización enviar correo ahora mismo? */
export async function puedeEnviarCorreo(
  organizacionId: string,
): Promise<boolean> {
  return Boolean(await cuentaDeEnvioDeOrganizacion(organizacionId));
}


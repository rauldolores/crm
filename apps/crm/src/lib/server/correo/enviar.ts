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


import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { enviarCorreoDeOrganizacion } from "@/lib/server/correo/enviar";

/**
 * Envía un correo de prueba con la configuración guardada.
 *
 * Sin esto, la única forma de saber si el proveedor quedó bien configurado
 * sería esperar a que un correo real fallara. El error del proveedor (dominio
 * sin verificar, clave revocada…) se devuelve tal cual para que se pueda
 * corregir.
 */

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(
      403,
      "Solo un administrador puede enviar un correo de prueba.",
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    para?: string;
  } | null;
  const para = (cuerpo?.para ?? "").trim();
  if (!para) {
    return esError(400, "Escribe a qué dirección enviamos la prueba.");
  }

  const resultado = await enviarCorreoDeOrganizacion(organizacionId, {
    para,
    asunto: "Correo de prueba de Vinqulia",
    textoPlano:
      "Si estás leyendo esto, tu servidor de correo saliente quedó bien configurado.\n\nEnviado desde Vinqulia.",
  });

  if (!resultado.ok) {
    return esError(502, resultado.mensaje || "No se pudo enviar la prueba.");
  }

  return Response.json({ ok: true });
}

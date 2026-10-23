import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { ajustesVisibles } from "@/lib/server/bandeja/configuracion";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Dónde recibe correo la organización (Bandeja → Configurar).
 *
 * Fuera de /api/datos por lo mismo que el correo saliente: la tabla guarda
 * el secreto del aviso y, quizá, una clave de Resend, en claro. Solo un
 * administrador la cambia; GET devuelve si están, nunca su valor.
 */

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

const esCorreoValido = (valor: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

async function soloAdministrador(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return { respuesta: auth.response };
  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return {
      respuesta: esError(
        403,
        "Solo un administrador puede configurar la bandeja de correo.",
      ),
    };
  }
  return { organizacionId };
}

const respuestaCon = async (peticion: Request, organizacionId: string) =>
  Response.json({
    ...(await ajustesVisibles(organizacionId)),
    // La dirección que se pega en Resend → Webhooks.
    webhookUrl: `${new URL(peticion.url).origin}/api/bandeja/entrante/${organizacionId}`,
  });

export async function GET(peticion: Request) {
  const acceso = await soloAdministrador(peticion);
  if (!acceso.organizacionId) return acceso.respuesta;
  return respuestaCon(peticion, acceso.organizacionId);
}

export async function PUT(peticion: Request) {
  const acceso = await soloAdministrador(peticion);
  if (!acceso.organizacionId) return acceso.respuesta;
  const { organizacionId } = acceso;

  const cuerpo = ((await peticion.json().catch(() => null)) ?? {}) as {
    inboxEmail?: unknown;
    webhookSecret?: unknown;
    apiKey?: unknown;
    active?: unknown;
  };

  const inboxEmail =
    typeof cuerpo.inboxEmail === "string"
      ? cuerpo.inboxEmail.trim().toLowerCase().slice(0, 200)
      : "";
  // Opcional: la bandeja recibe en las direcciones de los proyectos
  // (Ajustes → Proyectos); esta es solo para organizaciones sin proyectos.
  if (inboxEmail && !esCorreoValido(inboxEmail)) {
    return esError(
      400,
      "Escribe una dirección válida, como hola@tuempresa.com, o déjala vacía.",
    );
  }

  const secreto =
    typeof cuerpo.webhookSecret === "string" ? cuerpo.webhookSecret.trim() : "";
  if (secreto && !/^whsec_[A-Za-z0-9+/=]+$/.test(secreto)) {
    return esError(
      400,
      "El secreto del webhook empieza con «whsec_». Cópialo completo desde Resend.",
    );
  }
  const clave = typeof cuerpo.apiKey === "string" ? cuerpo.apiKey.trim() : "";
  if (clave && !clave.startsWith("re_")) {
    return esError(400, "Las claves de Resend empiezan con «re_».");
  }

  // Los secretos solo se escriben cuando llegan nuevos: la pantalla nunca
  // los recibe, así que un guardado sin tocarlos no debe borrarlos.
  const fila: Record<string, unknown> = {
    organization_id: organizacionId,
    inbox_email: inboxEmail || null,
    active: typeof cuerpo.active === "boolean" ? cuerpo.active : true,
    updated_at: new Date().toISOString(),
    ...(secreto ? { webhook_secret: secreto } : {}),
    ...(clave ? { api_key: clave } : {}),
  };

  const { error } = await getServiceClient()
    .from("inbox_settings")
    .upsert(fila, { onConflict: "organization_id" });
  if (error) return esError(500, "No se pudo guardar la configuración.");

  return respuestaCon(peticion, organizacionId);
}

export async function DELETE(peticion: Request) {
  const acceso = await soloAdministrador(peticion);
  if (!acceso.organizacionId) return acceso.respuesta;

  const { error } = await getServiceClient()
    .from("inbox_settings")
    .delete()
    .eq("organization_id", acceso.organizacionId);
  if (error) return esError(500, "No se pudo borrar la configuración.");

  return respuestaCon(peticion, acceso.organizacionId);
}

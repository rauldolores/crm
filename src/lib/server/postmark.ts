/**
 * Cliente mínimo de la API de envío de Postmark, para uso EXCLUSIVO en
 * servidor. Es el mismo proveedor que ya procesa el correo entrante (ver
 * `supabase/functions/postmark/`), pero el token de envío es un secreto
 * distinto — nunca debe llegar al navegador.
 */

interface OpcionesDeEnvio {
  para: string;
  asunto: string;
  textoPlano: string;
  /** Reply-To con hash de hilo, para que una respuesta se archive sola. */
  responderA?: string;
}

interface ResultadoDeEnvio {
  ok: boolean;
  mensaje?: string;
}

/**
 * true cuando POSTMARK_SERVER_TOKEN y POSTMARK_FROM_EMAIL están configurados.
 * Las rutas que envían correo lo comprueban antes de intentar nada, para dar
 * un mensaje claro en vez de un error genérico de red.
 */
export function envioDeCorreoConfigurado(): boolean {
  return Boolean(
    process.env.POSTMARK_SERVER_TOKEN && process.env.POSTMARK_FROM_EMAIL,
  );
}

export async function enviarCorreo({
  para,
  asunto,
  textoPlano,
  responderA,
}: OpcionesDeEnvio): Promise<ResultadoDeEnvio> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const desde = process.env.POSTMARK_FROM_EMAIL;

  if (!token || !desde) {
    return {
      ok: false,
      mensaje:
        "Falta configurar POSTMARK_SERVER_TOKEN y POSTMARK_FROM_EMAIL para enviar correo desde el CRM.",
    };
  }

  const respuesta = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: desde,
      To: para,
      ReplyTo: responderA,
      Subject: asunto,
      TextBody: textoPlano,
      MessageStream: "outbound",
    }),
  }).catch(() => null);

  if (!respuesta) {
    return { ok: false, mensaje: "No se pudo contactar con Postmark." };
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    return {
      ok: false,
      mensaje:
        (cuerpo as { Message?: string }).Message ||
        `Postmark respondió ${respuesta.status}.`,
    };
  }

  return { ok: true };
}

/**
 * Construye la dirección de Reply-To con el hash de hilo (sub-addressing de
 * Postmark: `local+hash@dominio`) que identifica al contacto, para que la
 * respuesta llegue de vuelta al webhook de entrada ya enlazada a su ficha.
 * Devuelve null si no hay dirección de captura configurada (instalación sin
 * correo entrante): en ese caso se envía sin Reply-To, sin encadenar hilo.
 */
export function construirResponderA(
  inboundEmail: string,
  contactId: string | number,
): string | null {
  const [local, dominio] = inboundEmail.split("@");
  if (!local || !dominio) return null;
  return `${local}+contacto-${contactId}@${dominio}`;
}

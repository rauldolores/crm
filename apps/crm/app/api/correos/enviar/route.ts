import { env } from "@/lib/env";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import {
  construirResponderA,
  enviarCorreo,
  envioDeCorreoConfigurado,
} from "@/lib/server/postmark";

/**
 * Envía un correo real a un contacto desde el CRM y deja constancia como una
 * nota tipo "email" en su ficha — la mitad "saliente" del correo
 * bidireccional (la entrante ya la cubre `supabase/functions/postmark/`).
 *
 * El Reply-To lleva el hash de hilo del contacto (ver `construirResponderA`),
 * así que si el destinatario responde, el webhook de entrada la archiva sola
 * en esta misma ficha en vez de crear un contacto nuevo a partir del remitente.
 */

const MAX_ASUNTO = 200;
const MAX_CUERPO = 20000;

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  if (!envioDeCorreoConfigurado()) {
    return Response.json(
      {
        message:
          "El envío de correo no está configurado. Pide a quien administra el CRM que añada POSTMARK_SERVER_TOKEN y POSTMARK_FROM_EMAIL.",
      },
      { status: 501 },
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    contactId?: number;
    asunto?: string;
    texto?: string;
  } | null;

  const contactId = cuerpo?.contactId;
  const asunto = (cuerpo?.asunto ?? "").trim().slice(0, MAX_ASUNTO);
  const texto = (cuerpo?.texto ?? "").trim().slice(0, MAX_CUERPO);

  if (!contactId || !asunto || !texto) {
    return Response.json(
      { message: "Faltan datos: contacto, asunto y mensaje son obligatorios." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const { organizacionId, usuarioId } = auth.sesion;

  const { data: contacto, error: errorContacto } = await supabase
    .from("contacts")
    .select("id, organization_id, email_jsonb, sales_id")
    .eq("id", contactId)
    .maybeSingle();

  if (
    errorContacto ||
    !contacto ||
    contacto.organization_id !== organizacionId
  ) {
    return Response.json(
      { message: "Contacto no encontrado." },
      { status: 404 },
    );
  }

  const emails = (contacto.email_jsonb ?? []) as { email: string }[];
  const correoDestino = emails[0]?.email;
  if (!correoDestino) {
    return Response.json(
      { message: "Este contacto no tiene un correo electrónico registrado." },
      { status: 400 },
    );
  }

  const { data: comercial } = await supabase
    .from("sales")
    .select("id")
    .eq("user_id", usuarioId)
    .eq("organization_id", organizacionId)
    .maybeSingle();

  const responderA = env.inboundEmail
    ? construirResponderA(env.inboundEmail, contacto.id)
    : null;

  const resultado = await enviarCorreo({
    para: correoDestino,
    asunto,
    textoPlano: texto,
    responderA: responderA ?? undefined,
  });

  if (!resultado.ok) {
    return Response.json(
      { message: resultado.mensaje || "No se pudo enviar el correo." },
      { status: 502 },
    );
  }

  const ahora = new Date().toISOString();
  await supabase.from("contact_notes").insert({
    organization_id: organizacionId,
    contact_id: contacto.id,
    text: `${asunto}\n\n${texto}`,
    type: "email",
    sales_id: comercial?.id ?? contacto.sales_id,
    date: ahora,
  });

  await supabase
    .from("contacts")
    .update({ last_seen: ahora })
    .eq("id", contacto.id);

  return Response.json({ ok: true });
}

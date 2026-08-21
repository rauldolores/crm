import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import {
  enviarWhatsapp,
  envioDeWhatsappConfigurado,
} from "@/lib/server/twilioWhatsapp";

/**
 * Envía un WhatsApp real a un contacto desde el CRM y deja constancia como
 * una nota tipo "whatsapp" en su ficha — la mitad "saliente" (la entrante la
 * cubre `app/api/whatsapp/webhook`).
 */

const MAX_MENSAJE = 4096; // límite de WhatsApp

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  if (!envioDeWhatsappConfigurado()) {
    return Response.json(
      {
        message:
          "El envío de WhatsApp no está configurado. Pide a quien administra el CRM que añada TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM.",
      },
      { status: 501 },
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    contactId?: number;
    mensaje?: string;
  } | null;

  const contactId = cuerpo?.contactId;
  const mensaje = (cuerpo?.mensaje ?? "").trim().slice(0, MAX_MENSAJE);

  if (!contactId || !mensaje) {
    return Response.json(
      { message: "Faltan datos: contacto y mensaje son obligatorios." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const { organizacionId, usuarioId } = auth.sesion;

  const { data: contacto, error: errorContacto } = await supabase
    .from("contacts")
    .select("id, organization_id, phone_jsonb, sales_id")
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

  const telefonos = (contacto.phone_jsonb ?? []) as { number: string }[];
  const telefonoDestino = telefonos[0]?.number;
  if (!telefonoDestino) {
    return Response.json(
      { message: "Este contacto no tiene un teléfono registrado." },
      { status: 400 },
    );
  }

  const { data: comercial } = await supabase
    .from("sales")
    .select("id")
    .eq("user_id", usuarioId)
    .eq("organization_id", organizacionId)
    .maybeSingle();

  const resultado = await enviarWhatsapp(telefonoDestino, mensaje);

  if (!resultado.ok) {
    return Response.json(
      { message: resultado.mensaje || "No se pudo enviar el mensaje." },
      { status: 502 },
    );
  }

  const ahora = new Date().toISOString();
  await supabase.from("contact_notes").insert({
    organization_id: organizacionId,
    contact_id: contacto.id,
    text: mensaje,
    type: "whatsapp",
    sales_id: comercial?.id ?? contacto.sales_id,
    date: ahora,
  });

  await supabase
    .from("contacts")
    .update({ last_seen: ahora })
    .eq("id", contacto.id);

  return Response.json({ ok: true });
}

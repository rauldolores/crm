import { getServiceClient } from "@/lib/server/supabase-service";
import {
  firmaDeTwilioValida,
  normalizarTelefono,
} from "@/lib/server/twilioWhatsapp";

/**
 * Webhook de mensajes entrantes de WhatsApp (Twilio). Sin sesión: quien
 * escribe nunca inició sesión en el CRM, es un contacto en su propio
 * WhatsApp. Un único número de Twilio se comparte entre organizaciones (no
 * hay un número por organización en esta integración), así que la única
 * forma de saber a quién pertenece el mensaje es buscar qué contacto ya
 * tiene ese teléfono registrado — si no hay coincidencia, el mensaje se
 * descarta: no hay una organización segura a la que atribuirlo.
 *
 * A diferencia del correo entrante (que crea el contacto si no existe, a
 * partir de un remitente comercial conocido), aquí NO se crea nada nuevo:
 * cualquier número del mundo puede escribirle a este webhook, y crear una
 * ficha sin saber la organización sería imposible de acotar correctamente.
 */

const MAX_MENSAJE = 4096;

export async function POST(peticion: Request) {
  const datosFormulario = await peticion.formData().catch(() => null);
  if (!datosFormulario) {
    return new Response("Solicitud inválida.", { status: 400 });
  }

  const parametros = new URLSearchParams();
  for (const [clave, valor] of datosFormulario.entries()) {
    if (typeof valor === "string") parametros.set(clave, valor);
  }

  const urlDelWebhook = process.env.TWILIO_WHATSAPP_WEBHOOK_URL || "";
  const firmaValida = await firmaDeTwilioValida(
    urlDelWebhook,
    parametros,
    peticion.headers.get("x-twilio-signature"),
  );
  if (!urlDelWebhook || !firmaValida) {
    return new Response("Firma inválida.", { status: 403 });
  }

  const desdeCrudo = parametros.get("From") || "";
  const cuerpo = (parametros.get("Body") || "").trim().slice(0, MAX_MENSAJE);
  const telefonoEntrante = normalizarTelefono(
    desdeCrudo.replace(/^whatsapp:/, ""),
  );

  if (!telefonoEntrante || telefonoEntrante === "+" || !cuerpo) {
    return new Response("OK");
  }

  const supabase = getServiceClient();

  // Últimos 8 dígitos: acota la búsqueda antes del match exacto en JS, ya
  // que phone_jsonb guarda el número tal como lo escribió cada usuario
  // (con o sin espacios, guiones o prefijo de país) y no en E.164.
  const ultimosDigitos = telefonoEntrante.replace(/\D/g, "").slice(-8);
  if (ultimosDigitos.length < 8) {
    return new Response("OK");
  }

  const { data: candidatos } = await supabase
    .from("contacts_summary")
    .select("id, organization_id, sales_id, phone_jsonb")
    .ilike("phone_fts", `%${ultimosDigitos}%`)
    .limit(20);

  // Comparación por sufijo de dígitos, no por igualdad exacta: el teléfono
  // guardado suele faltarle el prefijo de país (lo escribió una persona a
  // mano), mientras que Twilio siempre manda el número completo en E.164.
  // 8 dígitos de cola son suficientes para no confundir dos números distintos.
  const contacto = (candidatos ?? []).find((c) =>
    ((c.phone_jsonb ?? []) as { number: string }[]).some((tel) => {
      const guardado = tel.number.replace(/\D/g, "");
      return guardado.length >= 8 && guardado.endsWith(ultimosDigitos);
    }),
  );

  if (!contacto) {
    return new Response("OK");
  }

  await supabase.from("contact_notes").insert({
    organization_id: contacto.organization_id,
    contact_id: contacto.id,
    text: cuerpo,
    type: "whatsapp",
    sales_id: contacto.sales_id,
  });

  await supabase
    .from("contacts")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", contacto.id);

  return new Response("OK");
}

import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import {
  enviarPlantillaWhatsapp,
  enviarWhatsapp,
  envioDeWhatsappConfigurado,
} from "@/lib/server/twilioWhatsapp";
import { contactoParaWhatsapp } from "@/lib/server/whatsapp/contacto";
import { listarPlantillasAprobadas } from "@/lib/server/whatsapp/plantillas";
import { ventanaDeConversacion } from "@/lib/server/whatsapp/ventana";
import {
  limpiarValor,
  rellenarPlantilla,
  SID_DE_PLANTILLA,
  variablesSinRellenar,
} from "@/lib/whatsapp/plantillas";

/**
 * Envía un WhatsApp real a un contacto desde el CRM y deja constancia como
 * una nota tipo "whatsapp" en su ficha — la mitad "saliente" (la entrante la
 * cubre `app/api/whatsapp/webhook`).
 *
 * Dos formas, excluyentes:
 *
 * - `mensaje`: texto libre. Solo si el contacto nos escribió en las últimas
 *   24 horas; si no, se rechaza aquí, porque Twilio lo aceptaría y el fallo
 *   llegaría después, con el CRM creyendo que el mensaje salió.
 * - `plantilla`: una plantilla aprobada y sus variables. Es la única forma de
 *   iniciar una conversación. El texto se rellena aquí, en el servidor, con la
 *   plantilla que devuelve Twilio y no con lo que mande el navegador.
 */

const MAX_MENSAJE = 4096; // límite de WhatsApp
const MAX_VARIABLE = 1000;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

type Envio =
  | { ok: true; texto: string; resultado: { ok: boolean; mensaje?: string } }
  | { ok: false; respuesta: Response };

async function enviarPlantilla(
  telefono: string,
  pedida: { sid?: unknown; variables?: unknown },
): Promise<Envio> {
  const sid = typeof pedida.sid === "string" ? pedida.sid : "";
  if (!SID_DE_PLANTILLA.test(sid)) {
    return { ok: false, respuesta: esError(400, "Plantilla no válida.") };
  }

  const lista = await listarPlantillasAprobadas();
  if (!lista.ok) return { ok: false, respuesta: esError(502, lista.mensaje) };

  const plantilla = lista.plantillas.find((p) => p.sid === sid);
  if (!plantilla) {
    return {
      ok: false,
      respuesta: esError(
        404,
        "Esa plantilla no existe o ya no está aprobada en WhatsApp.",
      ),
    };
  }

  // Solo las variables de la plantilla, limpias y acotadas: lo demás se ignora.
  const recibidas =
    pedida.variables && typeof pedida.variables === "object"
      ? (pedida.variables as Record<string, unknown>)
      : {};
  const valores = Object.fromEntries(
    plantilla.variables.map(({ clave }) => [
      clave,
      limpiarValor(
        typeof recibidas[clave] === "string"
          ? (recibidas[clave] as string)
          : "",
      ).slice(0, MAX_VARIABLE),
    ]),
  );

  const faltan = variablesSinRellenar(plantilla, valores);
  if (faltan.length) {
    return {
      ok: false,
      respuesta: esError(
        400,
        `Rellena todas las variables de la plantilla (falta ${faltan
          .map((clave) => `{{${clave}}}`)
          .join(", ")}).`,
      ),
    };
  }

  return {
    ok: true,
    texto: rellenarPlantilla(plantilla.cuerpo, valores),
    resultado: await enviarPlantillaWhatsapp(telefono, sid, valores),
  };
}

async function enviarTextoLibre(
  telefono: string,
  mensajeRecibido: unknown,
): Promise<Envio> {
  const mensaje =
    typeof mensajeRecibido === "string"
      ? mensajeRecibido.trim().slice(0, MAX_MENSAJE)
      : "";
  if (!mensaje) {
    return { ok: false, respuesta: esError(400, "Escribe el mensaje.") };
  }

  const ventana = await ventanaDeConversacion(telefono);
  if (!ventana.comprobada) {
    return {
      ok: false,
      respuesta: esError(
        409,
        "No se pudo comprobar si este contacto te escribió en las últimas 24 horas. Envíale una plantilla, que llega siempre.",
      ),
    };
  }
  if (!ventana.abierta) {
    return {
      ok: false,
      respuesta: esError(
        409,
        "Este contacto no te ha escrito en las últimas 24 horas, así que WhatsApp solo deja enviarle una plantilla aprobada.",
      ),
    };
  }

  return {
    ok: true,
    texto: mensaje,
    resultado: await enviarWhatsapp(telefono, mensaje),
  };
}

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  if (!envioDeWhatsappConfigurado()) {
    return esError(
      501,
      "El envío de WhatsApp no está configurado. Pide a quien administra el CRM que añada TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM.",
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    contactId?: unknown;
    mensaje?: unknown;
    plantilla?: { sid?: unknown; variables?: unknown };
  } | null;

  const { organizacionId, usuarioId } = auth.sesion;
  const contacto = await contactoParaWhatsapp(
    organizacionId,
    cuerpo?.contactId,
  );
  if (!contacto.ok) return esError(contacto.estado, contacto.mensaje);

  const envio = cuerpo?.plantilla
    ? await enviarPlantilla(contacto.telefono, cuerpo.plantilla)
    : await enviarTextoLibre(contacto.telefono, cuerpo?.mensaje);

  if (!envio.ok) return envio.respuesta;
  if (!envio.resultado.ok) {
    return esError(
      502,
      envio.resultado.mensaje || "No se pudo enviar el mensaje.",
    );
  }

  const supabase = getServiceClient();
  const { data: comercial } = await supabase
    .from("sales")
    .select("id")
    .eq("user_id", usuarioId)
    .eq("organization_id", organizacionId)
    .maybeSingle();

  const ahora = new Date().toISOString();
  await supabase.from("contact_notes").insert({
    organization_id: organizacionId,
    contact_id: contacto.id,
    text: envio.texto,
    type: "whatsapp",
    sales_id: comercial?.id ?? contacto.salesId,
    date: ahora,
  });

  await supabase
    .from("contacts")
    .update({ last_seen: ahora })
    .eq("id", contacto.id);

  return Response.json({ ok: true });
}

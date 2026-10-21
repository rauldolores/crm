import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { envioDeWhatsappConfigurado } from "@/lib/server/twilioWhatsapp";
import { contactoParaWhatsapp } from "@/lib/server/whatsapp/contacto";
import { listarPlantillasAprobadas } from "@/lib/server/whatsapp/plantillas";
import { ventanaDeConversacion } from "@/lib/server/whatsapp/ventana";
import type { OpcionesDeWhatsapp } from "@/lib/whatsapp/plantillas";

/**
 * Lo que necesita el diálogo de «Enviar WhatsApp» antes de dejarte escribir:
 * si el contacto puede recibir texto libre ahora mismo (te escribió en las
 * últimas 24 horas) y qué plantillas aprobadas hay para cuando no.
 *
 * Las dos preguntas a Twilio van en paralelo y en una sola petición del
 * navegador. Que fallen las plantillas no tumba la respuesta: si la ventana
 * está abierta, todavía se puede escribir libre.
 */

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
    contactId?: unknown;
  } | null;
  const contacto = await contactoParaWhatsapp(
    auth.sesion.organizacionId,
    cuerpo?.contactId,
  );
  if (!contacto.ok) {
    return Response.json(
      { message: contacto.mensaje },
      { status: contacto.estado },
    );
  }

  const [ventana, plantillas] = await Promise.all([
    ventanaDeConversacion(contacto.telefono),
    listarPlantillasAprobadas(),
  ]);

  const opciones: OpcionesDeWhatsapp = {
    ventana,
    plantillas: plantillas.ok ? plantillas.plantillas : [],
    errorDePlantillas: plantillas.ok ? null : plantillas.mensaje,
  };
  return Response.json(opciones);
}

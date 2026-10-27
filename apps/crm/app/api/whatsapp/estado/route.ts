import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { envioDeWhatsappConfigurado } from "@/lib/server/twilioWhatsapp";

/**
 * Si el CRM puede enviar WhatsApp por sí mismo. Sin Twilio, el botón
 * «Enviar WhatsApp» no abre el diálogo de envío (fallaría) sino el chat en
 * wa.me, en el WhatsApp de quien lo pulsa.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  return Response.json({ conectado: envioDeWhatsappConfigurado() });
}

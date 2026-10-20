import { actualizarDesdeFaqturia } from "@/lib/server/facturacion/conciliar";
import {
  AvisoDeFaqturia,
  EVENTOS_DE_FACTURA,
} from "@/lib/server/facturacion/faqturiaEstado";
import { firmaValida } from "@/lib/server/integraciones/firma";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Receptor de los avisos (webhooks) de Faqturia: una factura timbrada,
 * pagada (complemento de pago), pagada en parte o cancelada allá queda
 * igual aquí, sin esperar a la revisión de cada hora.
 *
 * Faqturia firma cada aviso con el secreto que da al crear el webhook:
 * `X-Webhook-Signature: t=<unix>,v1=<hex HMAC-SHA256(secreto, "<t>.<cuerpo>")>`
 * (300 s de tolerancia). Ese secreto se guarda en Vinqulia en Ajustes →
 * Facturación, en el conector de Faqturia (crm.connectors.webhook_secret,
 * solo service_role).
 *
 * La organización de Faqturia es la misma que la de Vinqulia (las dos
 * usan las organizaciones de KontrolIA Auth): con `organization_id` se
 * encuentra el conector y con su secreto se comprueba la firma.
 *
 * Respuestas: 200 (aplicado o ignorado), 401 firma inválida, 404 sin
 * conector de Faqturia con secreto para esa organización, 400 cuerpo no
 * válido.
 */

export const runtime = "nodejs";

const esError = (estado: number, mensaje: string) =>
  Response.json({ ok: false, message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  // El cuerpo CRUDO: la firma se calcula sobre el texto exacto que llegó.
  const cuerpo = await peticion.text();

  let json: unknown;
  try {
    json = JSON.parse(cuerpo);
  } catch {
    return esError(400, "El cuerpo no es JSON válido.");
  }
  const organizacion =
    typeof (json as { organization_id?: unknown })?.organization_id === "string"
      ? ((json as { organization_id: string }).organization_id as string)
      : "";
  if (!/^[0-9a-f-]{36}$/i.test(organizacion)) {
    return esError(400, "Falta la organización del aviso.");
  }

  const db = getServiceClient();
  const { data: conector } = await db
    .from("connectors")
    .select("id, webhook_secret")
    .eq("organization_id", organizacion)
    .eq("family", "invoicing")
    .eq("provider", "faqturia")
    .maybeSingle();
  const secreto = (conector?.webhook_secret as string | null) ?? "";
  if (!conector || !secreto) {
    return esError(404, "Esa organización no tiene Faqturia conectado.");
  }

  if (
    !firmaValida(cuerpo, peticion.headers.get("x-webhook-signature"), secreto)
  ) {
    return esError(401, "Firma del aviso inválida o vencida.");
  }

  const aviso = AvisoDeFaqturia.safeParse(json);
  if (!aviso.success) {
    return esError(400, "El aviso no trae la factura esperada.");
  }
  const evento =
    aviso.data.event ?? peticion.headers.get("x-webhook-event") ?? "";
  // Complementos de pago y demás: lo que importa de ellos es el estado de
  // la factura pagada, que llega con su propio aviso (invoice.paid…).
  if (!EVENTOS_DE_FACTURA.has(evento)) {
    return Response.json({ ok: true, ignored: true, reason: "event" });
  }

  try {
    const factura = await actualizarDesdeFaqturia(
      db,
      organizacion,
      aviso.data.data,
    );
    if (!factura) {
      // Una factura hecha en Faqturia a mano, no desde Vinqulia.
      return Response.json({ ok: true, ignored: true, reason: "unknown" });
    }
    return Response.json({
      ok: true,
      invoice_id: factura.id,
      billing_status: factura.billing_status,
      payment_status: factura.payment_status,
    });
  } catch (error) {
    console.error("[facturación] aviso de Faqturia", error);
    return esError(
      500,
      "No se pudo aplicar el aviso; Faqturia lo reintentará.",
    );
  }
}

import { rellenarCampos } from "@/components/crm/email/camposDeFusion";
import { envolverEnPlantilla } from "@/components/crm/email/plantillaBase";
import { env } from "@/lib/env";
import {
  construirResponderA,
  enviarCorreoDeOrganizacion,
} from "../correo/enviar";
import { valoresDeFusion } from "../correo/valoresDeFusion";
import { getServiceClient } from "../supabase-service";
import {
  enlacePublico,
  fechaLegible,
  importeLegible,
  type CotizacionCompleta,
} from "./cotizaciones";

/**
 * Envía una cotización por correo con su enlace público.
 *
 * Con plantilla: la de correo que elija la persona, con los campos
 * {{cotizacion.*}} además de los del contacto. Sin plantilla: un correo
 * corto con el mismo armazón de diseño de las plantillas (logo del emisor,
 * botón «Ver cotización»), para que enviar no obligue a diseñar nada.
 */

export type ResultadoDeEnvio =
  | { ok: true; enlace: string; para: string }
  | { ok: false; status: number; mensaje: string };

const escapar = (texto: string): string =>
  texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Los campos de fusión propios de la cotización. */
export const valoresDeCotizacion = (
  completa: CotizacionCompleta,
  enlace: string,
): Record<string, string> => ({
  "cotizacion.numero": completa.cotizacion.number,
  "cotizacion.titulo": completa.cotizacion.title,
  "cotizacion.total": importeLegible(
    completa.cotizacion.total,
    completa.cotizacion.currency,
  ),
  "cotizacion.vigencia": fechaLegible(completa.cotizacion.valid_until),
  "cotizacion.enlace": enlace,
});

const correoPorDefecto = (
  completa: CotizacionCompleta,
  enlace: string,
  mensaje: string | undefined,
): { asunto: string; html: string; textoPlano: string } => {
  const { cotizacion, emisor, contacto } = completa;
  const saludo = contacto?.first_name ? `Hola ${escapar(contacto.first_name)},` : "Hola,";
  const cuerpo =
    mensaje?.trim() ||
    `Te compartimos la cotización ${cotizacion.number}: ${cotizacion.title}. Puedes verla completa y aceptarla desde el enlace de abajo.`;
  const vigencia = cotizacion.valid_until
    ? ` Es válida hasta el ${fechaLegible(cotizacion.valid_until)}.`
    : "";
  const total = importeLegible(cotizacion.total, cotizacion.currency);

  const contenidoHtml = `
    <p>${saludo}</p>
    <p>${escapar(cuerpo)}</p>
    <p><strong>Total: ${escapar(total)}</strong> (IVA incluido).${escapar(vigencia)}</p>
    ${emisor.name ? `<p>${escapar(emisor.name)}</p>` : ""}`;

  return {
    asunto: `Cotización ${cotizacion.number}: ${cotizacion.title}`,
    html: envolverEnPlantilla({
      contenidoHtml,
      logoUrl: emisor.logo_url ?? null,
      ctaTexto: "Ver cotización",
      ctaUrl: enlace,
      piePersonalizado: emisor.name || null,
    }),
    textoPlano: `${saludo}\n\n${cuerpo}\n\nTotal: ${total}.${vigencia}\n\nVer cotización: ${enlace}`,
  };
};

export async function enviarCotizacion(
  completa: CotizacionCompleta,
  opciones: {
    origen: string;
    para?: string;
    templateId?: number | null;
    mensaje?: string;
  },
): Promise<ResultadoDeEnvio> {
  const { cotizacion, contacto } = completa;
  const organizacionId = cotizacion.organization_id as string;
  const para = opciones.para?.trim() || contacto?.email || "";
  if (!para) {
    return {
      ok: false,
      status: 400,
      mensaje:
        "La cotización no tiene un contacto con correo. Indica a quién enviarla.",
    };
  }
  if (cotizacion.status === "accepted" || cotizacion.status === "rejected") {
    return {
      ok: false,
      status: 409,
      mensaje: "Esta cotización ya fue respondida; crea una nueva para reenviar.",
    };
  }

  const enlace = enlacePublico(opciones.origen, cotizacion.public_token);
  const supabase = getServiceClient();

  let asunto: string;
  let html: string;
  let textoPlano: string;

  if (opciones.templateId) {
    const { data: plantilla } = await supabase
      .from("email_templates")
      .select(
        "subject, body_html, logo_url, accent_color, cta_text, cta_url, footer_text, active",
      )
      .eq("id", opciones.templateId)
      .eq("organization_id", organizacionId)
      .maybeSingle();
    if (!plantilla || !plantilla.active) {
      return {
        ok: false,
        status: 404,
        mensaje: "La plantilla no existe o está desactivada.",
      };
    }
    const delContacto = cotizacion.contact_id
      ? await valoresDeFusion(
          organizacionId,
          Number(cotizacion.contact_id),
          cotizacion.deal_id ? Number(cotizacion.deal_id) : null,
        )
      : null;
    const valores = {
      ...(delContacto?.valores ?? {}),
      ...valoresDeCotizacion(completa, enlace),
    };
    asunto = rellenarCampos(plantilla.subject as string, valores);
    html = rellenarCampos(
      envolverEnPlantilla({
        contenidoHtml: plantilla.body_html as string,
        logoUrl: plantilla.logo_url as string | null,
        colorPrincipal: plantilla.accent_color as string | null,
        // Sin botón propio, el botón es el enlace de la cotización: es lo
        // que la persona tiene que abrir.
        ctaTexto: (plantilla.cta_text as string | null) || "Ver cotización",
        ctaUrl: (plantilla.cta_url as string | null) || enlace,
        piePersonalizado: plantilla.footer_text as string | null,
      }),
      valores,
    );
    textoPlano = rellenarCampos(
      `${(plantilla.body_html as string).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n\n${enlace}`,
      valores,
    );
  } else {
    ({ asunto, html, textoPlano } = correoPorDefecto(
      completa,
      enlace,
      opciones.mensaje,
    ));
  }

  const responderA =
    env.inboundEmail && cotizacion.contact_id
      ? construirResponderA(env.inboundEmail, cotizacion.contact_id)
      : null;

  const resultado = await enviarCorreoDeOrganizacion(organizacionId, {
    para,
    asunto,
    textoPlano,
    html,
    responderA: responderA ?? undefined,
  });
  if (!resultado.ok) {
    return {
      ok: false,
      status: 502,
      mensaje: resultado.mensaje ?? "No se pudo enviar el correo.",
    };
  }

  const ahora = new Date().toISOString();
  await supabase
    .from("quotes")
    .update({
      // Una cotización ya vista sigue «vista» aunque se reenvíe.
      ...(cotizacion.status === "draft" ? { status: "sent" } : {}),
      sent_at: ahora,
      updated_at: ahora,
    })
    .eq("id", cotizacion.id);

  if (cotizacion.contact_id) {
    await supabase.from("contact_notes").insert({
      organization_id: organizacionId,
      contact_id: cotizacion.contact_id,
      text: `${asunto}\n\n${textoPlano}`,
      type: "email",
      date: ahora,
      sales_id: cotizacion.sales_id,
    });
  }

  return { ok: true, enlace, para };
}

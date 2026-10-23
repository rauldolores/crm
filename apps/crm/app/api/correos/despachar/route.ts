import { getServiceClient } from "@/lib/server/supabase-service";
import { enviarCorreoDeOrganizacion } from "@/lib/server/correo/enviar";
import {
  elegirProyecto,
  proyectosDeLaEmpresaDelContacto,
  proyectosDeOrganizacion,
  type ProyectosDeOrganizacion,
} from "@/lib/server/correo/proyectos";
import { valoresDeFusion } from "@/lib/server/correo/valoresDeFusion";
import {
  cotizacionPorId,
  enlacePublico,
} from "@/lib/server/cotizaciones/cotizaciones";
import { valoresDeCotizacion } from "@/lib/server/cotizaciones/enviar";
import { rellenarCampos } from "@/components/crm/email/camposDeFusion";
import { envolverEnPlantilla } from "@/components/crm/email/plantillaBase";

/**
 * Envía los correos que dejaron encoladas las automatizaciones.
 *
 * La llama la propia base de datos (crm.despachar_correos, cada minuto por
 * pg_cron) porque el disparador no puede armar el correo: el diseño y la
 * resolución de los campos de fusión viven en TypeScript, y reescribirlos en
 * plpgsql daría dos renders que se desincronizan.
 *
 * No lleva sesión de usuario: la autentica un secreto compartido que solo
 * conocen la base y esta ruta. Sin él, cualquiera podría dispararla.
 */

const MAX_POR_TANDA = 25;
/** Espera creciente entre reintentos: 1, 3, 9, 27 y 81 minutos. */
const esperaEnMinutos = (intentos: number) => 3 ** intentos;

interface FilaDeCola {
  id: number;
  organization_id: string;
  template_id: number;
  contact_id: number;
  deal_id: number | null;
  contract_id: number | null;
  quote_id: number | null;
  ticket_id: number | null;
  attempts: number;
}

interface Plantilla {
  subject: string;
  body_html: string;
  logo_url: string | null;
  accent_color: string | null;
  cta_text: string | null;
  cta_url: string | null;
  footer_text: string | null;
  active: boolean;
  /** De qué proyecto es: desde su dirección sale el correo. */
  project: string | null;
}

export async function POST(peticion: Request) {
  const supabase = getServiceClient();

  const { data: ajuste } = await supabase
    .from("internal_settings")
    .select("value")
    .eq("key", "dispatch_secret")
    .maybeSingle();

  const esperado = (ajuste?.value as string | undefined) ?? "";
  const recibido = peticion.headers.get("x-vinqulia-despacho") ?? "";
  if (!esperado || recibido !== esperado) {
    return Response.json({ message: "No autorizado." }, { status: 401 });
  }

  const { data: pendientes } = await supabase
    .from("email_outbox")
    .select(
      "id, organization_id, template_id, contact_id, deal_id, contract_id, quote_id, ticket_id, attempts",
    )
    .is("sent_at", null)
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at")
    .limit(MAX_POR_TANDA);

  let enviados = 0;
  let fallidos = 0;
  // Una lectura de la configuración por organización y tanda.
  const proyectosPorOrganizacion = new Map<string, ProyectosDeOrganizacion>();

  for (const fila of (pendientes ?? []) as FilaDeCola[]) {
    // Se marca el intento ANTES de enviar: si el proceso muere a mitad, el
    // correo no se reintenta indefinidamente. Peor un aviso perdido que uno
    // repetido muchas veces al mismo contacto.
    await supabase
      .from("email_outbox")
      .update({
        attempts: fila.attempts + 1,
        next_attempt_at: new Date(
          Date.now() + esperaEnMinutos(fila.attempts + 1) * 60_000,
        ).toISOString(),
      })
      .eq("id", fila.id);

    const fallo = async (motivo: string) => {
      fallidos += 1;
      await supabase
        .from("email_outbox")
        .update({ last_error: motivo })
        .eq("id", fila.id);
    };

    const { data: plantilla } = await supabase
      .from("email_templates")
      .select(
        "subject, body_html, logo_url, accent_color, cta_text, cta_url, footer_text, active, project",
      )
      .eq("id", fila.template_id)
      .eq("organization_id", fila.organization_id)
      .maybeSingle();

    if (!plantilla || !(plantilla as Plantilla).active) {
      await fallo("La plantilla ya no existe o está desactivada.");
      continue;
    }

    const resuelto = await valoresDeFusion(
      fila.organization_id,
      fila.contact_id,
      fila.deal_id,
      fila.contract_id,
      fila.ticket_id,
      new URL(peticion.url).origin,
    );
    if (!resuelto?.correoDelContacto) {
      await fallo("El contacto no tiene correo electrónico registrado.");
      continue;
    }

    const p = plantilla as Plantilla;
    const { correoDelContacto } = resuelto;
    let valores = resuelto.valores;

    // Recordatorio de cotización: los campos {{cotizacion.*}} y su enlace,
    // armado con el origen de esta misma petición.
    if (fila.quote_id) {
      const completa = await cotizacionPorId(
        fila.organization_id,
        fila.quote_id,
      );
      if (completa) {
        valores = {
          ...valores,
          ...valoresDeCotizacion(
            completa,
            enlacePublico(
              new URL(peticion.url).origin,
              completa.cotizacion.public_token,
            ),
          ),
        };
      }
    }

    // El mismo armazón que se ve en la vista previa al editar la plantilla.
    const html = rellenarCampos(
      envolverEnPlantilla({
        contenidoHtml: p.body_html,
        logoUrl: p.logo_url,
        colorPrincipal: p.accent_color,
        ctaTexto: p.cta_text,
        // El destino del botón puede ser un campo de fusión, para que cada
        // contacto reciba su propio enlace.
        ctaUrl: p.cta_url,
        piePersonalizado: p.footer_text,
      }),
      valores,
    );
    const asunto = rellenarCampos(p.subject, valores);
    const textoPlano = rellenarCampos(
      p.body_html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      valores,
    );

    // Desde qué proyecto: el de la plantilla, el de la oportunidad o el de
    // la empresa. Aquí no hay a quién preguntar: con varios, el
    // predeterminado.
    if (!proyectosPorOrganizacion.has(fila.organization_id)) {
      proyectosPorOrganizacion.set(
        fila.organization_id,
        await proyectosDeOrganizacion(fila.organization_id),
      );
    }
    const { data: oportunidad } = fila.deal_id
      ? await supabase
          .from("deals")
          .select("project")
          .eq("id", fila.deal_id)
          .eq("organization_id", fila.organization_id)
          .maybeSingle()
      : { data: null };
    const eleccion = elegirProyecto(
      proyectosPorOrganizacion.get(fila.organization_id)!,
      {
        fijo: [p.project, oportunidad?.project as string | null],
        deLaEmpresa: await proyectosDeLaEmpresaDelContacto(
          fila.organization_id,
          fila.contact_id,
        ),
      },
    );

    const resultado = await enviarCorreoDeOrganizacion(
      fila.organization_id,
      { para: correoDelContacto, asunto, textoPlano, html },
      eleccion.tipo === "proyecto" ? eleccion.proyecto : null,
    );

    if (!resultado.ok) {
      await fallo(resultado.mensaje ?? "No se pudo enviar el correo.");
      continue;
    }

    const ahora = new Date().toISOString();
    await supabase
      .from("email_outbox")
      .update({ sent_at: ahora, last_error: null })
      .eq("id", fila.id);

    // Queda constancia en la ficha, igual que un correo enviado a mano: si
    // no, nadie sabría que al contacto ya se le escribió.
    await supabase.from("contact_notes").insert({
      organization_id: fila.organization_id,
      contact_id: fila.contact_id,
      text: `${asunto}\n\n${textoPlano}`,
      type: "email",
      date: ahora,
    });

    enviados += 1;
  }

  return Response.json({ enviados, fallidos });
}

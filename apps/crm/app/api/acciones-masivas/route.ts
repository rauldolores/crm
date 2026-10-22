import {
  repartirDestinatarios,
  type OportunidadParaEnvio,
} from "@/lib/server/accionesMasivas/destinatarios";
import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Ejecuta una acción sobre muchas oportunidades a la vez.
 *
 * Solo encola: no manda los correos. El despachador que ya existe los envía a
 * su propio ritmo (25 por minuto, ver /api/correos/despachar), así que un
 * encargo de cinco mil sale solo en unas horas sin quemar la reputación del
 * dominio. Y cada tarjeta se mueve de etapa cuando SU correo sale, por la
 * regla del disparador `email_outbox:sent` — aquí no se toca ninguna etapa.
 *
 * El encargo se elige por embudo y etapa, no por una lista de casillas
 * marcadas ni por un filtro arbitrario: con miles de tarjetas nadie
 * selecciona a mano, y reenviar el filtro obligaría a reimplementar aquí el
 * lenguaje de filtros de PostgREST. Embudo y etapa son explícitos y el
 * servidor resuelve el mismo conjunto que la pantalla enseña.
 *
 * Solo un administrador: mandar miles de correos compromete la reputación
 * del dominio de toda la organización.
 *
 * Repetir el mismo encargo no duplica envíos: las oportunidades que ya tienen
 * un correo de esa plantilla (enviado o en cola) se omiten.
 */

/** Tope por encargo. Más que esto es casi siempre un filtro mal puesto. */
const MAXIMO_POR_ENCARGO = 10_000;
/** Filas por INSERT. */
const POR_TANDA = 500;

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId, usuarioId } = auth.sesion;

  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return Response.json(
      {
        message:
          "Solo un administrador puede lanzar una acción sobre muchas oportunidades.",
      },
      { status: 403 },
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    embudo?: unknown;
    etapa?: unknown;
    accion?: unknown;
    plantillaId?: unknown;
  } | null;

  const embudo = typeof cuerpo?.embudo === "string" ? cuerpo.embudo : "";
  const etapa = typeof cuerpo?.etapa === "string" ? cuerpo.etapa : "";
  const plantillaId = Number(cuerpo?.plantillaId);

  if (cuerpo?.accion !== "send_email") {
    return Response.json({ message: "Acción no disponible." }, { status: 400 });
  }
  if (!embudo || !etapa || !Number.isFinite(plantillaId)) {
    return Response.json(
      { message: "Faltan el embudo, la etapa o la plantilla." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  // La plantilla tiene que ser de esta organización y estar activa: si no, el
  // despachador la descartaría una por una y el encargo parecería correcto.
  const { data: plantilla } = await supabase
    .from("email_templates")
    .select("id")
    .eq("id", plantillaId)
    .eq("organization_id", organizacionId)
    .eq("active", true)
    .maybeSingle();
  if (!plantilla) {
    return Response.json(
      { message: "La plantilla no existe o está desactivada." },
      { status: 404 },
    );
  }

  const { data: oportunidades, error: errorOportunidades } = await supabase
    .from("deals")
    .select("id, contact_ids")
    .eq("organization_id", organizacionId)
    .eq("pipeline", embudo)
    .eq("stage", etapa)
    .is("archived_at", null)
    .order("id")
    .limit(MAXIMO_POR_ENCARGO);
  if (errorOportunidades) {
    return Response.json(
      { message: "No se pudieron leer las oportunidades." },
      { status: 502 },
    );
  }

  const filas = (oportunidades ?? []) as OportunidadParaEnvio[];
  if (filas.length === 0) {
    return Response.json({
      requested: 0,
      enqueued: 0,
      skipped_reasons: {},
      id: null,
    });
  }

  // Quién tiene correo y quién ya recibió esta plantilla: dos consultas, no
  // una por oportunidad.
  const idsDeContacto = [
    ...new Set(filas.flatMap((fila) => (fila.contact_ids ?? []).slice(0, 1))),
  ];
  const [{ data: contactos }, { data: yaEncoladas }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, email_jsonb")
      .eq("organization_id", organizacionId)
      .in("id", idsDeContacto.length ? idsDeContacto : [0]),
    supabase
      .from("email_outbox")
      .select("deal_id")
      .eq("organization_id", organizacionId)
      .eq("template_id", plantillaId)
      .in(
        "deal_id",
        filas.map((fila) => fila.id),
      ),
  ]);

  const conCorreo = new Set(
    (contactos ?? [])
      .filter((contacto) => {
        const correos = contacto.email_jsonb as
          | { email?: string }[]
          | null
          | undefined;
        return (correos ?? []).some((entrada) => Boolean(entrada?.email));
      })
      .map((contacto) => contacto.id as number),
  );
  const encoladas = new Set(
    (yaEncoladas ?? [])
      .map((fila) => fila.deal_id as number | null)
      .filter((id): id is number => id != null),
  );

  const { aEncolar, omitidos } = repartirDestinatarios(
    filas,
    conCorreo,
    encoladas,
  );

  const responsable = await comercialDeLaSesion(organizacionId, usuarioId);

  const { data: encargo, error: errorEncargo } = await supabase
    .from("bulk_jobs")
    .insert({
      organization_id: organizacionId,
      sales_id: responsable,
      resource: "deals",
      action_type: "send_email",
      action_params: { templateId: plantillaId },
      target: { pipeline: embudo, stage: etapa },
      requested: filas.length,
      enqueued: 0,
      skipped_reasons: omitidos,
    })
    .select("id")
    .single();
  if (errorEncargo || !encargo) {
    return Response.json(
      { message: "No se pudo registrar la acción." },
      { status: 502 },
    );
  }

  let encolados = 0;
  for (let i = 0; i < aEncolar.length; i += POR_TANDA) {
    const tanda = aEncolar.slice(i, i + POR_TANDA).map((destino) => ({
      organization_id: organizacionId,
      template_id: plantillaId,
      contact_id: destino.contactId,
      deal_id: destino.dealId,
      bulk_job_id: encargo.id,
    }));
    const { error } = await supabase.from("email_outbox").insert(tanda);
    if (error) break;
    encolados += tanda.length;
  }

  // Se guarda lo que de verdad se encoló, no lo que se pretendía: si una tanda
  // falló, el encargo debe decirlo.
  await supabase
    .from("bulk_jobs")
    .update({ enqueued: encolados })
    .eq("id", encargo.id);

  return Response.json({
    id: encargo.id,
    requested: filas.length,
    enqueued: encolados,
    skipped_reasons: omitidos,
  });
}

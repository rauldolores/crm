import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Ruta pública de un formulario de captación: sin sesión, sin
 * `requireKontroliaPermission`, porque quien la usa nunca ha iniciado sesión
 * — es un visitante en la página web del cliente. La organización se
 * resuelve del slug con la clave de servicio; nunca se acepta del cliente.
 *
 * GET  → datos mínimos para pintar la página (título, tipo, si está disponible).
 * POST → según el tipo del formulario:
 *   - "lead": crea el contacto (y, si escribió mensaje, una nota tipo "web").
 *   - "ticket": crea (o reutiliza) el contacto y su empresa, y abre un ticket
 *     de soporte asociado a ambos.
 */

const MAX_NOMBRE = 200;
const MAX_TEXTO = 5000;
const MAX_TELEFONO = 50;
const MAX_ETIQUETA = 100;
const MAX_ENVIOS_POR_VENTANA = 20;
const VENTANA_MINUTOS = 10;

type Contexto = { params: Promise<{ clave: string }> };

const recortar = (valor: unknown, limite: number): string =>
  typeof valor === "string" ? valor.trim().slice(0, limite) : "";

const recortarLista = (valor: unknown, limite: number): string[] =>
  Array.isArray(valor)
    ? valor
        .filter((v): v is string => typeof v === "string" && v.trim() !== "")
        .slice(0, 10)
        .map((v) => v.trim().slice(0, limite))
    : [];

/**
 * Preguntas de calificación comercial (opcionales): las manda el formulario
 * de la web pública, no el formulario nativo del CRM. Se anexan como nota
 * en vez de custom_fields para no depender de que la organización tenga
 * definidos esos campos en Ajustes.
 */
const construirNotaDeCalificacion = (
  datos: Record<string, unknown>,
): string => {
  const problema = recortar(datos.problema, MAX_TEXTO);
  const empleados = recortar(datos.empleados, MAX_ETIQUETA);
  const personasVentas = recortar(datos.personas_ventas, MAX_ETIQUETA);
  const gestionActual = recortar(datos.gestion_actual, MAX_ETIQUETA);
  const usaCrm = recortar(datos.usa_crm, MAX_ETIQUETA);
  const crmCual = recortar(datos.crm_cual, MAX_ETIQUETA);
  const necesidades = recortarLista(datos.necesidades, MAX_ETIQUETA);
  const modalidad = recortar(datos.modalidad, MAX_ETIQUETA);
  const interes = recortar(datos.interes, MAX_ETIQUETA);

  const detalles: string[] = [];
  if (empleados) detalles.push(`Empleados: ${empleados}`);
  if (personasVentas) detalles.push(`Personas en ventas: ${personasVentas}`);
  if (gestionActual) detalles.push(`Gestión actual: ${gestionActual}`);
  if (usaCrm) {
    detalles.push(`¿Usa otro CRM?: ${usaCrm}${crmCual ? ` (${crmCual})` : ""}`);
  }
  if (necesidades.length)
    detalles.push(`Necesidades: ${necesidades.join(", ")}`);
  if (modalidad) detalles.push(`Modalidad preferida: ${modalidad}`);
  if (interes) detalles.push(`Interés: ${interes}`);

  const partes = [
    problema,
    detalles.length ? detalles.map((d) => `- ${d}`).join("\n") : "",
  ].filter(Boolean);

  return partes.join("\n\n").slice(0, MAX_TEXTO);
};

const esCorreoValido = (correo: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

export async function GET(_peticion: Request, { params }: Contexto) {
  const { clave } = await params;
  const supabase = getServiceClient();

  const { data: formulario } = await supabase
    .from("public_forms")
    .select("organization_id, active, type")
    .eq("slug", clave)
    .maybeSingle();

  if (!formulario || !formulario.active) {
    return Response.json({ disponible: false }, { status: 404 });
  }

  const { data: fila } = await supabase
    .from("configuration")
    .select("config")
    .eq("organization_id", formulario.organization_id)
    .maybeSingle();

  const titulo =
    (fila?.config as { title?: string } | null)?.title?.trim() || "Vinqulia";

  return Response.json({
    disponible: true,
    titulo,
    tipo: formulario.type === "ticket" ? "ticket" : "lead",
  });
}

export async function POST(peticion: Request, { params }: Contexto) {
  const { clave } = await params;
  const supabase = getServiceClient();

  const { data: formulario } = await supabase
    .from("public_forms")
    .select("id, organization_id, active, type")
    .eq("slug", clave)
    .maybeSingle();

  if (!formulario || !formulario.active) {
    return Response.json(
      { message: "Este formulario no está disponible." },
      { status: 404 },
    );
  }

  const esTicket = formulario.type === "ticket";

  const cuerpo = await peticion.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") {
    return Response.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  // Campo señuelo: invisible para una persona, un bot lo suele rellenar. Se
  // responde 200 sin guardar nada, para no delatar que se le detectó.
  const senuelo = (cuerpo as Record<string, unknown>).sitio_web;
  if (typeof senuelo === "string" && senuelo.trim()) {
    return Response.json({ ok: true });
  }

  const datos = cuerpo as Record<string, unknown>;
  const nombreCompleto = recortar(datos.nombre, MAX_NOMBRE);
  const correo = recortar(datos.correo, MAX_NOMBRE);
  const telefono = recortar(datos.telefono, MAX_TELEFONO);
  const empresa = recortar(datos.empresa, MAX_NOMBRE);
  const mensaje = recortar(datos.mensaje, MAX_TEXTO);
  const asunto = recortar(datos.asunto, MAX_NOMBRE);
  const descripcion = recortar(datos.descripcion, MAX_TEXTO);

  if (!nombreCompleto) {
    return Response.json({ message: "Escribe tu nombre." }, { status: 400 });
  }
  if (!esCorreoValido(correo)) {
    return Response.json(
      { message: "Escribe un correo electrónico válido." },
      { status: 400 },
    );
  }
  if (esTicket && (!empresa || !asunto || !descripcion)) {
    return Response.json(
      { message: "Escribe la empresa, el asunto y la descripción." },
      { status: 400 },
    );
  }

  // Límite por formulario, no por visitante: protege el buzón de la
  // organización de una inundación de contactos falsos, sin depender de
  // memoria de proceso (cada invocación puede caer en una instancia distinta).
  const desde = new Date(Date.now() - VENTANA_MINUTOS * 60_000).toISOString();
  const { count: envíosRecientes } = await supabase
    .from("public_form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("public_form_id", formulario.id)
    .gte("created_at", desde);

  if ((envíosRecientes ?? 0) >= MAX_ENVIOS_POR_VENTANA) {
    return Response.json(
      { message: "Demasiados envíos. Inténtalo de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const [primerNombre, ...resto] = nombreCompleto.split(/\s+/);

  let companyId: number | undefined;
  if (empresa) {
    const { data: existente } = await supabase
      .from("companies")
      .select("id")
      .eq("organization_id", formulario.organization_id)
      .ilike("name", empresa)
      .maybeSingle();

    companyId = existente
      ? existente.id
      : (
          await supabase
            .from("companies")
            .insert({
              organization_id: formulario.organization_id,
              name: empresa,
              created_at: new Date().toISOString(),
            })
            .select("id")
            .single()
        ).data?.id;
  }

  // Un ticket exige empresa (validado arriba), así que a este punto companyId
  // siempre está resuelto en ese caso.
  if (esTicket && !companyId) {
    return Response.json(
      { message: "No se pudo registrar la empresa." },
      { status: 500 },
    );
  }

  const ahora = new Date().toISOString();

  // Los tickets reutilizan el contacto si ya escribió antes con el mismo
  // correo, para no duplicarlo en cada ticket nuevo que reporte la misma
  // persona. Los leads conservan el comportamiento de siempre: cada envío
  // crea su propio contacto.
  const contactoExistente = esTicket
    ? (
        await supabase
          .from("contacts")
          .select("id")
          .eq("organization_id", formulario.organization_id)
          .contains("email_jsonb", JSON.stringify([{ email: correo }]))
          .maybeSingle()
      ).data
    : null;

  const contacto =
    contactoExistente ??
    (
      await supabase
        .from("contacts")
        .insert({
          organization_id: formulario.organization_id,
          first_name: primerNombre,
          last_name: resto.join(" "),
          email_jsonb: [{ email: correo, type: "Work" }],
          phone_jsonb: telefono ? [{ number: telefono, type: "Work" }] : [],
          company_id: companyId,
          first_seen: ahora,
          last_seen: ahora,
        })
        .select("id")
        .single()
    ).data;

  if (!contacto) {
    return Response.json(
      { message: "No se pudo registrar el contacto." },
      { status: 500 },
    );
  }

  if (esTicket) {
    const { error: errorTicket } = await supabase.from("tickets").insert({
      organization_id: formulario.organization_id,
      subject: asunto,
      description: descripcion,
      status: "open",
      contact_id: contacto.id,
      company_id: companyId,
    });
    if (errorTicket) {
      return Response.json(
        { message: "No se pudo abrir el ticket." },
        { status: 500 },
      );
    }
  } else {
    const textoNota = mensaje || construirNotaDeCalificacion(datos);
    if (textoNota) {
      await supabase.from("contact_notes").insert({
        organization_id: formulario.organization_id,
        contact_id: contacto.id,
        text: textoNota,
        type: "web",
        date: ahora,
      });
    }
  }

  await supabase
    .from("contacts")
    .update({ last_seen: ahora })
    .eq("id", contacto.id);

  await supabase.from("public_form_submissions").insert({
    organization_id: formulario.organization_id,
    public_form_id: formulario.id,
  });

  return Response.json({ ok: true });
}

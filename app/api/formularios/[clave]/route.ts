import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Ruta pública de un formulario de captación: sin sesión, sin
 * `requireKontroliaPermission`, porque quien la usa nunca ha iniciado sesión
 * — es un visitante en la página web del cliente. La organización se
 * resuelve del slug con la clave de servicio; nunca se acepta del cliente.
 *
 * GET  → datos mínimos para pintar la página (título, si está disponible).
 * POST → crea el contacto (y, si escribió mensaje, una nota tipo "web").
 */

const MAX_NOMBRE = 200;
const MAX_TEXTO = 5000;
const MAX_TELEFONO = 50;
const MAX_ENVIOS_POR_VENTANA = 20;
const VENTANA_MINUTOS = 10;

type Contexto = { params: Promise<{ clave: string }> };

const recortar = (valor: unknown, limite: number): string =>
  typeof valor === "string" ? valor.trim().slice(0, limite) : "";

const esCorreoValido = (correo: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

export async function GET(_peticion: Request, { params }: Contexto) {
  const { clave } = await params;
  const supabase = getServiceClient();

  const { data: formulario } = await supabase
    .from("public_forms")
    .select("organization_id, active")
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

  return Response.json({ disponible: true, titulo });
}

export async function POST(peticion: Request, { params }: Contexto) {
  const { clave } = await params;
  const supabase = getServiceClient();

  const { data: formulario } = await supabase
    .from("public_forms")
    .select("id, organization_id, active")
    .eq("slug", clave)
    .maybeSingle();

  if (!formulario || !formulario.active) {
    return Response.json(
      { message: "Este formulario no está disponible." },
      { status: 404 },
    );
  }

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

  if (!nombreCompleto) {
    return Response.json({ message: "Escribe tu nombre." }, { status: 400 });
  }
  if (!esCorreoValido(correo)) {
    return Response.json(
      { message: "Escribe un correo electrónico válido." },
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

  const ahora = new Date().toISOString();
  const { data: contacto, error: errorContacto } = await supabase
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
    .single();

  if (errorContacto || !contacto) {
    return Response.json(
      { message: "No se pudo registrar el contacto." },
      { status: 500 },
    );
  }

  if (mensaje) {
    await supabase.from("contact_notes").insert({
      organization_id: formulario.organization_id,
      contact_id: contacto.id,
      text: mensaje,
      type: "web",
      date: ahora,
    });
  }

  await supabase.from("public_form_submissions").insert({
    organization_id: formulario.organization_id,
    public_form_id: formulario.id,
  });

  return Response.json({ ok: true });
}

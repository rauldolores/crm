import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Cambiar una conversación de la bandeja: su estado, si está leída, quién
 * la atiende y a qué contacto pertenece.
 *
 * Fuera del puente /api/datos (allí es de solo lectura) porque cada cambio
 * se comprueba: el responsable y el contacto tienen que ser de la misma
 * organización, cosa que una llave foránea no garantiza.
 *
 * Al enlazar un contacto, su dirección se agrega a la ficha si no la tenía
 * y las demás conversaciones «Sin contacto» de esa dirección se enlazan
 * también: el siguiente correo ya llegará con nombre. Y su empresa gana los
 * proyectos a los que esa persona escribió.
 */

type Contexto = { params: Promise<{ id: string }> };

const ESTADOS = ["pending", "answered", "closed"] as const;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

const esIdONulo = (valor: unknown): valor is number | null =>
  valor === null || (typeof valor === "number" && Number.isInteger(valor));

export async function PATCH(peticion: Request, { params }: Contexto) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  const conversacionId = Number((await params).id);
  if (!Number.isFinite(conversacionId)) {
    return esError(404, "Conversación no encontrada.");
  }

  const cuerpo = ((await peticion.json().catch(() => null)) ?? {}) as Record<
    string,
    unknown
  >;

  const db = getServiceClient();
  const { data: conversacion } = await db
    .from("conversations")
    .select("id, counterpart, sales_id, contact_id")
    .eq("id", conversacionId)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  if (!conversacion) return esError(404, "Conversación no encontrada.");

  const cambios: Record<string, unknown> = {};

  if ("status" in cuerpo) {
    if (!ESTADOS.includes(cuerpo.status as (typeof ESTADOS)[number])) {
      return esError(400, "Estado no válido.");
    }
    cambios.status = cuerpo.status;
  }

  if ("unread" in cuerpo) {
    if (typeof cuerpo.unread !== "boolean") {
      return esError(400, "Valor de «sin leer» no válido.");
    }
    cambios.unread = cuerpo.unread;
  }

  if ("salesId" in cuerpo) {
    if (!esIdONulo(cuerpo.salesId))
      return esError(400, "Responsable no válido.");
    if (cuerpo.salesId !== null) {
      const { data: comercial } = await db
        .from("sales")
        .select("id")
        .eq("id", cuerpo.salesId)
        .eq("organization_id", organizacionId)
        .maybeSingle();
      if (!comercial) return esError(400, "Responsable no encontrado.");
    }
    cambios.sales_id = cuerpo.salesId;
  }

  let contactoEnlazado: {
    id: number;
    email_jsonb: unknown;
    sales_id: number | null;
    company_id: number | null;
  } | null = null;
  if ("contactId" in cuerpo) {
    if (!esIdONulo(cuerpo.contactId))
      return esError(400, "Contacto no válido.");
    if (cuerpo.contactId !== null) {
      const { data: contacto } = await db
        .from("contacts")
        .select("id, email_jsonb, sales_id, company_id")
        .eq("id", cuerpo.contactId)
        .eq("organization_id", organizacionId)
        .maybeSingle();
      if (!contacto) return esError(400, "Contacto no encontrado.");
      contactoEnlazado = contacto as typeof contactoEnlazado;
      // Sin responsable todavía: pasa al del contacto.
      if (conversacion.sales_id == null && !("salesId" in cuerpo)) {
        cambios.sales_id = contactoEnlazado?.sales_id ?? null;
      }
    }
    cambios.contact_id = cuerpo.contactId;
  }

  if (!Object.keys(cambios).length) return esError(400, "Nada que cambiar.");

  const { data: actualizada, error } = await db
    .from("conversations")
    .update(cambios)
    .eq("id", conversacionId)
    .eq("organization_id", organizacionId)
    .select()
    .single();
  if (error) return esError(500, "No se pudo guardar el cambio.");

  if (contactoEnlazado) {
    const direccion = conversacion.counterpart as string;
    const correos = Array.isArray(contactoEnlazado.email_jsonb)
      ? (contactoEnlazado.email_jsonb as { email?: string }[])
      : [];
    if (!correos.some((c) => c.email?.toLowerCase() === direccion)) {
      await db
        .from("contacts")
        .update({
          email_jsonb: [...correos, { email: direccion, type: "Work" }],
        })
        .eq("id", contactoEnlazado.id)
        .eq("organization_id", organizacionId);
    }
    await db
      .from("conversations")
      .update({
        contact_id: contactoEnlazado.id,
        sales_id: actualizada.sales_id,
      })
      .eq("organization_id", organizacionId)
      .eq("counterpart", direccion)
      .is("contact_id", null);

    if (contactoEnlazado.company_id != null) {
      const [{ data: escritas }, { data: empresa }] = await Promise.all([
        db
          .from("conversations")
          .select("project")
          .eq("organization_id", organizacionId)
          .eq("contact_id", contactoEnlazado.id)
          .eq("automatic", false)
          .not("project", "is", null),
        db
          .from("companies")
          .select("projects")
          .eq("id", contactoEnlazado.company_id)
          .eq("organization_id", organizacionId)
          .maybeSingle(),
      ]);
      const actuales = (empresa?.projects as string[] | null) ?? [];
      const nuevos = [
        ...new Set((escritas ?? []).map((c) => c.project as string)),
      ].filter((proyecto) => !actuales.includes(proyecto));
      if (empresa && nuevos.length) {
        await db
          .from("companies")
          .update({ projects: [...actuales, ...nuevos] })
          .eq("id", contactoEnlazado.company_id)
          .eq("organization_id", organizacionId);
      }
    }
  }

  return Response.json(actualizada);
}

import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import {
  repartir,
  type OportunidadParaRepartir,
} from "@/lib/server/reparto/repartir";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Reparte las oportunidades de una etapa entre varios comerciales, por
 * turnos. Con cada oportunidad pasan al mismo responsable su contacto, su
 * empresa y las tareas abiertas de ese contacto (ver lib/server/reparto).
 *
 * El lote se elige por embudo y etapa, igual que en /api/acciones-masivas: con
 * miles de tarjetas nadie las marca a mano. `deResponsable` lo acota a las que
 * hoy son de alguien concreto, para repartir un lote nuevo sin barajar de
 * nuevo lo que ya estaba repartido.
 *
 * Solo un administrador: decide la cartera de todo el equipo.
 */

/** Tope por reparto. Más que esto es casi siempre un filtro mal puesto. */
const MAXIMO_POR_REPARTO = 10_000;
/** Ids por UPDATE: la lista viaja en la URL de PostgREST. */
const POR_TANDA = 300;

const idsValidos = (valor: unknown): number[] =>
  Array.isArray(valor)
    ? [...new Set(valor.map(Number).filter(Number.isInteger))]
    : [];

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId, usuarioId } = auth.sesion;

  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return Response.json(
      { message: "Solo un administrador puede repartir oportunidades." },
      { status: 403 },
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    embudo?: unknown;
    etapa?: unknown;
    deResponsable?: unknown;
    responsables?: unknown;
  } | null;

  const embudo = typeof cuerpo?.embudo === "string" ? cuerpo.embudo : "";
  const etapa = typeof cuerpo?.etapa === "string" ? cuerpo.etapa : "";
  const deResponsable =
    cuerpo?.deResponsable == null ? null : Number(cuerpo.deResponsable);
  const responsables = idsValidos(cuerpo?.responsables);

  if (!embudo || !etapa || responsables.length === 0) {
    return Response.json(
      { message: "Faltan el embudo, la etapa o a quién repartir." },
      { status: 400 },
    );
  }
  if (deResponsable != null && !Number.isInteger(deResponsable)) {
    return Response.json(
      { message: "El responsable actual no es válido." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  // Todos tienen que ser comerciales activos de esta organización: la clave
  // de servicio salta el RLS y aceptaría cualquier id.
  const { data: comerciales } = await supabase
    .from("sales")
    .select("id")
    .eq("organization_id", organizacionId)
    .eq("disabled", false)
    .in("id", responsables);
  if ((comerciales ?? []).length !== responsables.length) {
    return Response.json(
      { message: "Alguno de los responsables no existe o está desactivado." },
      { status: 400 },
    );
  }

  let consulta = supabase
    .from("deals")
    .select("id, company_id, contact_ids")
    .eq("organization_id", organizacionId)
    .eq("pipeline", embudo)
    .eq("stage", etapa)
    .is("archived_at", null);
  if (deResponsable != null) consulta = consulta.eq("sales_id", deResponsable);
  const { data: oportunidades, error: errorOportunidades } = await consulta
    .order("id")
    .limit(MAXIMO_POR_REPARTO);
  if (errorOportunidades) {
    return Response.json(
      { message: "No se pudieron leer las oportunidades." },
      { status: 502 },
    );
  }

  const reparto = repartir(
    (oportunidades ?? []) as OportunidadParaRepartir[],
    responsables,
  );

  const asignar = async (
    tabla: "deals" | "contacts" | "companies" | "tasks",
    columna: "id" | "contact_id",
    ids: number[],
    salesId: number,
  ) => {
    for (let i = 0; i < ids.length; i += POR_TANDA) {
      let cambio = supabase
        .from(tabla)
        .update({ sales_id: salesId })
        .eq("organization_id", organizacionId)
        .in(columna, ids.slice(i, i + POR_TANDA));
      // Solo las tareas abiertas: las hechas son historia de quien las hizo.
      if (tabla === "tasks") cambio = cambio.is("done_date", null);
      const { error } = await cambio;
      if (error) throw error;
    }
  };

  const porResponsable: Record<number, number> = {};
  try {
    for (const [salesId, asignacion] of reparto) {
      await asignar("deals", "id", asignacion.oportunidades, salesId);
      await asignar("contacts", "id", asignacion.contactos, salesId);
      await asignar("companies", "id", asignacion.empresas, salesId);
      await asignar("tasks", "contact_id", asignacion.contactos, salesId);
      porResponsable[salesId] = asignacion.oportunidades.length;
    }
  } catch {
    // Lo ya escrito se queda. Sin «deResponsable», repetir el reparto da el
    // mismo resultado; con él, reparte lo que faltó. En los dos casos,
    // relanzarlo termina el trabajo.
    return Response.json(
      {
        message:
          "El reparto se quedó a medias. Vuelve a lanzarlo para terminarlo.",
        por_responsable: porResponsable,
      },
      { status: 502 },
    );
  }

  return Response.json({
    total: oportunidades?.length ?? 0,
    por_responsable: porResponsable,
  });
}

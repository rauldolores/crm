import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Fusiona dos contactos: notas, tareas, oportunidades, tickets, cotizaciones,
 * correos en cola y afiliado del perdedor pasan al ganador, los datos de
 * contacto se combinan y el perdedor se elimina (crm.merge_contacts).
 *
 * Antes la aplicación invocaba una edge function que nunca se desplegó en
 * esta instalación y que además hablaba con el esquema antiguo, así que
 * fusionar fallaba en producción. Misma forma que /api/tickets/fusionar: la
 * función SQL no comprueba tenencia (la clave de servicio salta el RLS),
 * así que aquí se exige que ambos contactos sean de la organización de la
 * sesión.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(
    peticion,
    "crm.contactos.fusionar",
  );
  if (!auth.ok) return auth.response;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    loserId?: number;
    winnerId?: number;
  } | null;
  const perdedor = Number(cuerpo?.loserId);
  const ganador = Number(cuerpo?.winnerId);
  if (!perdedor || !ganador || perdedor === ganador) {
    return Response.json(
      { message: "Hacen falta dos contactos distintos." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const { organizacionId } = auth.sesion;

  const { data: contactos } = await supabase
    .from("contacts")
    .select("id, organization_id")
    .in("id", [perdedor, ganador]);
  const propios = (contactos ?? []).filter(
    (c) => c.organization_id === organizacionId,
  );
  if (propios.length !== 2) {
    return Response.json(
      { message: "Contacto no encontrado." },
      { status: 404 },
    );
  }

  const { error } = await supabase.rpc("merge_contacts", {
    loser_id: perdedor,
    winner_id: ganador,
  });
  if (error) {
    return Response.json(
      { message: "No se pudieron fusionar los contactos." },
      { status: 500 },
    );
  }
  return Response.json({ ok: true, winnerId: ganador });
}

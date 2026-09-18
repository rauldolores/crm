import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Fusiona dos tickets del mismo contacto: las notas y el historial del
 * perdedor pasan al ganador y el perdedor se cierra como duplicado
 * (crm.merge_tickets). La función ya comprueba que ambos existen y son de
 * la misma organización; aquí se comprueba además que esa organización es
 * la de la sesión, porque la clave de servicio salta el RLS.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    loserId?: number;
    winnerId?: number;
  } | null;
  const perdedor = Number(cuerpo?.loserId);
  const ganador = Number(cuerpo?.winnerId);
  if (!perdedor || !ganador || perdedor === ganador) {
    return Response.json(
      { message: "Hacen falta dos tickets distintos." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const { organizacionId, usuarioId } = auth.sesion;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, organization_id, contact_id")
    .in("id", [perdedor, ganador]);
  const propios = (tickets ?? []).filter(
    (t) => t.organization_id === organizacionId,
  );
  if (propios.length !== 2) {
    return Response.json({ message: "Ticket no encontrado." }, { status: 404 });
  }
  if (propios[0].contact_id !== propios[1].contact_id) {
    return Response.json(
      { message: "Solo se pueden fusionar tickets del mismo contacto." },
      { status: 400 },
    );
  }

  const { data: comercial } = await supabase
    .from("sales")
    .select("id")
    .eq("user_id", usuarioId)
    .eq("organization_id", organizacionId)
    .maybeSingle();

  const { error } = await supabase.rpc("merge_tickets", {
    perdedor,
    ganador,
    actor: comercial?.id ?? null,
  });
  if (error) {
    return Response.json(
      { message: "No se pudieron fusionar los tickets." },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}

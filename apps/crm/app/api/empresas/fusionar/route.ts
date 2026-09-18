import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Fusiona dos empresas: contactos, oportunidades, tickets, cotizaciones,
 * contratos, compras y facturas de la perdedora pasan a la ganadora, la
 * ficha se combina y la perdedora se elimina (crm.merge_companies). Misma
 * forma que /api/contactos/fusionar: la función SQL corre con la clave de
 * servicio (salta el RLS), así que aquí se exige que ambas empresas sean de
 * la organización de la sesión.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    loserId?: number;
    winnerId?: number;
  } | null;
  const perdedora = Number(cuerpo?.loserId);
  const ganadora = Number(cuerpo?.winnerId);
  if (!perdedora || !ganadora || perdedora === ganadora) {
    return Response.json(
      { message: "Hacen falta dos empresas distintas." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const { organizacionId } = auth.sesion;

  const { data: empresas } = await supabase
    .from("companies")
    .select("id, organization_id")
    .in("id", [perdedora, ganadora]);
  const propias = (empresas ?? []).filter(
    (e) => e.organization_id === organizacionId,
  );
  if (propias.length !== 2) {
    return Response.json(
      { message: "Empresa no encontrada." },
      { status: 404 },
    );
  }

  const { error } = await supabase.rpc("merge_companies", {
    loser_id: perdedora,
    winner_id: ganadora,
  });
  if (error) {
    return Response.json(
      { message: "No se pudieron fusionar las empresas." },
      { status: 500 },
    );
  }
  return Response.json({ ok: true, winnerId: ganadora });
}

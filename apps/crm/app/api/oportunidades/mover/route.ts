import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Mueve una oportunidad en el tablero: a otra etapa, a otra posición de la
 * misma, o ambas. La base desplaza las demás tarjetas en una transacción
 * (crm.move_deal); antes el navegador mandaba un PATCH por tarjeta.
 *
 * `index` es la posición final (0 = arriba); si se pasa de largo, queda al
 * final. `lossReason` se guarda al mover a una etapa de pérdida. La función
 * SQL no comprueba tenencia (la clave de servicio salta el RLS), así que
 * aquí se exige que la oportunidad sea de la organización de la sesión.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    dealId?: number;
    stage?: string;
    index?: number;
    lossReason?: string | null;
  } | null;
  const dealId = Number(cuerpo?.dealId);
  const etapa = typeof cuerpo?.stage === "string" ? cuerpo.stage.trim() : "";
  const indice = Number.isInteger(cuerpo?.index) ? Number(cuerpo?.index) : null;
  if (!dealId || !etapa) {
    return Response.json(
      { message: "Hacen falta la oportunidad y la etapa de destino." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const { organizacionId, usuarioId } = auth.sesion;

  const { data: oportunidad } = await supabase
    .from("deals")
    .select("id, organization_id")
    .eq("id", dealId)
    .maybeSingle();
  if (!oportunidad || oportunidad.organization_id !== organizacionId) {
    return Response.json(
      { message: "Oportunidad no encontrada." },
      { status: 404 },
    );
  }

  const { error } = await supabase.rpc("move_deal", {
    p_deal_id: dealId,
    p_stage: etapa,
    p_index: indice,
    p_loss_reason: cuerpo?.lossReason || null,
    p_actor: await comercialDeLaSesion(organizacionId, usuarioId),
  });
  if (error) {
    return Response.json(
      { message: "No se pudo mover la oportunidad." },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}

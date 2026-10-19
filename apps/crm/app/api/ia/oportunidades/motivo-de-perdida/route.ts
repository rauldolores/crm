import type { Opcion } from "@/lib/server/deals/motivoDePerdida";
import { sugerirMotivoDePerdida } from "@/lib/server/deals/motivoDePerdida";
import { hayClasificador } from "@/lib/server/ia/clasificador";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Motivo de pérdida propuesto para una oportunidad, a partir de sus notas y
 * de la lista de motivos que la organización configuró en Ajustes.
 *
 * Se llama al abrir el diálogo que pregunta «¿por qué se perdió?», para que
 * llegue con una opción puesta en vez de vacío. Quien mueve la tarjeta
 * confirma o la cambia; el campo nunca se guarda solo.
 *
 * El cómo vive en `lib/server/deals/motivoDePerdida`.
 */

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  // Solo el modelo de decisión: elegir de una lista cerrada es su trabajo, y
  // aquí hay alguien esperando con una tarjeta en la mano.
  if (!hayClasificador()) {
    return Response.json({ loss_reason: null, confianza: null });
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    dealId?: number;
  } | null;
  const dealId = Number(cuerpo?.dealId);
  if (!dealId) return esError(400, "Falta la oportunidad.");

  const { data: configuracion } = await getServiceClient()
    .from("configuration")
    .select("config")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const config = (configuracion?.config ?? {}) as {
    dealLossReasons?: Opcion[];
  };
  const motivos = Array.isArray(config.dealLossReasons)
    ? config.dealLossReasons
    : [];

  return Response.json(
    await sugerirMotivoDePerdida(organizacionId, dealId, motivos),
  );
}

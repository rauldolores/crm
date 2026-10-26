import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Avance de una acción masiva.
 *
 * Se cuenta sobre la propia cola de correo, agrupando por `bulk_job_id`: el
 * estado de cada envío ya vive ahí (sent_at, attempts, last_error), y
 * copiarlo a una tabla de renglones daría dos verdades que se
 * desincronizarían a la primera.
 *
 * Es de solo lectura y se puede consultar cuando sea: cerrar el diálogo no
 * cancela nada, y mañana se puede volver a mirar qué pasó.
 */

type Contexto = { params: Promise<{ id: string }> };

/** Los intentos de cada correo de la cola (email_outbox.max_attempts). */
const MAXIMO_DE_INTENTOS = 5;

export async function GET(peticion: Request, { params }: Contexto) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  const { id } = await params;
  const encargoId = Number(id);
  if (!Number.isFinite(encargoId)) {
    return Response.json({ message: "Acción no encontrada." }, { status: 404 });
  }

  const supabase = getServiceClient();

  const { data: encargo } = await supabase
    .from("bulk_jobs")
    .select(
      "id, resource, action_type, action_params, target, requested, enqueued, skipped_reasons, created_at",
    )
    .eq("id", encargoId)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  if (!encargo) {
    return Response.json({ message: "Acción no encontrada." }, { status: 404 });
  }

  // Se cuenta en la base y no trayendo las filas: un envío de miles pasaría
  // del tope de filas por respuesta y el avance saldría corto.
  const contar = () =>
    supabase
      .from("email_outbox")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizacionId)
      .eq("bulk_job_id", encargoId);

  const [total, enviados, cancelados, fallidos, conError] = await Promise.all([
    contar(),
    contar().not("sent_at", "is", null),
    // Cancelado = ya no debe salir (baja, dirección repetida, el contacto
    // contestó). No es un fallo: es la protección funcionando.
    contar().not("cancelled_at", "is", null),
    // Fallido = se acabaron los intentos. Mientras le queden, está pendiente
    // aunque haya fallado una vez: el despachador reintenta.
    contar()
      .is("sent_at", null)
      .is("cancelled_at", null)
      .gte("attempts", MAXIMO_DE_INTENTOS),
    supabase
      .from("email_outbox")
      .select("last_error")
      .eq("organization_id", organizacionId)
      .eq("bulk_job_id", encargoId)
      .is("sent_at", null)
      .is("cancelled_at", null)
      .not("last_error", "is", null)
      .limit(1),
  ]);

  const cuantos = total.count ?? 0;
  const hechos =
    (enviados.count ?? 0) + (cancelados.count ?? 0) + (fallidos.count ?? 0);

  return Response.json({
    ...encargo,
    enviados: enviados.count ?? 0,
    cancelados: cancelados.count ?? 0,
    fallidos: fallidos.count ?? 0,
    pendientes: cuantos - hechos,
    ultimo_error: conError.data?.[0]?.last_error ?? null,
    // Termina cuando no queda ninguno esperando turno.
    terminado: cuantos > 0 && cuantos === hechos,
  });
}

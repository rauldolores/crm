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

  const { data: correos } = await supabase
    .from("email_outbox")
    .select("sent_at, attempts, max_attempts, last_error")
    .eq("organization_id", organizacionId)
    .eq("bulk_job_id", encargoId);

  const filas = correos ?? [];
  const enviados = filas.filter((fila) => fila.sent_at != null).length;
  // Fallido = se acabaron los intentos. Mientras le queden, está pendiente
  // aunque haya fallado una vez: el despachador reintenta.
  const fallidos = filas.filter(
    (fila) =>
      fila.sent_at == null &&
      (fila.attempts as number) >= (fila.max_attempts as number),
  ).length;
  const ultimoError =
    filas.find((fila) => fila.sent_at == null && fila.last_error)?.last_error ??
    null;

  return Response.json({
    ...encargo,
    enviados,
    fallidos,
    pendientes: filas.length - enviados - fallidos,
    ultimo_error: ultimoError,
    // Termina cuando no queda ninguno esperando turno.
    terminado: filas.length > 0 && filas.length === enviados + fallidos,
  });
}

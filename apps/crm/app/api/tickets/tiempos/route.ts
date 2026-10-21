import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { registrarTiempo } from "@/lib/server/soporte/tiempos";
import { getServiceClient } from "@/lib/server/supabase-service";
import { primerError, registroDeTiempoSchema } from "@/lib/soporteTiempos";

/**
 * Registra tiempo de soporte en un ticket (crm.soporte_tiempos). Quien
 * registra queda como quien atendió. La organización va explícita porque la
 * clave de servicio salta el RLS: el disparador de la base la compara con la
 * del ticket y rechaza el alta si no coinciden.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const validacion = registroDeTiempoSchema.safeParse(
    await peticion.json().catch(() => null),
  );
  if (!validacion.success) {
    return Response.json(
      { message: primerError(validacion.error) },
      { status: 400 },
    );
  }

  const { organizacionId, usuarioId } = auth.sesion;
  const resultado = await registrarTiempo(
    getServiceClient(),
    organizacionId,
    await comercialDeLaSesion(organizacionId, usuarioId),
    validacion.data,
  );
  return resultado.ok
    ? Response.json({ ids: resultado.ids })
    : Response.json(
        { message: resultado.mensaje },
        { status: resultado.estado },
      );
}

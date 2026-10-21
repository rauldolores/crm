import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { corregirTiempo } from "@/lib/server/soporte/tiempos";
import { getServiceClient } from "@/lib/server/supabase-service";
import { correccionDeTiempoSchema, primerError } from "@/lib/soporteTiempos";

/**
 * Corrige un registro de tiempo: lo anula con uno en contra y, si se indica,
 * guarda la cifra buena como registro nuevo. Nada se edita ni se borra.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const validacion = correccionDeTiempoSchema.safeParse(
    await peticion.json().catch(() => null),
  );
  if (!validacion.success) {
    return Response.json(
      { message: primerError(validacion.error) },
      { status: 400 },
    );
  }

  const { organizacionId, usuarioId } = auth.sesion;
  const resultado = await corregirTiempo(
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

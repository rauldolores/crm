import { afiliadoDeLaSesion } from "@/lib/server/afiliadoDeLaSesion";
import {
  asignarAfiliado,
  idONulo,
} from "@/lib/server/afiliados/asignarAfiliado";
import { autenticarPuente } from "@/lib/server/autenticarPuente";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Atribuye un cliente a un afiliado porque llegó con su enlace de referido
 * (`?ref=<codigo>`). Pensada para las integraciones del ecosistema —el
 * diagnóstico de Kontrolia, y después el alta de cada solución— así que
 * acepta clave de API además de sesión.
 *
 * Gana el primer toque: si la empresa ya tenía otro afiliado no cambia nada
 * y queda constancia del intento (resultado "rechazada").
 *
 * Cuerpo: { companyId, referralCode, application? }.
 */
export async function POST(peticion: Request) {
  const auth = await autenticarPuente(peticion);
  if (!auth.ok) return auth.response;
  const { organizacionId, usuarioId } = auth;

  // Un afiliado no se atribuye clientes a sí mismo: con su propio código
  // podría reclamar cualquier empresa sin afiliado de la organización.
  if ((await afiliadoDeLaSesion(organizacionId, usuarioId)) != null) {
    return Response.json(
      { message: "Un afiliado no puede atribuir clientes." },
      { status: 403 },
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    companyId?: unknown;
    referralCode?: unknown;
    application?: unknown;
  } | null;

  const empresaId = idONulo(cuerpo?.companyId);
  const codigo =
    typeof cuerpo?.referralCode === "string" ? cuerpo.referralCode.trim() : "";
  if (!empresaId || !codigo) {
    return Response.json(
      { message: "Hacen falta la empresa y el código de referido." },
      { status: 400 },
    );
  }

  const { data: afiliado } = await getServiceClient()
    .from("affiliates")
    .select("id")
    .eq("organization_id", organizacionId)
    .eq("referral_code", codigo)
    .eq("active", true)
    .maybeSingle();
  if (!afiliado) {
    return Response.json(
      { message: "Código de referido desconocido o inactivo." },
      { status: 404 },
    );
  }

  const respuesta = await asignarAfiliado({
    organizacionId,
    empresaId,
    afiliadoId: Number(afiliado.id),
    origen: "enlace",
    aplicacion:
      typeof cuerpo?.application === "string"
        ? cuerpo.application.slice(0, 40)
        : null,
  });

  if (!respuesta.ok) {
    return Response.json(
      { message: respuesta.mensaje },
      { status: respuesta.estado },
    );
  }
  return Response.json({
    resultado: respuesta.resultado,
    affiliateId: afiliado.id,
  });
}

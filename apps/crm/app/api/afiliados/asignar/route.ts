import {
  asignarAfiliado,
  idONulo,
} from "@/lib/server/afiliados/asignarAfiliado";
import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";

/**
 * Liga a mano un cliente (empresa) a un afiliado, lo cambia de afiliado o se
 * lo quita. Sólo un administrador: decide a quién le toca la comisión.
 *
 * Cuerpo: { companyId, affiliateId | null, reason? }. El motivo es
 * obligatorio cuando la empresa ya tenía otro afiliado; la base lo exige
 * (crm.asignar_afiliado) y aquí sólo se reenvía su error.
 *
 * Sólo sesión, nunca clave de API: una integración liga por enlace de
 * referido (/api/afiliados/atribuir), donde gana el primer toque.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId, usuarioId } = auth.sesion;

  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return Response.json(
      { message: "Solo un administrador puede ligar clientes a afiliados." },
      { status: 403 },
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    companyId?: unknown;
    affiliateId?: unknown;
    reason?: unknown;
  } | null;

  const empresaId = idONulo(cuerpo?.companyId);
  const afiliadoId = idONulo(cuerpo?.affiliateId ?? null);
  if (!empresaId || afiliadoId === undefined) {
    return Response.json(
      {
        message: "Hacen falta la empresa y el afiliado (o null para quitarlo).",
      },
      { status: 400 },
    );
  }

  const respuesta = await asignarAfiliado({
    organizacionId,
    empresaId,
    afiliadoId,
    origen: "manual",
    actorId: await comercialDeLaSesion(organizacionId, usuarioId),
    motivo: typeof cuerpo?.reason === "string" ? cuerpo.reason : null,
  });

  if (!respuesta.ok) {
    return Response.json(
      { message: respuesta.mensaje },
      { status: respuesta.estado },
    );
  }
  return Response.json({ resultado: respuesta.resultado });
}

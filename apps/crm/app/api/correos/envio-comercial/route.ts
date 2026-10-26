import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import { estadoDelCupo } from "@/lib/server/correo/cupo";

/**
 * Ajustes del correo comercial (automatizaciones y envíos masivos): el
 * máximo de correos en 24 horas y el calentamiento. Viven en email_settings,
 * junto al servidor de envío, y como él solo los toca un administrador.
 *
 * GET también cuenta lo enviado en las últimas 24 horas y las bajas, para
 * que la pantalla diga cómo va el día.
 */

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

async function exigirAdministrador(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return { respuesta: auth.response } as const;
  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return {
      respuesta: esError(
        403,
        "Solo un administrador puede ver o cambiar el envío de correo.",
      ),
    } as const;
  }
  return { organizacionId } as const;
}

export async function GET(peticion: Request) {
  const acceso = await exigirAdministrador(peticion);
  if ("respuesta" in acceso) return acceso.respuesta;
  const { organizacionId } = acceso;

  const [cupo, { count: bajas }, { data: configurado }] = await Promise.all([
    estadoDelCupo(organizacionId, new Date()),
    getServiceClient()
      .from("email_suppressions")
      .select("email", { count: "exact", head: true })
      .eq("organization_id", organizacionId),
    getServiceClient()
      .from("email_settings")
      .select("organization_id")
      .eq("organization_id", organizacionId)
      .maybeSingle(),
  ]);

  return Response.json({
    limiteDiario: cupo.ajustes.limiteDiario,
    calentamiento: cupo.ajustes.calentamiento,
    limiteDeHoy: cupo.limite,
    enviados: cupo.enviados,
    bajas: bajas ?? 0,
    // Sin servidor propio no hay fila donde guardar estos ajustes.
    editable: Boolean(configurado),
  });
}

export async function PUT(peticion: Request) {
  const acceso = await exigirAdministrador(peticion);
  if ("respuesta" in acceso) return acceso.respuesta;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    limiteDiario?: unknown;
    calentamiento?: unknown;
  } | null;
  const limiteDiario = Number(cuerpo?.limiteDiario);
  if (
    !Number.isInteger(limiteDiario) ||
    limiteDiario < 1 ||
    limiteDiario > 100_000
  ) {
    return esError(400, "El máximo diario tiene que ser entre 1 y 100,000.");
  }
  if (typeof cuerpo?.calentamiento !== "boolean") {
    return esError(400, "Falta decir si se calienta el dominio.");
  }

  const { data, error } = await getServiceClient()
    .from("email_settings")
    .update({
      daily_limit: limiteDiario,
      warmup: cuerpo.calentamiento,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", acceso.organizacionId)
    .select("organization_id");
  if (error) return esError(500, "No se pudieron guardar los ajustes.");
  if (!data?.length) {
    return esError(
      409,
      "Configura primero el servidor de envío; estos ajustes se guardan con él.",
    );
  }
  return Response.json({ ok: true });
}

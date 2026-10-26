import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import { leerColaDeMiDia } from "@/lib/server/miDia/cola";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";

/**
 * La cola de «Mi día» de quien tiene la sesión: sus tareas que vencen hasta
 * hoy y los prospectos nuevos del embudo elegido.
 *
 * `desde` y `hasta` son el inicio y el fin del día en la zona del navegador:
 * el servidor no sabe en qué zona trabaja cada quien.
 */

const CUOTA_POR_DEFECTO = 20;
const CUOTA_MAXIMA = 200;

const esFecha = (valor: string | null): valor is string =>
  Boolean(valor) && !Number.isNaN(new Date(valor!).getTime());

export async function GET(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId, usuarioId } = auth.sesion;

  const comercialId = await comercialDeLaSesion(organizacionId, usuarioId);
  if (!comercialId) {
    return Response.json(
      {
        message: "Tu usuario no tiene ficha de comercial en esta organización.",
      },
      { status: 403 },
    );
  }

  const parametros = new URL(peticion.url).searchParams;
  const desde = parametros.get("desde");
  const hasta = parametros.get("hasta");
  if (!esFecha(desde) || !esFecha(hasta)) {
    return Response.json(
      { message: "Faltan el inicio y el fin del día." },
      { status: 400 },
    );
  }
  const cuotaPedida = Number(parametros.get("cuota") ?? CUOTA_POR_DEFECTO);
  const cuota = Number.isInteger(cuotaPedida)
    ? Math.min(Math.max(cuotaPedida, 0), CUOTA_MAXIMA)
    : CUOTA_POR_DEFECTO;

  return Response.json(
    await leerColaDeMiDia({
      organizacionId,
      comercialId,
      embudo: parametros.get("embudo"),
      cuota,
      desde,
      hasta,
    }),
  );
}

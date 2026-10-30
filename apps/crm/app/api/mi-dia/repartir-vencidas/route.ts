import { comercialDeLaSesion } from "@/lib/server/comercialDeLaSesion";
import {
  ErrorDeResultado,
  repartirVencidas,
} from "@/lib/server/miDia/resultado";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";

/**
 * Reparte las tareas vencidas de quien tiene la sesión en el embudo que está
 * viendo en los próximos días hábiles, `porDia` en cada uno. Las fechas las calcula el navegador, que es
 * quien sabe en qué zona y a qué hora trabaja.
 */

const MAXIMO_DE_FECHAS = 60;
const MAXIMO_POR_DIA = 200;

export async function POST(peticion: Request) {
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

  const cuerpo = (await peticion.json().catch(() => null)) as {
    antesDe?: unknown;
    embudo?: unknown;
    fechas?: unknown;
    porDia?: unknown;
  } | null;
  const esFecha = (valor: unknown): valor is string =>
    typeof valor === "string" && !Number.isNaN(new Date(valor).getTime());
  const fechas = Array.isArray(cuerpo?.fechas) ? cuerpo.fechas : [];
  const porDia = Number(cuerpo?.porDia);
  if (
    !esFecha(cuerpo?.antesDe) ||
    fechas.length === 0 ||
    fechas.length > MAXIMO_DE_FECHAS ||
    !fechas.every(esFecha) ||
    !Number.isInteger(porDia) ||
    porDia < 1 ||
    porDia > MAXIMO_POR_DIA
  ) {
    return Response.json(
      { message: "Faltan las fechas o cuántas tareas van por día." },
      { status: 400 },
    );
  }

  try {
    const reprogramadas = await repartirVencidas(
      organizacionId,
      comercialId,
      typeof cuerpo?.embudo === "string" && cuerpo.embudo
        ? cuerpo.embudo
        : null,
      cuerpo!.antesDe as string,
      fechas as string[],
      porDia,
    );
    return Response.json({ reprogramadas });
  } catch (error) {
    if (error instanceof ErrorDeResultado) {
      return Response.json(
        { message: error.message },
        { status: error.estado },
      );
    }
    throw error;
  }
}

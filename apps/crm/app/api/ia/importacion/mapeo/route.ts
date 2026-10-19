import { sugerirMapeo } from "@/lib/server/importacion/mapeoDeColumnas";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";

/**
 * A qué columna del CRM corresponde cada cabecera del CSV que alguien acaba
 * de elegir para importar contactos.
 *
 * Solo viajan los nombres de las columnas y, como mucho, el primer valor de
 * cada una: el archivo entero se queda en el navegador, que es donde se
 * procesa la importación. Devuelve una propuesta; quien importa la confirma.
 */

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    cabeceras?: unknown;
    muestra?: unknown;
  } | null;

  const cabeceras = Array.isArray(cuerpo?.cabeceras)
    ? cuerpo.cabeceras.filter((c): c is string => typeof c === "string")
    : [];
  if (!cabeceras.length)
    return esError(400, "Faltan las columnas del archivo.");

  const muestra =
    cuerpo?.muestra && typeof cuerpo.muestra === "object"
      ? Object.fromEntries(
          Object.entries(cuerpo.muestra as Record<string, unknown>)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => [k, v as string]),
        )
      : {};

  return Response.json({
    columnas: await sugerirMapeo(organizacionId, cabeceras, muestra),
  });
}

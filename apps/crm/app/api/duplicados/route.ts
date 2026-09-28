import { z } from "zod";

import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { juzgarDuplicados } from "@/lib/server/duplicados/juicio";

/**
 * Veredicto sobre unos posibles duplicados: devuelve, por cada candidato que
 * le pasa el formulario, la probabilidad de que sea el mismo contacto (o la
 * misma empresa) que se está capturando.
 *
 * El mapa vacío es una respuesta legítima y frecuente: significa «no puedo
 * opinar» (no hay modelo de decisión configurado, o falló), y quien pregunta
 * se queda con su lista de parecidos tal cual.
 */

const MAX_TEXTO = 200;

const Cuerpo = z.object({
  recurso: z.enum(["contacts", "companies"]),
  nuevo: z.record(
    z.string().max(40),
    z.union([
      z.string().max(MAX_TEXTO),
      z.array(z.string().max(MAX_TEXTO)).max(5),
    ]),
  ),
  candidatos: z.array(z.number().int().positive()).min(1).max(5),
});

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }

  const { recurso, nuevo, candidatos } = cuerpo.data;
  const veredicto = await juzgarDuplicados(
    auth.sesion.organizacionId,
    recurso,
    nuevo,
    candidatos,
  );

  return Response.json({ veredicto });
}

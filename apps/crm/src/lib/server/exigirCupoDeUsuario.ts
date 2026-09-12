import { comercialDeLaSesion } from "./comercialDeLaSesion";
import {
  exigirCupo,
  LIMITE_USUARIOS,
  limitesConfigurados,
} from "./kontrolia-auth/consumo";

/**
 * Cierra el cupo de usuarios del plan también por detrás de la interfaz.
 *
 * Una persona entra al CRM con su ficha de comercial, que se crea la primera
 * vez (/api/crm/aprovisionar) y solo si el plan tiene cupo. Pero quien no
 * consiguió ficha sigue teniendo un token válido de KontrolIA Auth, y con
 * él podría hablar con el puente, las rutas /api o el MCP como si nada. Aquí
 * se le cierra la puerta: sin ficha y sin cupo, 402 en todas partes.
 *
 * Con ficha no se pregunta nada (y `comercialDeLaSesion` la cachea): la
 * comprobación cuesta una consulta a KontrolIA solo en el caso raro de un
 * usuario sin ficha, que es o bien uno bloqueado o bien uno que está
 * entrando por primera vez y cuyo aprovisionamiento va en camino.
 */
export async function exigirCupoDeUsuario(
  organizacionId: string,
  usuarioId: string | null,
): Promise<Response | null> {
  if (!limitesConfigurados() || !usuarioId) return null;
  const ficha = await comercialDeLaSesion(organizacionId, usuarioId);
  if (ficha != null) return null;
  return exigirCupo(organizacionId, LIMITE_USUARIOS);
}

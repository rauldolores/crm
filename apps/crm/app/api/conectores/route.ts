import { conectoresDe } from "@/lib/server/conectores/almacen";
import {
  responderError,
  sesionDeConectores,
} from "@/lib/server/conectores/rutas";

/** Los conectores de la organización, sin secretos. */
export async function GET(peticion: Request) {
  const auth = await sesionDeConectores(peticion, { admin: false });
  if (!auth.ok) return auth.response;
  try {
    return Response.json({
      conectores: await conectoresDe(auth.sesion.organizacionId),
    });
  } catch (error) {
    return responderError(error);
  }
}

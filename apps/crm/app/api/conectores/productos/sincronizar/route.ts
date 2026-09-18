import { sincronizarProductos } from "@/lib/server/conectores/productos";
import {
  responderError,
  sesionDeConectores,
} from "@/lib/server/conectores/rutas";

/** Trae el catálogo del proveedor otra vez. Cualquiera del equipo puede. */
export async function POST(peticion: Request) {
  const auth = await sesionDeConectores(peticion, { admin: false });
  if (!auth.ok) return auth.response;
  try {
    return Response.json(
      await sincronizarProductos(auth.sesion.organizacionId),
    );
  } catch (error) {
    return responderError(error);
  }
}

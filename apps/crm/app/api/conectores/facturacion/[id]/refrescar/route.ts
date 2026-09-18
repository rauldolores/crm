import { refrescarFactura } from "@/lib/server/conectores/facturas";
import {
  responderError,
  sesionDeConectores,
} from "@/lib/server/conectores/rutas";

/** Vuelve a preguntar al proveedor por una factura que no quedó timbrada. */

type Contexto = { params: Promise<{ id: string }> };

export async function POST(peticion: Request, { params }: Contexto) {
  const auth = await sesionDeConectores(peticion, { admin: false });
  if (!auth.ok) return auth.response;
  const { id } = await params;
  try {
    const factura = await refrescarFactura(
      auth.sesion.organizacionId,
      Number(id),
    );
    return Response.json({ factura });
  } catch (error) {
    return responderError(error);
  }
}

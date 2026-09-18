import { enlaceDeFactura } from "@/lib/server/conectores/facturas";
import {
  responderError,
  sesionDeConectores,
} from "@/lib/server/conectores/rutas";

/**
 * Devuelve el enlace temporal al PDF o al XML en el proveedor. Es JSON y no
 * una redirección porque quien lo pide es la aplicación con su token en la
 * cabecera: el navegador abre el enlace después.
 */

type Contexto = { params: Promise<{ id: string }> };

export async function GET(peticion: Request, { params }: Contexto) {
  const auth = await sesionDeConectores(peticion, { admin: false });
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const formato = new URL(peticion.url).searchParams.get("formato");
  if (formato !== "pdf" && formato !== "xml") {
    return Response.json({ message: "Formato no válido." }, { status: 400 });
  }
  try {
    const url = await enlaceDeFactura(
      auth.sesion.organizacionId,
      Number(id),
      formato,
    );
    return Response.json({ url });
  } catch (error) {
    return responderError(error);
  }
}

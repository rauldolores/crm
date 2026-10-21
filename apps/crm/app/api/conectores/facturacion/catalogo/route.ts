import { conectorActivo } from "@/lib/server/conectores/almacen";
import { esConectorDeFacturacion } from "@/lib/server/conectores/registro";
import {
  responderError,
  sesionDeConectores,
} from "@/lib/server/conectores/rutas";
import type { CatalogoDelSat } from "@/lib/server/conectores/tipos";

/**
 * Busca en un catálogo del SAT a través del proveedor de facturación que la
 * organización tiene conectado.
 *
 * Los catálogos son del SAT, iguales para todos, pero se piden al proveedor y
 * no a nadie más: el de claves de producto tiene más de 52.000 filas y esa
 * tabla vive en la base de Faqturia, no en la del CRM. Pedírsela a su API
 * evita que el CRM dependa del esquema interno de otro producto.
 *
 * Consecuencia asumida: sin conector guardado no hay catálogo que buscar. Se
 * responde `sin_conector` en vez de un error, y la pantalla cae a un campo de
 * texto para que nadie se quede bloqueado — las claves por defecto
 * (`01010101`, `E48`) sirven para guardar y afinar después.
 */

const CATALOGOS: CatalogoDelSat[] = ["productos-servicios", "unidades"];

const esCatalogo = (valor: string): valor is CatalogoDelSat =>
  (CATALOGOS as string[]).includes(valor);

export async function GET(peticion: Request) {
  const auth = await sesionDeConectores(peticion, { admin: true });
  if (!auth.ok) return auth.response;

  const parametros = new URL(peticion.url).searchParams;
  const catalogo = parametros.get("catalogo") ?? "";
  if (!esCatalogo(catalogo)) {
    return Response.json({ message: "Catálogo desconocido." }, { status: 404 });
  }

  const activo = await conectorActivo(auth.sesion.organizacionId, "invoicing");
  if (!activo || !esConectorDeFacturacion(activo.conector)) {
    return Response.json({ sin_conector: true, claves: [] });
  }
  if (!activo.conector.buscarEnCatalogoDelSat) {
    // El proveedor conectado no expone catálogos: mismo trato que sin
    // conector, la pantalla deja escribir la clave a mano.
    return Response.json({ sin_conector: true, claves: [] });
  }

  try {
    const claves = await activo.conector.buscarEnCatalogoDelSat(
      catalogo,
      parametros.get("q") ?? "",
    );
    return Response.json({ sin_conector: false, claves });
  } catch (error) {
    return responderError(error);
  }
}

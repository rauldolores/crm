import { getServiceClient } from "../supabase-service";
import { anotarEstado, conectorActivo } from "./almacen";
import { esConectorDeProductos } from "./registro";
import { ErrorDeConector, type ProductoExterno } from "./tipos";

/**
 * Sincroniza el catálogo del proveedor con crm.products: lo que está en el
 * proveedor se crea o actualiza; lo que ya no está se marca inactivo (no se
 * borra: una cotización vieja puede seguir apuntando a su SKU).
 */
export const sincronizarProductos = async (
  organizacionId: string,
): Promise<{ total: number; activos: number }> => {
  const activo = await conectorActivo(organizacionId, "products");
  if (!activo || !esConectorDeProductos(activo.conector)) {
    throw new ErrorDeConector(
      "No hay un catálogo de productos conectado. Conéctalo en Ajustes → Conectores.",
      404,
    );
  }
  const { conector, guardado } = activo;

  let productos: ProductoExterno[];
  try {
    productos = await conector.listarProductos();
  } catch (error) {
    const mensaje =
      error instanceof ErrorDeConector
        ? error.message
        : "No se pudo leer el catálogo del proveedor.";
    await anotarEstado(guardado.id, mensaje);
    throw error instanceof ErrorDeConector
      ? error
      : new ErrorDeConector(mensaje);
  }

  const supabase = getServiceClient();
  const ahora = new Date().toISOString();

  if (productos.length > 0) {
    const filas = productos.map((producto) => ({
      organization_id: organizacionId,
      connector_id: guardado.id,
      provider: guardado.provider,
      external_id: producto.externalId,
      sku: producto.sku,
      name: producto.name.slice(0, 300),
      description: producto.description?.slice(0, 2000) ?? null,
      unit_price: producto.unitPrice,
      currency: producto.currency,
      active: producto.active,
      image_url: producto.imageUrl,
      synced_at: ahora,
    }));
    // Por lotes: PostgREST acepta miles de filas, pero un cuerpo de varios
    // MB en una sola petición es fácil de cortar por el camino.
    for (let i = 0; i < filas.length; i += 200) {
      const { error } = await supabase
        .from("products")
        .upsert(filas.slice(i, i + 200), {
          onConflict: "organization_id,provider,external_id",
        });
      if (error) throw new Error(error.message);
    }
  }

  // Lo que no vino en esta pasada ya no existe en el proveedor.
  const { error: errorAlDesactivar } = await supabase
    .from("products")
    .update({ active: false })
    .eq("organization_id", organizacionId)
    .eq("provider", guardado.provider)
    .lt("synced_at", ahora);
  if (errorAlDesactivar) throw new Error(errorAlDesactivar.message);

  await supabase
    .from("connectors")
    .update({
      status: "connected",
      last_error: null,
      last_synced_at: ahora,
      last_checked_at: ahora,
    })
    .eq("id", guardado.id);

  return {
    total: productos.length,
    activos: productos.filter((producto) => producto.active).length,
  };
};

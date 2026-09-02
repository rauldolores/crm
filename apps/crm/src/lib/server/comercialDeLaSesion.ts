import { getServiceClient } from "./supabase-service";

/**
 * Ficha de `sales` de quien actúa, dentro de su organización.
 *
 * Hace falta porque el puente `/api/datos` consulta con la clave de servicio:
 * PostgREST no recibe ningún JWT de usuario, así que `auth.uid()` es NULL
 * dentro de la base y el disparador `set_sales_id_default()` no tiene con qué
 * rellenar `sales_id`. El servidor sí sabe quién es —acaba de validar su
 * token—, y este módulo traduce ese usuario a la fila de `sales` que le
 * corresponde en esa organización.
 *
 * El par (organización, usuario) es la clave: una misma persona puede tener
 * ficha en varias organizaciones, con identificadores distintos.
 */

/**
 * Caché por proceso. Una ficha de `sales` no cambia de identificador una vez
 * creada, así que basta con resolverla la primera vez que ese usuario escribe
 * en esa organización. Se reinicia en cada arranque en frío.
 */
const cache = new Map<string, number | null>();

export async function comercialDeLaSesion(
  organizacionId: string,
  usuarioId: string | null,
): Promise<number | null> {
  if (!usuarioId) return null;

  const clave = `${organizacionId}:${usuarioId}`;
  const enCache = cache.get(clave);
  if (enCache !== undefined) return enCache;

  const { data } = await getServiceClient()
    .from("sales")
    .select("id")
    .eq("organization_id", organizacionId)
    .eq("user_id", usuarioId)
    .maybeSingle();

  const id = (data?.id as number | undefined) ?? null;
  // Un fallo puntual no se cachea: la ficha puede no existir todavía porque
  // el aprovisionamiento va en camino, y cachear el null la dejaría huérfana
  // durante toda la vida del contenedor.
  if (id != null) cache.set(clave, id);
  return id;
}

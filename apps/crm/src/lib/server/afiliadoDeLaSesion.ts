import { getServiceClient } from "./supabase-service";

/**
 * Resuelve si quien hace la petición es un afiliado vinculado (módulo
 * Afiliados) y, si lo es, su `sales_id` — el mismo identificador que ya usa
 * todo el CRM para "responsable asignado".
 *
 * No se decide por un rol de KontrolIA Auth: esta app no controla cómo se
 * nombran los roles allá. Se decide consultando directamente si existe una
 * fila en `crm.affiliates` con `kontrolia_auth_user_id` igual a quien llama,
 * en esa organización — el vínculo que un administrador completa a mano
 * después de crear la cuenta (ver AffiliateInputs). Sin ese vínculo, esta
 * función siempre devuelve null y el llamante se trata como cualquier otro
 * miembro del equipo.
 */

const cache = new Map<string, number | null>();

export async function afiliadoDeLaSesion(
  organizacionId: string,
  usuarioId: string | null,
): Promise<number | null> {
  if (!usuarioId) return null;

  const clave = `${organizacionId}:${usuarioId}`;
  const enCache = cache.get(clave);
  if (enCache !== undefined) return enCache;

  const { data } = await getServiceClient()
    .from("affiliates")
    .select("sales_id")
    .eq("organization_id", organizacionId)
    .eq("kontrolia_auth_user_id", usuarioId)
    .eq("active", true)
    .maybeSingle();

  const salesId = (data?.sales_id as number | null | undefined) ?? null;
  // Un afiliado sin sales_id todavía (recién vinculado, antes de su primer
  // inicio de sesión real) no se cachea: la próxima petición puede
  // encontrarlo ya resuelto.
  if (salesId != null) cache.set(clave, salesId);
  return salesId;
}

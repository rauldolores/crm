import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Da de alta al usuario en el CRM la primera vez que entra.
 *
 * Crea su ficha de comercial y la configuracion de su organizacion si aun no
 * existen. Es idempotente: se invoca en cada inicio de sesion.
 *
 * Vive en el servidor y no en una funcion de base de datos porque la
 * organizacion viaja en el token de KontrolIA Auth, y el servidor consulta con
 * la clave de servicio: dentro de la base, `auth.uid()` y el claim
 * `organization_id` estan vacios, asi que una funcion no puede saber a quien ni
 * a que empresa esta aprovisionando.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  const supabase = getServiceClient();

  // Configuracion de la organizacion. Se crea vacia a proposito: los valores
  // por defecto viven en el frontend, que los aplica cuando no hay claves.
  await supabase
    .from("configuration")
    .upsert(
      { organization_id: organizacionId, config: {} },
      { onConflict: "organization_id", ignoreDuplicates: true },
    );

  const { data: fichaExistente } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar, administrator")
    .eq("organization_id", organizacionId)
    .eq("user_id", usuarioId)
    .maybeSingle();

  if (fichaExistente) {
    return Response.json({ sale: fichaExistente });
  }

  // El primero que entra en una organizacion es su administrador.
  const { count } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizacionId);

  const datos = (await peticion.json().catch(() => ({}))) as {
    email?: string;
    first_name?: string;
    last_name?: string;
  };

  const { data: nuevaFicha, error } = await supabase
    .from("sales")
    .insert({
      organization_id: organizacionId,
      user_id: usuarioId,
      email: datos.email ?? "",
      first_name: datos.first_name || "Pendiente",
      last_name: datos.last_name || "",
      administrator: (count ?? 0) === 0,
    })
    .select("id, first_name, last_name, avatar, administrator")
    .single();

  if (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }

  return Response.json({ sale: nuevaFicha });
}

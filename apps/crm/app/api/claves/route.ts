import {
  esAdministradorDeOrganizacion,
  generarClaveDeApi,
  hashDeClaveDeApi,
} from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Alta y listado de claves de API de la organización. Alternar
 * activa/inactiva y eliminar viven en /api/claves/[id].
 *
 * Fuera de /api/datos a propósito: crear una clave exige generar el secreto
 * y devolverlo una única vez, algo que el puente genérico no hace, y ambas
 * operaciones exigen ser administrador, algo que ese puente tampoco
 * comprueba (solo exige sesión con organización activa).
 */

const MAX_NOMBRE = 100;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function GET(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(403, "Solo un administrador puede ver las claves de API.");
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, active, created_at, last_used_at")
    .eq("organization_id", organizacionId)
    .order("created_at", { ascending: true });

  if (error) return esError(500, error.message);
  return Response.json({ claves: data ?? [] });
}

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(403, "Solo un administrador puede crear claves de API.");
  }

  const cuerpo = await peticion.json().catch(() => null);
  const nombre =
    typeof cuerpo?.name === "string"
      ? cuerpo.name.trim().slice(0, MAX_NOMBRE)
      : "";
  if (!nombre) {
    return esError(400, "Escribe un nombre para la clave.");
  }

  const clave = generarClaveDeApi();
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      organization_id: organizacionId,
      name: nombre,
      key_prefix: clave.slice(0, 12),
      key_hash: hashDeClaveDeApi(clave),
    })
    .select("id, name, key_prefix, active, created_at")
    .single();

  if (error || !data) {
    return esError(500, error?.message ?? "No se pudo crear la clave.");
  }

  // La clave completa solo se devuelve esta vez: no queda guardada en
  // ningún lado, ni siquiera aquí.
  return Response.json({ ...data, key: clave });
}

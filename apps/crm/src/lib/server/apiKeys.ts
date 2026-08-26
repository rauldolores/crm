import { createHash, randomBytes } from "node:crypto";

import { getServiceClient } from "./supabase-service";

/**
 * Claves de API para integraciones externas (servidor a servidor): un
 * formulario en otro sitio, un bot, un sistema propio. El secreto en claro
 * solo existe en el momento de crearlo — se guarda únicamente su hash.
 *
 * Da acceso a los mismos recursos que una sesión normal (ver CON_DUENO en
 * /api/datos), sin una lista aparte que mantener sincronizada — la única
 * restricción propia de una clave es que no puede incrustar relaciones de
 * PostgREST. Por eso una clave de API es tan sensible como dar de alta a un
 * usuario más: solo un administrador puede crearlas o revocarlas.
 */

export const PREFIJO_CLAVE_DE_API = "vnq_";

export const generarClaveDeApi = () =>
  `${PREFIJO_CLAVE_DE_API}${randomBytes(24).toString("hex")}`;

export const hashDeClaveDeApi = (clave: string) =>
  createHash("sha256").update(clave).digest("hex");

/**
 * Organización dueña de una clave activa, o null si no existe o está
 * desactivada. De paso actualiza `last_used_at` sin esperar a que termine:
 * no debe retrasar la petición real que la está usando.
 */
export const organizacionDeClaveDeApi = async (
  clave: string,
): Promise<string | null> => {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, organization_id, active")
    .eq("key_hash", hashDeClaveDeApi(clave))
    .maybeSingle();

  if (!data || !data.active) return null;

  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return data.organization_id as string;
};

/** true si el usuario es administrador de esa organización en el CRM. */
export const esAdministradorDeOrganizacion = async (
  organizacionId: string,
  usuarioId: string,
): Promise<boolean> => {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("sales")
    .select("administrator")
    .eq("organization_id", organizacionId)
    .eq("user_id", usuarioId)
    .maybeSingle();
  return data?.administrator === true;
};

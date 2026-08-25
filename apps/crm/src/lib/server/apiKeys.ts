import { createHash, randomBytes } from "node:crypto";

import { getServiceClient } from "./supabase-service";

/**
 * Claves de API para integraciones externas (servidor a servidor): un
 * formulario en otro sitio, con sus propios campos, que crea contactos en
 * Vinqulia sin que un humano inicie sesión. El secreto en claro solo existe
 * en el momento de crearlo — se guarda únicamente su hash — y solo se
 * reenvían las tablas de `RECURSOS_PERMITIDOS_CON_API_KEY`, no todo el CRM.
 */

export const PREFIJO_CLAVE_DE_API = "vnq_";

/** Tablas a las que una clave de API puede acceder vía /api/datos. */
export const RECURSOS_PERMITIDOS_CON_API_KEY = new Set([
  "contacts",
  "contact_notes",
  "companies",
  // La clave externa del formulario del sitio web crea la oportunidad (deal)
  // que representa al lead, con los datos extra en su descripción.
  "deals",
]);

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

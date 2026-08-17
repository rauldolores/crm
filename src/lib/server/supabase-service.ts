import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de la base de datos del CRM para uso EXCLUSIVO en servidor.
 *
 * Usa la clave de servicio, que **salta las políticas RLS**. Nunca debe
 * llegar al navegador ni exponerse en una variable `NEXT_PUBLIC_`.
 *
 * Que salte el RLS tiene una consecuencia que conviene tener presente al
 * escribir cada ruta: el aislamiento entre organizaciones ya no lo garantiza
 * la base de datos, sino el código. Por eso toda ruta que devuelva o modifique
 * un recurso concreto debe pasar antes por `verificarTenencia()`, y toda
 * consulta de listado debe filtrar por la organización del token.
 *
 * Las políticas RLS siguen existiendo en el esquema y no sobran: son la
 * segunda barrera si alguna vez una consulta llega con un token de usuario en
 * lugar de con esta clave.
 */
export function getServiceClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const claveDeServicio = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL. Es la base de datos del CRM; la configura el instalador.",
    );
  }
  if (!claveDeServicio) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. Se obtiene del panel de Supabase en Settings → API → service_role, y solo debe existir en el servidor.",
    );
  }

  return createClient(url, claveDeServicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

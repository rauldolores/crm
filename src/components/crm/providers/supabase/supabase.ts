import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

/**
 * Cliente de la base de datos del CRM.
 *
 * PENDIENTE (login centralizado): cuando el authProvider deje de usar Supabase
 * Auth, hay que añadir aquí la opción `accessToken`, para que en cada petición
 * viaje el token de KontrolIA Auth en lugar de una sesión propia:
 *
 *   { accessToken: async () => (await getKontroliaAccessToken()) ?? "" }
 *
 * Eso es lo que hace que el RLS funcione, porque las políticas filtran por el
 * claim `organization_id` de ese token. No se activa todavía porque al pasar
 * `accessToken` supabase-js deshabilita `supabase.auth`, del que aún dependen
 * el authProvider y la pantalla de acceso.
 *
 * La base del CRM y la de KontrolIA Auth suelen ser proyectos distintos, así
 * que el del CRM debe confiar en ese emisor (verificación por JWKS; KontrolIA
 * Auth firma con ES256 y publica su clave pública). Si son el mismo proyecto,
 * la verificación es directa.
 */
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SB_PUBLISHABLE_KEY,
    );
  }
  return supabaseClient;
};

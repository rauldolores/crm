import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";
import { isKontroliaAuthConfigured } from "@/lib/kontrolia-auth/config";
import { env } from "@/lib/env";

let supabaseClient: SupabaseClient | null = null;

/** Ruta del puente que reenvía a la base de datos desde el servidor. */
const PUENTE = "/api/supabase";

/**
 * Cliente de la base de datos del CRM.
 *
 * Con acceso centralizado el navegador NO habla con la base directamente:
 * apunta al puente `/api/supabase`, que verifica el token de KontrolIA Auth en
 * el servidor y reenvía la petición firmando otro token que lleva la
 * organización activa. Las políticas RLS se aplican entonces dentro de la base,
 * tal y como se verificaron.
 *
 * Esto es lo que permite usar el Supabase que el cliente ya tenga —local o en
 * la nube— sin configurar nada en ese proyecto. Hablar directo obligaría a que
 * su base confiara en el emisor de los tokens de KontrolIA Auth.
 *
 * `accessToken` hace que supabase-js envíe el token de KontrolIA en cada
 * petición en lugar de gestionar una sesión propia.
 */
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const usarPuente = isKontroliaAuthConfigured();

    supabaseClient = createClient(
      usarPuente ? `${window.location.origin}${PUENTE}` : env.supabaseUrl,
      env.supabasePublishableKey,
      usarPuente
        ? { accessToken: async () => (await getKontroliaAccessToken()) ?? "" }
        : undefined,
    );
  }
  return supabaseClient;
};

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

import { getKontroliaAccessToken } from "@/lib/kontrolia-auth/client";
import { isKontroliaAuthConfigured } from "@/lib/kontrolia-auth/config";
import { env } from "@/lib/env";

let supabaseClient: SupabaseClient<any, "crm"> | null = null;

/** Ruta del puente que reenvía a la base de datos desde el servidor. */
const PUENTE = "/api/datos";

/**
 * Envía el token de KontrolIA Auth en cada petición.
 *
 * Se hace interceptando `fetch` y no con la opción `accessToken` de
 * supabase-js: esa opción deshabilita `supabase.auth`, y `ra-supabase-core`
 * llama a `supabase.auth.getSession()` dentro de su data provider, de modo que
 * todas las consultas fallaban antes de salir del navegador.
 */
const fetchConToken: typeof fetch = async (entrada, opciones) => {
  const token = await getKontroliaAccessToken();
  const cabeceras = new Headers(opciones?.headers);
  if (token) {
    cabeceras.set("Authorization", `Bearer ${token}`);
  }
  return fetch(entrada, { ...opciones, headers: cabeceras });
};

/**
 * Cliente de la base de datos del CRM.
 *
 * Con acceso centralizado el navegador NO habla con la base directamente:
 * apunta al puente `/api/datos`, que verifica el token de KontrolIA Auth en
 * el servidor y reenvía la petición firmando otro token que lleva la
 * organización activa. Las políticas RLS se aplican entonces dentro de la base.
 *
 * Esto permite usar el Supabase que el cliente ya tenga —local o en la nube—
 * sin configurar nada en ese proyecto.
 */
/**
 * Direccion contra la que se piden los datos: el puente cuando el acceso es
 * centralizado, o la base directamente en el modo antiguo. Se exporta porque
 * ra-supabase necesita la misma en su `instanceUrl`; si las dos no coinciden,
 * parte de las peticiones se saltan el puente.
 */
export const getUrlDeDatos = () =>
  isKontroliaAuthConfigured()
    ? `${window.location.origin}${PUENTE}`
    : env.supabaseUrl;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const usarPuente = isKontroliaAuthConfigured();

    supabaseClient = createClient<any, "crm">(
      getUrlDeDatos(),
      env.supabasePublishableKey,
      {
        db: { schema: "crm" },
        ...(usarPuente
          ? {
              global: { fetch: fetchConToken },
              auth: { persistSession: false, autoRefreshToken: false },
            }
          : {}),
      },
    );
  }
  return supabaseClient;
};

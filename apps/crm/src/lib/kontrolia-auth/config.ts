import { env } from "@/lib/env";
/**
 * Configuración del SDK @kontrolia/auth. Apunta al proyecto Supabase de
 * KontrolIA Auth, que normalmente NO es el mismo donde viven los datos del
 * CRM: el cliente puede tener su propia base, local o en la nube.
 *
 * Nunca se escriben aquí URLs ni claves: la instalación de KontrolIA Auth es
 * autohospedable y cambia de dominio según el cliente, así que todo pasa por
 * variables de entorno que el CLI de instalación rellena.
 */
export const kontroliaAuthConfig = {
  supabaseUrl: env.kontroliaAuthUrl,
  supabaseAnonKey: env.kontroliaAuthAnonKey,
  // Sesión compartida entre subdominios, tal como la documenta KontrolIA Auth
  // ("Conectar tu aplicación": si la app vive en un subdominio del mismo
  // dominio que auth-server, basta con fijar cookieDomain). Ver `env.ts` para
  // el detalle del choque de cookies que esto evita.
  cookieDomain: env.cookieDomain,
  // Habilita en el SDK los métodos de directorio (listOrganizationMembers,
  // searchOrganizationMembers, getOrganizationMemberCount). El CRM hoy no los
  // llama desde el navegador —el endpoint del auth-server no admite CORS, así
  // que el directorio se consulta vía /api/crm/comerciales/sincronizar—, pero
  // la configuración queda lista para cuando sí se pueda.
  authServerUrl: env.kontroliaAuthServerUrl || undefined,
};

/** true si la aplicación tiene configurado el login centralizado. */
export const isKontroliaAuthConfigured = () =>
  Boolean(
    kontroliaAuthConfig.supabaseUrl && kontroliaAuthConfig.supabaseAnonKey,
  );

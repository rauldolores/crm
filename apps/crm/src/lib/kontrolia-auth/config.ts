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
  // Habilita en el SDK los métodos de directorio (listOrganizationMembers,
  // searchOrganizationMembers, getOrganizationMemberCount). El CRM hoy no los
  // llama desde el navegador —requieren que auth-server tenga el origen del
  // CRM en su lista de apps de confianza (CORS)—, pero la configuración
  // queda lista para cuando sí se pueda.
  authServerUrl: env.kontroliaAuthServerUrl || undefined,
  // Nombre propio de cookie: ver el comentario en env.ts. Evita que la
  // cookie de sesión de auth-server (compartida con admin-panel en
  // .kontrolia.io) tape la del CRM en su propio subdominio.
  cookieName: env.cookieName,
};

/** true si la aplicación tiene configurado el login centralizado. */
export const isKontroliaAuthConfigured = () =>
  Boolean(
    kontroliaAuthConfig.supabaseUrl && kontroliaAuthConfig.supabaseAnonKey,
  );

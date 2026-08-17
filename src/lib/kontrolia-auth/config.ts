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
  supabaseUrl: import.meta.env.VITE_KONTROLIA_AUTH_URL,
  supabaseAnonKey: import.meta.env.VITE_KONTROLIA_AUTH_ANON_KEY,
};

/** true si la aplicación tiene configurado el login centralizado. */
export const isKontroliaAuthConfigured = () =>
  Boolean(
    kontroliaAuthConfig.supabaseUrl && kontroliaAuthConfig.supabaseAnonKey,
  );

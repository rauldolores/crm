/**
 * Configuración de la aplicación, leída del entorno.
 *
 * Punto único: el resto del código importa de aquí en lugar de leer el
 * entorno directamente. Eso permitió cambiar de Vite (`import.meta.env.VITE_*`)
 * a Next (`process.env.NEXT_PUBLIC_*`) tocando un solo archivo, y es donde
 * habrá que mirar si mañana cambia otra vez.
 *
 * En Next, `process.env.NEXT_PUBLIC_*` se sustituye en tiempo de compilación,
 * así que hay que escribir cada nombre completo y literal: una lectura
 * dinámica como `process.env[nombre]` no se sustituye y llega vacía.
 */
export const env = {
  /** Base de datos del CRM (del cliente; normalmente distinta a la del auth). */
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SB_PUBLISHABLE_KEY ?? "",
  attachmentsBucket:
    process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET ?? "attachments",

  /** KontrolIA Auth: acceso, usuarios, roles, permisos y organizaciones. */
  kontroliaAuthUrl: process.env.NEXT_PUBLIC_KONTROLIA_AUTH_URL ?? "",
  kontroliaAuthAnonKey: process.env.NEXT_PUBLIC_KONTROLIA_AUTH_ANON_KEY ?? "",
  kontroliaAuthServerUrl:
    process.env.NEXT_PUBLIC_KONTROLIA_AUTH_SERVER_URL ?? "",
  kontroliaOAuthClientId:
    process.env.NEXT_PUBLIC_KONTROLIA_OAUTH_CLIENT_ID ?? "",
  /**
   * Nombre propio para la cookie de sesión del CRM. El CRM comparte proyecto
   * de Supabase con KontrolIA Auth, así que ambos derivarían por defecto el
   * mismo nombre de cookie (`sb-<ref>-auth-token`); como auth-server la fija
   * en `.kontrolia.io` para compartirla con admin-panel, esa cookie también
   * llega a `crm.kontrolia.io` y tapa la propia del CRM —el dominio padre se
   * lee antes que el host—, así que cambiar de organización parecía no
   * funcionar (@kontrolia/auth 2.2.0, ver su changelog para el detalle).
   */
  cookieName: process.env.NEXT_PUBLIC_COOKIE_NAME || "sb-crm-auth-token",

  /** Opcionales. */
  googleWorkplaceDomain: process.env.NEXT_PUBLIC_GOOGLE_WORKPLACE_DOMAIN || undefined,
  isDemo: process.env.NEXT_PUBLIC_IS_DEMO === "true",
  inboundEmail: process.env.NEXT_PUBLIC_INBOUND_EMAIL ?? "",
  disableEmailPasswordAuthentication:
    process.env.NEXT_PUBLIC_DISABLE_EMAIL_PASSWORD_AUTHENTICATION === "true",
} as const;

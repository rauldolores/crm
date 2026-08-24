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
   * Dominio de la cookie de sesión, cuando el CRM vive en un subdominio del
   * mismo dominio que KontrolIA Auth (`.kontrolia.io` para `crm.kontrolia.io`
   * junto a `auth.kontrolia.io`). Sin esto ambas apps escriben una cookie con
   * el MISMO nombre —se deriva del proyecto de Supabase, que comparten— pero
   * en ámbitos distintos: la del dominio padre se lee primero y tapa a la del
   * host, así que el CRM guardaba bien la sesión al cambiar de organización y
   * después leía la del auth-server, que sigue en la organización del acceso.
   * Vacío en local (`localhost` no recibe cookies de `.kontrolia.io`, así que
   * no hay choque) y en cualquier despliegue fuera de ese dominio.
   */
  cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,

  /** Opcionales. */
  googleWorkplaceDomain: process.env.NEXT_PUBLIC_GOOGLE_WORKPLACE_DOMAIN || undefined,
  isDemo: process.env.NEXT_PUBLIC_IS_DEMO === "true",
  inboundEmail: process.env.NEXT_PUBLIC_INBOUND_EMAIL ?? "",
  disableEmailPasswordAuthentication:
    process.env.NEXT_PUBLIC_DISABLE_EMAIL_PASSWORD_AUTHENTICATION === "true",
} as const;

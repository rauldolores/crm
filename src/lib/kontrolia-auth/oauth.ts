import { env } from "@/lib/env";
/**
 * Constantes del flujo OAuth 2.1 (Authorization Code + PKCE) contra
 * KontrolIA Auth.
 *
 * Kontrolia CRM no pide credenciales nunca: solo inicia el flujo y redirige a
 * la pantalla de login del ecosistema, que es la única que las recibe. El
 * código de vuelta se canjea por sesión en la ruta de callback.
 *
 * Requiere que el CRM esté registrado como cliente OAuth público
 * (`client_type: "public"`, sin secreto, que es lo correcto para una SPA).
 * Ese registro es distinto del catálogo de permisos.
 */
export const OAUTH_CLIENT_ID =
  env.kontroliaOAuthClientId || "";

/**
 * sessionStorage y no localStorage: el verificador solo debe sobrevivir el
 * viaje de ida y vuelta al servidor de autorización, no persistir entre
 * sesiones del navegador.
 */
export const OAUTH_CODE_VERIFIER_STORAGE_KEY = "kontrolia_oauth_code_verifier";

/** Ruta que recibe el código de autorización. */
export const OAUTH_CALLBACK_PATH = "/oauth/callback";

/**
 * El `redirect_uri` debe coincidir carácter por carácter con uno de los
 * registrados para este `client_id`, así que se construye desde el origen
 * real en el que corre la aplicación y no desde una variable aparte que
 * podría desincronizarse.
 */
export const oauthRedirectUri = () =>
  `${window.location.origin}${OAUTH_CALLBACK_PATH}`;

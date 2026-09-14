import { env } from "@/lib/env";
/**
 * Constantes del flujo OAuth 2.1 (Authorization Code + PKCE) contra
 * KontrolIA Auth.
 *
 * Vinqulia no pide credenciales nunca: solo inicia el flujo y redirige a
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

/**
 * A dónde volver dentro del CRM una vez completado el acceso (la ruta que
 * pedía `RedireccionAlAcceso` antes de salir). Va en sessionStorage y no en
 * el query string de `/oauth/login`, porque ese viaje ahora pasa primero por
 * la pantalla de acceso centralizada (`{AUTH}/login?...`), que vuelve al
 * origen desnudo — sin el query string original — y sessionStorage sí
 * sobrevive ese viaje de ida y vuelta entre dominios.
 */
export const OAUTH_DESTINO_STORAGE_KEY = "kontrolia_oauth_destino";

/**
 * Si ya se intentó la pantalla de acceso centralizada en este intento de
 * inicio de sesión. La primera vez que no hay sesión, `/oauth/login` manda
 * ahí (para que aparezca "Crear cuenta"); si se vuelve sin sesión todavía
 * —quien inició sesión o se registró ahí ya tiene cookie de GoTrue—, esta
 * marca hace que la segunda pasada siga con el flujo PKCE de siempre en vez
 * de mandar otra vez a la misma pantalla y quedar en un ciclo. Se limpia al
 * cerrar sesión, para que el próximo acceso vuelva a pasar por ahí.
 */
export const OAUTH_LOGIN_CENTRALIZADO_INTENTADO_KEY =
  "kontrolia_oauth_login_centralizado_intentado";

/** Ruta que inicia el acceso. */
export const OAUTH_LOGIN_PATH = "/oauth/login";

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

/**
 * Refresco de la sesión OAuth con `client_id`.
 *
 * La sesión del CRM nace del servidor OAuth de GoTrue (canje del código en
 * /oauth/callback), y GoTrue exige identificar al cliente OAuth cada vez que
 * se refresca una sesión así: sin `client_id` responde
 * `invalid_client: Client authentication required for OAuth session`.
 * supabase-js no lo sabe: refresca con `POST /auth/v1/token` y solo el
 * refresh_token, recibe ese 400, lo trata como error definitivo y BORRA la
 * sesión local. Lo que se veía en producción: al cambiar de organización
 * (que refresca el token) o al caducar el token, la app se quedaba sin
 * sesión, «No se pudo consultar tu plan…», y el OAuth la volvía a crear en
 * silencio porque la cookie del auth-server seguía viva — con lo que
 * «cerrar sesión» tampoco cerraba nada.
 *
 * El SDK (@kontrolia/auth 2.3) no ofrece un refresco con `client_id`, así
 * que se intercepta el `fetch` interno de su GoTrueClient: toda llamada de
 * refresco se reescribe al endpoint del servidor OAuth
 * (`POST /auth/v1/oauth/token`, formulario, con `client_id`), que es el
 * mismo que ya se usa para canjear el código. Se cubre así cada camino que
 * refresca —el temporizador automático, la recuperación al cargar la
 * página, `refreshSession()`, `switchOrganization()`— sin tocar el SDK.
 *
 * ## Por qué las dos llamadas llevan tiempo límite
 *
 * supabase-js refresca DENTRO de un cerrojo de navegador
 * (`navigator.locks`, `lock:sb-…-auth-token`) que comparten todas las
 * pestañas del mismo origen, y el resto de operaciones de sesión esperan ese
 * cerrojo 10 segundos antes de rendirse con
 * `DOMException: signal is aborted without reason`.
 *
 * Aquí se hacen DOS peticiones seguidas donde el SDK hacía una, así que el
 * cerrojo se retiene el doble. Y `fetch` no tiene tiempo límite propio: en
 * una red móvil mala, una sola petición colgada deja el cerrojo tomado para
 * siempre y a partir de ahí NINGÚN inicio de sesión funciona en ese
 * navegador — falla exactamente a los 10 s, una y otra vez, hasta cerrar la
 * pestaña. Pasó en producción el 2026-10-09.
 *
 * Con tiempo límite, lo peor que ocurre es que el refresco falle: un `fetch`
 * abortado llega a supabase-js como `AuthRetryableFetchError`, que reintenta
 * y NO cierra la sesión. Los dos topes suman menos que los 10 s del cerrojo.
 */

interface ClienteConGoTrue {
  supabase: {
    auth: {
      fetch: typeof fetch;
    };
  };
}

interface OpcionesDeRefresco {
  supabaseUrl: string;
  supabaseAnonKey: string;
  clientId: string;
}

/** El refresco es imprescindible: se le da el grueso del presupuesto. */
const LIMITE_REFRESCO_MS = 6000;

/** El usuario es opcional (si falla, la sesión vale igual): tope corto. */
const LIMITE_USUARIO_MS = 2000;

const urlDe = (entrada: RequestInfo | URL): string => {
  if (typeof entrada === "string") return entrada;
  if (entrada instanceof URL) return entrada.href;
  return entrada.url;
};

/** true si es el refresco de sesión de supabase-js (`/auth/v1/token?grant_type=refresh_token`). */
export const esRefrescoDeGoTrue = (url: string): boolean => {
  try {
    const u = new URL(url);
    return (
      u.pathname.endsWith("/auth/v1/token") &&
      u.searchParams.get("grant_type") === "refresh_token"
    );
  } catch {
    return false;
  }
};

const refreshTokenDelCuerpo = (cuerpo: BodyInit | null | undefined) => {
  if (typeof cuerpo !== "string") return null;
  try {
    const datos = JSON.parse(cuerpo) as { refresh_token?: unknown };
    return typeof datos.refresh_token === "string" ? datos.refresh_token : null;
  } catch {
    return null;
  }
};

/**
 * Instala el interceptor en el cliente del SDK. `supabase` es privado en los
 * tipos del SDK pero es una propiedad normal en tiempo de ejecución; el cast
 * es deliberado y esta es la única función que lo hace.
 */
export function instalarRefrescoOAuth(
  cliente: object,
  opciones: OpcionesDeRefresco,
): void {
  const auth = (cliente as ClienteConGoTrue).supabase.auth;
  const fetchOriginal = auth.fetch;
  const base = opciones.supabaseUrl.replace(/\/$/, "");

  auth.fetch = async (entrada, init) => {
    const url = urlDe(entrada);
    const refreshToken = esRefrescoDeGoTrue(url)
      ? refreshTokenDelCuerpo(init?.body)
      : null;
    if (!refreshToken) return fetchOriginal(entrada, init);

    const respuesta = await fetchOriginal(`${base}/auth/v1/oauth/token`, {
      method: "POST",
      headers: {
        apikey: opciones.supabaseAnonKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: opciones.clientId,
      }),
      signal: AbortSignal.timeout(LIMITE_REFRESCO_MS),
    });
    if (!respuesta.ok) return respuesta;

    // El servidor OAuth devuelve solo los tokens; supabase-js espera además
    // `user` en la respuesta de refresco para dejar la sesión igual que una
    // creada por login. Si esta consulta falla, la sesión vale igual.
    const tokens = (await respuesta.json()) as { access_token: string };
    const usuario = await fetchOriginal(`${base}/auth/v1/user`, {
      headers: {
        apikey: opciones.supabaseAnonKey,
        Authorization: `Bearer ${tokens.access_token}`,
      },
      signal: AbortSignal.timeout(LIMITE_USUARIO_MS),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    return new Response(JSON.stringify({ ...tokens, user: usuario }), {
      status: respuesta.status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

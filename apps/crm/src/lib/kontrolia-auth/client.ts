/**
 * Cliente singleton de @kontrolia/auth para usarlo FUERA del árbol de React
 * (el data provider y el auth provider son funciones planas y no pueden
 * llamar al hook `useAuth()`).
 *
 * Es una instancia distinta de la que crea `<AuthProvider>`, pero ambas
 * envuelven al mismo proyecto de Supabase, así que comparten la sesión
 * persistida en el navegador y se mantienen sincronizadas.
 */
import { createKontroliaClient, type KontroliaClient } from "@kontrolia/auth";
import { isKontroliaAuthConfigured, kontroliaAuthConfig } from "./config";

let cliente: KontroliaClient | null = null;

export function getKontroliaClient(): KontroliaClient | null {
  if (typeof window === "undefined") return null;
  if (!isKontroliaAuthConfigured()) return null;
  if (!cliente) cliente = createKontroliaClient(kontroliaAuthConfig);
  return cliente;
}

/**
 * Margen antes de `exp`: evita enviar un token que caduca en pleno vuelo de
 * red y provoca un 401 aparentemente aleatorio.
 */
const MARGEN_DE_CADUCIDAD_SEGUNDOS = 30;

/**
 * true si el token ya caducó o caduca dentro del margen. Solo decodifica el
 * payload, no verifica la firma: esto únicamente decide si conviene refrescar
 * antes de enviarlo. Quien lo valida de verdad es el servidor.
 */
function caducaOEstaPorCaducar(token: string): boolean {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof payload.exp !== "number") return false;
    return payload.exp - Date.now() / 1000 < MARGEN_DE_CADUCIDAD_SEGUNDOS;
  } catch {
    return false;
  }
}

let peticionDeTokenEnVuelo: Promise<string | null> | null = null;

/**
 * Token de acceso de la sesión actual, o null si no hay.
 *
 * El singleton vive fuera de `<AuthProvider>` y por tanto sin su temporizador
 * de refresco automático, así que un token que llevaba rato sin usarse puede
 * llegar caducado al servidor. Se fuerza el refresco aquí cuando hace falta.
 *
 * El CRM llama a esto desde varios sitios independientes casi al mismo
 * tiempo (checkAuth, y cada `<CanAccess>` del sidebar vía getSale) — sin
 * compartir la llamada en curso, cada uno refrescaba el token por su cuenta
 * con el mismo refresh token, y KontrolIA Auth respondía 429 a los que
 * llegaban en paralelo, disparando una cascada de reintentos. Se comparte
 * una sola promesa en vuelo por eso: los llamadores concurrentes esperan el
 * mismo resultado en vez de refrescar cada uno por separado.
 */
export async function getKontroliaAccessToken(): Promise<string | null> {
  if (peticionDeTokenEnVuelo) return peticionDeTokenEnVuelo;
  peticionDeTokenEnVuelo = (async () => {
    try {
      const c = getKontroliaClient();
      if (!c) return null;
      let token = await c.getToken();
      if (token && caducaOEstaPorCaducar(token)) {
        await c.refresh();
        token = await c.getToken();
      }
      return token;
    } catch {
      return null;
    } finally {
      peticionDeTokenEnVuelo = null;
    }
  })();
  return peticionDeTokenEnVuelo;
}

/**
 * Descarta cualquier promesa de token compartida que siga en curso, sin
 * esperarla. La usa `switchKontroliaOrganization` antes de cambiar de
 * organización: si un refresco genérico (de checkAuth o de un `<CanAccess>`
 * del sidebar) seguía en vuelo desde antes del clic, quedaba compartido con
 * el de aquí y el cambio de organización esperaba —o corría— detrás de un
 * refresco que reflejaba todavía la organización anterior.
 */
export function descartarTokenEnVuelo(): void {
  peticionDeTokenEnVuelo = null;
}

/** Organizaciones a las que pertenece el usuario, para el selector. */
export async function getKontroliaMemberships() {
  const c = getKontroliaClient();
  if (!c) return [];
  try {
    return await c.getMemberships();
  } catch {
    return [];
  }
}

/** Rechaza si la promesa no resuelve dentro del plazo. */
const conPlazo = <T>(promesa: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promesa,
    new Promise<never>((_, rechazar) =>
      setTimeout(() => rechazar(new Error("Tiempo de espera agotado")), ms),
    ),
  ]);

const PLAZO_DE_CAMBIO_MS = 8000;

/**
 * Cambia la organización activa. Fuerza un refresco del token para que
 * `organization_id`, `roles` y `permissions` reflejen la nueva, que es lo que
 * hace que el RLS empiece a devolver los datos de esa empresa.
 *
 * El SDK primero escribe el contexto de sesión y después refresca el token.
 * Ese segundo paso puede fallar o quedarse colgado con el contexto ya
 * cambiado, o el intento entero puede quedar en cola detrás de un refresco
 * genérico (de checkAuth o de un `<CanAccess>` del sidebar) que seguía en
 * vuelo desde antes del clic — en ese caso el contexto de sesión NUNCA llega
 * a escribirse, y un simple refresco de más no cambia nada: se queda
 * siempre en la organización anterior. Por eso, si el primer intento falla o
 * se cuelga, se reintenta el cambio en sí (no solo el refresco) una vez
 * antes de rendirse con un refresco simple como último recurso: en el peor
 * de los casos quien llama recarga igualmente y el token que haya en ese
 * momento llega al arrancar.
 */
export async function switchKontroliaOrganization(
  organizationId: string,
): Promise<void> {
  const c = getKontroliaClient();
  if (!c) return;
  descartarTokenEnVuelo();
  try {
    await conPlazo(c.switchOrganization(organizationId), PLAZO_DE_CAMBIO_MS);
  } catch {
    try {
      await conPlazo(
        c.switchOrganization(organizationId),
        PLAZO_DE_CAMBIO_MS,
      );
    } catch {
      await conPlazo(c.refresh(), PLAZO_DE_CAMBIO_MS).catch(() => {});
    }
  }
}

export async function logoutKontroliaAuth(): Promise<void> {
  const c = getKontroliaClient();
  if (!c) return;
  try {
    await c.logout();
  } catch {
    // Best-effort: si falla, la redirección al login se hace igualmente.
  }
}

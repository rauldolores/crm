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

/** organization_id del token, sin verificar firma (ver caducaOEstaPorCaducar). */
function organizacionDelToken(token: string): string | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.organization_id === "string"
      ? payload.organization_id
      : null;
  } catch {
    return null;
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cambia la organización activa. Fuerza un refresco del token para que
 * `organization_id`, `roles` y `permissions` reflejen la nueva, que es lo que
 * hace que el RLS empiece a devolver los datos de esa empresa.
 *
 * El SDK primero escribe el contexto de sesión y después refresca el token,
 * pero que esa promesa resuelva no garantiza que la sesión nueva ya haya
 * terminado de persistirse (cookies/localStorage) en el navegador — quien
 * llama recarga la página justo después, y una recarga demasiado pegada a la
 * escritura puede leerla a medias y arrancar todavía con la organización
 * anterior (bug real, visto en producción: el cambio "revertía" siempre a la
 * organización con la que se había iniciado sesión). Por eso, en vez de
 * confiar en que switchOrganization() ya dejó todo listo, se comprueba el
 * token resultante y se reintenta unas cuantas veces antes de devolver el
 * control a quien llama.
 */
export async function switchKontroliaOrganization(
  organizationId: string,
): Promise<void> {
  const c = getKontroliaClient();
  if (!c) return;
  descartarTokenEnVuelo();

  const INTENTOS = 5;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      await conPlazo(c.switchOrganization(organizationId), PLAZO_DE_CAMBIO_MS);
    } catch {
      // Se sigue comprobando el token de todas formas: el mensaje de error
      // de switchOrganization() no dice si el contexto ya quedó escrito.
    }

    const token = await c.getToken().catch(() => null);
    if (token && organizacionDelToken(token) === organizationId) {
      return;
    }

    if (intento < INTENTOS) {
      await esperar(200 * intento);
    }
  }
  // Se agotaron los intentos: quien llama recarga igual, con el token que
  // haya en ese momento — es mejor que dejar la interfaz "colgada".
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

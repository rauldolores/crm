/**
 * Comprueba contra GoTrue que la sesión del CRM sigue existiendo.
 *
 * El CRM valida su token localmente y lo acepta hasta que caduca (hasta una
 * hora). Pero la sesión puede morir antes: al cerrar sesión en el portal, el
 * servidor central hace `signOut()` global y GoTrue borra TODAS las sesiones
 * del usuario. Si después se entra con otra cuenta en el servidor central y
 * se abre el CRM, este seguía mostrando la cuenta anterior hasta un F5.
 *
 * GoTrue sí lo sabe: `GET /auth/v1/user` con ese token responde 403
 * `session_not_found`. Al cargar la aplicación y al volver a la pestaña se
 * hace esa consulta (`auth.getUser(token)`, que va al servidor; `getSession`
 * y `getClaims` no). Si la sesión ya no existe, quien llama limpia SOLO la
 * sesión local y manda al acceso normal (`/oauth/login`), que entra con
 * quien esté conectado en el servidor central.
 *
 * Nunca se usa el "Salir" del CRM para esto: navega a `/api/auth/logout` del
 * servidor central y cerraría la sesión de la cuenta NUEVA.
 *
 * Ante la duda no se saca a nadie: errores de red, plazo agotado, 5xx o 429
 * cuentan como "no se sabe" y el CRM sigue como estaba.
 */
import { getKontroliaClient } from "./client";

/** Lo que dijo GoTrue de la sesión. */
export type EstadoDeSesion = "valida" | "revocada" | "desconocido";

/** Lo que interesa de un `AuthError` de supabase-js. */
export interface ErrorDeGoTrue {
  name?: string;
  status?: number;
  code?: string;
}

/**
 * `supabase` es privado en los tipos del SDK pero es una propiedad normal en
 * tiempo de ejecución, igual que en refrescoOAuth.ts.
 */
interface ClienteConGoTrue {
  supabase: {
    auth: {
      getUser(jwt: string): Promise<{
        data: { user: unknown };
        error: ErrorDeGoTrue | null;
      }>;
      signOut(opciones: {
        scope: "local";
      }): Promise<{ error: ErrorDeGoTrue | null }>;
    };
  };
}

/** Códigos con los que GoTrue dice que la sesión o el usuario ya no existen. */
const CODIGOS_DE_SESION_INEXISTENTE = new Set([
  "session_not_found",
  "user_not_found",
  "bad_jwt",
  "no_authorization",
]);

/** Tope de la consulta: pasado este plazo, "no se sabe". */
const PLAZO_DE_VALIDACION_MS = 5000;

/** Tope para borrar la sesión local (signOut toma el cerrojo de sesión). */
const PLAZO_DE_CIERRE_LOCAL_MS = 5000;

/** Rechaza si la promesa no resuelve dentro del plazo. */
const conPlazo = <T>(promesa: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promesa,
    new Promise<never>((_, rechazar) =>
      setTimeout(() => rechazar(new Error("Tiempo de espera agotado")), ms),
    ),
  ]);

/**
 * true solo si el error dice que la sesión o el usuario ya no existen.
 *
 * supabase-js convierte `session_not_found` en `AuthSessionMissingError`
 * (status 400, sin `code`), así que también se mira el nombre. Los errores
 * transitorios (red, 5xx, 429) nunca sacan al usuario, aunque traigan código.
 */
export function sesionRevocadaSegunError(
  error: ErrorDeGoTrue | null | undefined,
): boolean {
  if (!error) return false;
  const { name, status, code } = error;
  if (name === "AuthRetryableFetchError") return false;
  if (status === 429 || (typeof status === "number" && status >= 500)) {
    return false;
  }
  if (name === "AuthSessionMissingError") return true;
  if (code && CODIGOS_DE_SESION_INEXISTENTE.has(code)) return true;
  return status === 401 || status === 403;
}

const authDe = (cliente: object) =>
  (cliente as ClienteConGoTrue).supabase.auth;

const consultar = async (): Promise<EstadoDeSesion> => {
  const cliente = getKontroliaClient();
  if (!cliente) return "desconocido";
  const token = await cliente.getToken();
  if (!token) return "desconocido";

  const { data, error } = await authDe(cliente).getUser(token);
  if (error) {
    return sesionRevocadaSegunError(error) ? "revocada" : "desconocido";
  }
  return data?.user ? "valida" : "desconocido";
};

/**
 * Pregunta a GoTrue por la sesión actual. Pasa el token explícito a
 * `getUser` para que la consulta no toque la sesión guardada ni refresque.
 * Sin cliente o sin sesión devuelve "desconocido": de eso ya se encarga
 * `checkAuth`. El plazo cubre todo (también `getToken`, que puede esperar el
 * cerrojo de sesión), porque al cargar el CRM no se muestra hasta tener la
 * respuesta.
 */
export async function consultarSesionEnGoTrue(): Promise<EstadoDeSesion> {
  try {
    return await conPlazo(consultar(), PLAZO_DE_VALIDACION_MS);
  } catch {
    // Plazo agotado o fallo inesperado: no se sabe.
    return "desconocido";
  }
}

/**
 * Borra la sesión de este navegador y nada más (`scope: "local"`): la del
 * servidor central, que puede ser ya de otra cuenta, queda intacta.
 */
export async function cerrarSesionLocal(): Promise<void> {
  const cliente = getKontroliaClient();
  if (!cliente) return;
  try {
    await conPlazo(
      authDe(cliente).signOut({ scope: "local" }),
      PLAZO_DE_CIERRE_LOCAL_MS,
    );
  } catch {
    // Best-effort: el canje del código en /oauth/callback reemplaza la
    // sesión guardada de todos modos.
  }
}

/** Entre dos validaciones al volver a la pestaña. */
export const ESPERA_ENTRE_VALIDACIONES_MS = 30_000;

/**
 * Freno de frecuencia: devuelve una función que responde true como mucho una
 * vez por intervalo (y anota la vez cuando lo hace).
 */
export function limitarFrecuencia(
  intervaloMs: number,
  ahora: () => number = Date.now,
): () => boolean {
  let ultima = -Infinity;
  return () => {
    const momento = ahora();
    if (momento - ultima < intervaloMs) return false;
    ultima = momento;
    return true;
  };
}

/**
 * Última vez que se mandó al acceso por sesión revocada, en milisegundos.
 * Vive en sessionStorage para sobrevivir al viaje de ida y vuelta al acceso.
 */
export const CLAVE_DE_SESION_REVOCADA = "kontrolia:sesion-revocada";

/** No se vuelve a mandar al acceso antes de este plazo. */
const ESPERA_ENTRE_SALIDAS_MS = 60_000;

/**
 * true si ya se mandó al acceso hace poco. Con una sesión nueva válida
 * `getUser` pasa y esto no se consulta; es el freno por si GoTrue siguiera
 * rechazando la sesión recién creada, para no ciclar entre el CRM y el
 * servidor central.
 */
export function salidaRecienteAlAcceso(ahora: number = Date.now()): boolean {
  try {
    const previo = Number(sessionStorage.getItem(CLAVE_DE_SESION_REVOCADA));
    return (
      Number.isFinite(previo) &&
      previo > 0 &&
      ahora - previo < ESPERA_ENTRE_SALIDAS_MS
    );
  } catch {
    return false;
  }
}

export function anotarSalidaAlAcceso(ahora: number = Date.now()): void {
  try {
    sessionStorage.setItem(CLAVE_DE_SESION_REVOCADA, String(ahora));
  } catch {
    // Sin sessionStorage (modo privado estricto) solo se pierde el freno.
  }
}

/**
 * Valida la sesión y, si GoTrue dice que ya no existe, la borra localmente.
 * Devuelve true en ese caso: quien llama debe limpiar sus cachés y mandar al
 * acceso normal. Nunca lanza.
 */
export async function descartarSesionSiFueRevocada(): Promise<boolean> {
  const estado = await consultarSesionEnGoTrue();
  if (estado !== "revocada") return false;
  if (salidaRecienteAlAcceso()) {
    console.warn(
      "KontrolIA Auth sigue rechazando la sesión justo después de entrar; no se vuelve a mandar al acceso.",
    );
    return false;
  }
  anotarSalidaAlAcceso();
  await cerrarSesionLocal();
  return true;
}

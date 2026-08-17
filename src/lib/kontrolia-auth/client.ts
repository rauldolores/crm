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

/**
 * Token de acceso de la sesión actual, o null si no hay.
 *
 * El singleton vive fuera de `<AuthProvider>` y por tanto sin su temporizador
 * de refresco automático, así que un token que llevaba rato sin usarse puede
 * llegar caducado al servidor. Se fuerza el refresco aquí cuando hace falta.
 */
export async function getKontroliaAccessToken(): Promise<string | null> {
  const c = getKontroliaClient();
  if (!c) return null;
  try {
    let token = await c.getToken();
    if (token && caducaOEstaPorCaducar(token)) {
      await c.refresh();
      token = await c.getToken();
    }
    return token;
  } catch {
    return null;
  }
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

/**
 * Cambia la organización activa. Fuerza un refresco del token para que
 * `organization_id`, `roles` y `permissions` reflejen la nueva, que es lo que
 * hace que el RLS empiece a devolver los datos de esa empresa.
 */
export async function switchKontroliaOrganization(
  organizationId: string,
): Promise<void> {
  const c = getKontroliaClient();
  if (!c) return;
  await c.switchOrganization(organizationId);
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

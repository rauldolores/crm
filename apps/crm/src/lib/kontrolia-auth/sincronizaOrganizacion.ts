/**
 * Sincroniza la organización del token con la organización activa global.
 *
 * KontrolIA Auth emite el claim `organization_id` a partir de
 * `kontrolia_auth.sessions_context.active_organization_id`: una sola fila por
 * usuario, compartida por todo el ecosistema, que se lee cada vez que se
 * emite o refresca un token. Si el usuario cambia de organización en otra
 * app (por ejemplo, el portal de su empresa), la fila cambia, pero el token
 * que ya tiene el CRM sigue diciendo la anterior hasta su próximo refresco
 * —hasta una hora—, y mientras tanto el CRM muestra los datos de la otra
 * empresa.
 *
 * Al cargar la aplicación se compara el token con esa fila; si no
 * coinciden, se refresca la sesión (el token nuevo trae la organización
 * activa) y quien llama limpia las cachés de la organización anterior y
 * recarga, igual que el selector de organización.
 *
 * Nunca lanza ni cierra la sesión: si algo falla, el CRM sigue como estaba
 * y el siguiente refresco normal del token acaba poniéndolo al día.
 */
import { decodeAccessToken } from "@kontrolia/auth";

import { getKontroliaClient } from "./client";
import { kontroliaAuthConfig } from "./config";

/**
 * Último intento, `${organización}:${milisegundos}`. Vive en sessionStorage
 * para sobrevivir a la recarga que sigue a una sincronización: si el token
 * refrescado no trae la organización esperada, no se vuelve a intentar en
 * bucle.
 */
export const CLAVE_DE_SINCRONIZACION = "kontrolia:org-sync";

/** No se reintenta la misma organización antes de este plazo. */
const ESPERA_ENTRE_INTENTOS_MS = 60_000;

/** Mismo plazo que el cambio de organización del selector (client.ts). */
const PLAZO_DE_REFRESCO_MS = 8000;

/** Rechaza si la promesa no resuelve dentro del plazo. */
const conPlazo = <T>(promesa: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promesa,
    new Promise<never>((_, rechazar) =>
      setTimeout(() => rechazar(new Error("Tiempo de espera agotado")), ms),
    ),
  ]);

/**
 * Organización activa del usuario según `kontrolia_auth.sessions_context`,
 * o null si no tiene o la consulta falla. La RLS de la tabla
 * (`user_id = auth.uid()`) solo deja ver la fila propia.
 */
export async function consultarOrganizacionActiva(
  token: string,
  usuarioId: string,
): Promise<string | null> {
  const base = kontroliaAuthConfig.supabaseUrl.replace(/\/$/, "");
  try {
    const respuesta = await fetch(
      `${base}/rest/v1/sessions_context?select=active_organization_id&user_id=eq.${encodeURIComponent(usuarioId)}`,
      {
        headers: {
          apikey: kontroliaAuthConfig.supabaseAnonKey,
          Authorization: `Bearer ${token}`,
          "Accept-Profile": "kontrolia_auth",
          Accept: "application/json",
        },
      },
    );
    if (!respuesta.ok) return null;
    const filas = (await respuesta.json()) as Array<{
      active_organization_id?: string | null;
    }>;
    return filas[0]?.active_organization_id ?? null;
  } catch {
    return null;
  }
}

/** true si ya se intentó sincronizar con esta organización hace poco. */
const intentadaHacePoco = (organizacionId: string): boolean => {
  try {
    const previo = sessionStorage.getItem(CLAVE_DE_SINCRONIZACION);
    if (!previo) return false;
    const separador = previo.lastIndexOf(":");
    const organizacion = previo.slice(0, separador);
    const cuando = Number(previo.slice(separador + 1));
    return (
      organizacion === organizacionId &&
      Number.isFinite(cuando) &&
      Date.now() - cuando < ESPERA_ENTRE_INTENTOS_MS
    );
  } catch {
    return false;
  }
};

const anotarIntento = (organizacionId: string) => {
  try {
    sessionStorage.setItem(
      CLAVE_DE_SINCRONIZACION,
      `${organizacionId}:${Date.now()}`,
    );
  } catch {
    // Sin sessionStorage (modo privado estricto) solo se pierde el freno.
  }
};

/**
 * Si el token trae otra organización que la activa, refresca la sesión.
 * Devuelve true solo si el token nuevo ya trae la organización activa: en
 * ese caso quien llama debe limpiar las cachés y recargar.
 */
export async function sincronizarOrganizacionActiva(): Promise<boolean> {
  try {
    const cliente = getKontroliaClient();
    if (!cliente) return false;

    const token = await cliente.getToken();
    const claims = token ? decodeAccessToken(token) : null;
    if (!token || !claims?.sub) return false;

    const activa = await consultarOrganizacionActiva(token, claims.sub);
    if (!activa || activa === claims.organization_id) return false;

    if (intentadaHacePoco(activa)) return false;
    anotarIntento(activa);

    // Igual que switchKontroliaOrganization: con plazo y un reintento.
    try {
      await conPlazo(cliente.refresh(), PLAZO_DE_REFRESCO_MS);
    } catch {
      await conPlazo(cliente.refresh(), PLAZO_DE_REFRESCO_MS);
    }

    const nuevo = await cliente.getToken();
    return Boolean(nuevo && decodeAccessToken(nuevo)?.organization_id === activa);
  } catch (error) {
    console.warn(
      "No se pudo sincronizar la organización activa con KontrolIA Auth",
      error,
    );
    return false;
  }
}

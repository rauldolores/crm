import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regresión del bucle de acceso del 2026-10-16 al 19.
 *
 * `logout()` devolvía SIEMPRE la URL del servidor central. `CoreAdminRoutes`
 * monta `<Route path="*" element={<LogoutOnMount/>}/>` como comodín para
 * visitantes anónimos, y `LogoutOnMount` llama a `logout()` sin destino, así
 * que ra-core usaba el que devolvía esta función. El resultado era un bucle:
 * raíz → /api/auth/logout del central → 307 de vuelta a la raíz → anónimo otra
 * vez → y así para siempre, sin llegar nunca a la pantalla de acceso.
 */

const getKontroliaAccessToken = vi.fn();
const logoutKontroliaAuth = vi.fn();
const urlDeSalidaCentral = vi.fn();
const isKontroliaAuthConfigured = vi.fn();

vi.mock("@/lib/kontrolia-auth/client", () => ({
  getKontroliaAccessToken: () => getKontroliaAccessToken(),
  getKontroliaClient: () => null,
  logoutKontroliaAuth: () => logoutKontroliaAuth(),
  urlDeSalidaCentral: () => urlDeSalidaCentral(),
}));

vi.mock("@/lib/kontrolia-auth/config", () => ({
  isKontroliaAuthConfigured: () => isKontroliaAuthConfigured(),
}));

vi.mock("ra-supabase-core", () => ({
  supabaseAuthProvider: () => ({
    logout: vi.fn(async () => undefined),
    checkAuth: vi.fn(async () => undefined),
    checkError: vi.fn(async () => undefined),
    getIdentity: vi.fn(async () => undefined),
    getPermissions: vi.fn(async () => undefined),
    login: vi.fn(async () => undefined),
  }),
}));

vi.mock("./supabase", () => ({ getSupabaseClient: () => ({}) }));
vi.mock("../commons/canAccess", () => ({ canAccess: () => true }));

const { getAuthProvider } = await import("./authProvider");

const URL_CENTRAL =
  "https://auth.kontrolia.io/api/auth/logout?redirect_to=https%3A%2F%2Fapp.vinqulia.com%2F";

beforeEach(() => {
  vi.clearAllMocks();
  isKontroliaAuthConfigured.mockReturnValue(true);
  urlDeSalidaCentral.mockReturnValue(URL_CENTRAL);
  logoutKontroliaAuth.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("authProvider.logout con acceso centralizado", () => {
  it("al pulsar «Salir» con sesión, manda al servidor central a cerrarla", async () => {
    getKontroliaAccessToken.mockResolvedValue("un-token-valido");

    const destino = await getAuthProvider().logout!({});

    // Dejar viva la sesión central dejaba la cuenta al siguiente que entrara
    // en esa computadora: el siguiente «Entrar» pasaba sin contraseña.
    expect(destino).toBe(URL_CENTRAL);
    expect(logoutKontroliaAuth).toHaveBeenCalled();
  });

  it("sin sesión NO manda al servidor central: ahí está el bucle", async () => {
    getKontroliaAccessToken.mockResolvedValue(null);

    const destino = await getAuthProvider().logout!({});

    // Devolver la URL aquí es lo que ciclaba la aplicación, porque la ruta
    // comodín de ra-core para anónimos llama a logout() sin destino propio.
    // Con undefined, ra-core usa su pantalla de acceso, que es la correcta.
    expect(destino).toBeUndefined();
  });

  it("cierra la sesión local aunque no haya nada que cerrar en el central", async () => {
    getKontroliaAccessToken.mockResolvedValue(null);

    await getAuthProvider().logout!({});

    expect(logoutKontroliaAuth).toHaveBeenCalled();
  });
});

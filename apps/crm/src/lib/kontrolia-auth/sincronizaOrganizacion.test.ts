import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./config", () => ({
  kontroliaAuthConfig: {
    supabaseUrl: "https://auth.supabase.co/",
    supabaseAnonKey: "anon",
  },
}));

vi.mock("./client", () => ({
  getKontroliaClient: vi.fn(),
}));

// El "token" es directamente la organización que trae: así cada prueba dice
// qué token devuelve el cliente antes y después de refrescar.
vi.mock("@kontrolia/auth", () => ({
  decodeAccessToken: vi.fn((token: string) => ({
    sub: "usuario-1",
    organization_id: token,
  })),
}));

import { getKontroliaClient } from "./client";
import {
  CLAVE_DE_SINCRONIZACION,
  consultarOrganizacionActiva,
  sincronizarOrganizacionActiva,
} from "./sincronizaOrganizacion";

const getClienteMock = vi.mocked(getKontroliaClient);

/** Cliente cuyo token pasa de `antes` a `despues` al refrescar. */
const clienteFalso = (antes: string, despues: string) => {
  let token = antes;
  const cliente = {
    getToken: vi.fn(async () => token),
    refresh: vi.fn(async () => {
      token = despues;
    }),
  };
  getClienteMock.mockReturnValue(
    cliente as unknown as ReturnType<typeof getKontroliaClient>,
  );
  return cliente;
};

/** sessions_context responde con esta organización activa. */
const organizacionActiva = (id: string | null) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => (id ? [{ active_organization_id: id }] : []),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

beforeEach(() => sessionStorage.removeItem(CLAVE_DE_SINCRONIZACION));
afterEach(() => {
  vi.unstubAllGlobals();
  getClienteMock.mockReset();
});

describe("consultarOrganizacionActiva", () => {
  it("lee la fila propia de kontrolia_auth.sessions_context con el token del usuario", async () => {
    const fetchMock = organizacionActiva("org-idi");

    const activa = await consultarOrganizacionActiva("tok", "usuario-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://auth.supabase.co/rest/v1/sessions_context?select=active_organization_id&user_id=eq.usuario-1",
    );
    expect(init.headers).toEqual({
      apikey: "anon",
      Authorization: "Bearer tok",
      "Accept-Profile": "kontrolia_auth",
      Accept: "application/json",
    });
    expect(activa).toBe("org-idi");
  });

  it("devuelve null si la consulta falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red")));
    expect(await consultarOrganizacionActiva("tok", "usuario-1")).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await consultarOrganizacionActiva("tok", "usuario-1")).toBeNull();
  });
});

describe("sincronizarOrganizacionActiva", () => {
  it("no refresca si el token ya trae la organización activa", async () => {
    const cliente = clienteFalso("org-a", "org-a");
    organizacionActiva("org-a");

    expect(await sincronizarOrganizacionActiva()).toBe(false);
    expect(cliente.refresh).not.toHaveBeenCalled();
  });

  it("no refresca si no hay organización activa registrada", async () => {
    const cliente = clienteFalso("org-a", "org-a");
    organizacionActiva(null);

    expect(await sincronizarOrganizacionActiva()).toBe(false);
    expect(cliente.refresh).not.toHaveBeenCalled();
  });

  it("refresca y devuelve true cuando el token nuevo trae la organización activa", async () => {
    const cliente = clienteFalso("org-a", "org-idi");
    organizacionActiva("org-idi");

    expect(await sincronizarOrganizacionActiva()).toBe(true);
    expect(cliente.refresh).toHaveBeenCalledTimes(1);
  });

  it("devuelve false si el refresco no trajo la organización activa", async () => {
    const cliente = clienteFalso("org-a", "org-a");
    organizacionActiva("org-idi");

    expect(await sincronizarOrganizacionActiva()).toBe(false);
    expect(cliente.refresh).toHaveBeenCalledTimes(1);
  });

  it("no lanza si el refresco falla dos veces", async () => {
    const cliente = clienteFalso("org-a", "org-a");
    cliente.refresh.mockRejectedValue(new Error("invalid_grant"));
    organizacionActiva("org-idi");
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await sincronizarOrganizacionActiva()).toBe(false);
    expect(cliente.refresh).toHaveBeenCalledTimes(2);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });

  it("no reintenta la misma organización antes de un minuto", async () => {
    const cliente = clienteFalso("org-a", "org-a");
    organizacionActiva("org-idi");

    await sincronizarOrganizacionActiva();
    expect(await sincronizarOrganizacionActiva()).toBe(false);
    expect(cliente.refresh).toHaveBeenCalledTimes(1);

    // Pasado el minuto, sí se vuelve a intentar.
    sessionStorage.setItem(
      CLAVE_DE_SINCRONIZACION,
      `org-idi:${Date.now() - 61_000}`,
    );
    await sincronizarOrganizacionActiva();
    expect(cliente.refresh).toHaveBeenCalledTimes(2);
  });

  it("sí intenta enseguida si la organización activa es otra", async () => {
    const cliente = clienteFalso("org-a", "org-a");
    sessionStorage.setItem(CLAVE_DE_SINCRONIZACION, `org-b:${Date.now()}`);
    organizacionActiva("org-idi");

    await sincronizarOrganizacionActiva();
    expect(cliente.refresh).toHaveBeenCalledTimes(1);
  });

  it("sin cliente configurado no hace nada", async () => {
    getClienteMock.mockReturnValue(null);
    const fetchMock = organizacionActiva("org-idi");

    expect(await sincronizarOrganizacionActiva()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

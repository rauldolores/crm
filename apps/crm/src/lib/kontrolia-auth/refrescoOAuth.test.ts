import { describe, expect, it, vi } from "vitest";

import { esRefrescoDeGoTrue, instalarRefrescoOAuth } from "./refrescoOAuth";

const SUPABASE = "https://proyecto.supabase.co";

const respuestaJson = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Un GoTrueClient de mentira: solo el `fetch` que el interceptor reemplaza. */
const clienteFalso = (fetchOriginal: typeof fetch) => {
  const cliente = { supabase: { auth: { fetch: fetchOriginal } } };
  instalarRefrescoOAuth(cliente, {
    supabaseUrl: SUPABASE,
    supabaseAnonKey: "anon",
    clientId: "cliente-1",
  });
  return cliente.supabase.auth;
};

describe("esRefrescoDeGoTrue", () => {
  it("reconoce el refresco de supabase-js y nada más", () => {
    expect(
      esRefrescoDeGoTrue(`${SUPABASE}/auth/v1/token?grant_type=refresh_token`),
    ).toBe(true);
    expect(
      esRefrescoDeGoTrue(`${SUPABASE}/auth/v1/token?grant_type=password`),
    ).toBe(false);
    expect(esRefrescoDeGoTrue(`${SUPABASE}/auth/v1/user`)).toBe(false);
    expect(esRefrescoDeGoTrue("no es una url")).toBe(false);
  });
});

describe("instalarRefrescoOAuth", () => {
  it("reescribe el refresco al servidor OAuth con client_id y devuelve la sesión con usuario", async () => {
    // Arrange
    const fetchOriginal = vi.fn(async (entrada: RequestInfo | URL) => {
      const url = String(entrada);
      if (url.endsWith("/auth/v1/oauth/token")) {
        return respuestaJson({
          access_token: "nuevo",
          refresh_token: "nuevo-refresh",
          expires_in: 3600,
          token_type: "bearer",
        });
      }
      if (url.endsWith("/auth/v1/user")) {
        return respuestaJson({ id: "usuario-1", email: "ana@empresa.com" });
      }
      throw new Error(`petición inesperada: ${url}`);
    }) as unknown as typeof fetch;
    const auth = clienteFalso(fetchOriginal);

    // Act: lo que manda supabase-js al refrescar.
    const respuesta = await auth.fetch(
      `${SUPABASE}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: { apikey: "anon" },
        body: JSON.stringify({ refresh_token: "viejo" }),
      },
    );

    // Assert
    const [url, init] = vi.mocked(fetchOriginal).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${SUPABASE}/auth/v1/oauth/token`);
    expect(init.method).toBe("POST");
    expect(String(init.body)).toBe(
      "grant_type=refresh_token&refresh_token=viejo&client_id=cliente-1",
    );
    expect(respuesta.ok).toBe(true);
    await expect(respuesta.json()).resolves.toEqual({
      access_token: "nuevo",
      refresh_token: "nuevo-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "usuario-1", email: "ana@empresa.com" },
    });
  });

  it("deja pasar sin tocar cualquier otra petición", async () => {
    const fetchOriginal = vi.fn(async () =>
      respuestaJson({ id: "usuario-1" }),
    ) as unknown as typeof fetch;
    const auth = clienteFalso(fetchOriginal);
    const init = { headers: { Authorization: "Bearer x" } };

    await auth.fetch(`${SUPABASE}/auth/v1/user`, init);

    expect(fetchOriginal).toHaveBeenCalledTimes(1);
    expect(fetchOriginal).toHaveBeenCalledWith(`${SUPABASE}/auth/v1/user`, init);
  });

  it("devuelve tal cual el error del servidor OAuth para que supabase-js lo vea", async () => {
    const fetchOriginal = vi.fn(async () =>
      respuestaJson({ error_code: "refresh_token_not_found" }, 400),
    ) as unknown as typeof fetch;
    const auth = clienteFalso(fetchOriginal);

    const respuesta = await auth.fetch(
      `${SUPABASE}/auth/v1/token?grant_type=refresh_token`,
      { method: "POST", body: JSON.stringify({ refresh_token: "viejo" }) },
    );

    expect(respuesta.status).toBe(400);
    // Con el error no se consulta el usuario.
    expect(fetchOriginal).toHaveBeenCalledTimes(1);
  });

  it("sigue devolviendo la sesión aunque no pueda cargar el usuario", async () => {
    const fetchOriginal = vi.fn(async (entrada: RequestInfo | URL) =>
      String(entrada).endsWith("/auth/v1/user")
        ? respuestaJson({ msg: "no" }, 500)
        : respuestaJson({
            access_token: "nuevo",
            refresh_token: "r",
            expires_in: 3600,
            token_type: "bearer",
          }),
    ) as unknown as typeof fetch;
    const auth = clienteFalso(fetchOriginal);

    const respuesta = await auth.fetch(
      `${SUPABASE}/auth/v1/token?grant_type=refresh_token`,
      { method: "POST", body: JSON.stringify({ refresh_token: "viejo" }) },
    );

    expect(respuesta.ok).toBe(true);
    await expect(respuesta.json()).resolves.toMatchObject({
      access_token: "nuevo",
      user: null,
    });
  });
});

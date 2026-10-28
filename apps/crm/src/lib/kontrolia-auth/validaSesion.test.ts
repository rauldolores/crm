import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({
  getKontroliaClient: vi.fn(),
}));

import { createClient } from "@supabase/supabase-js";

import { getKontroliaClient } from "./client";
import {
  CLAVE_DE_SESION_REVOCADA,
  consultarSesionEnGoTrue,
  descartarSesionSiFueRevocada,
  limitarFrecuencia,
  salidaRecienteAlAcceso,
  sesionRevocadaSegunError,
} from "./validaSesion";

const getClienteMock = vi.mocked(getKontroliaClient);

/** Cliente cuyo GoTrue responde `getUser` con lo que se le pase. */
const clienteFalso = (
  getUser: () => Promise<unknown>,
  token: string | null = "tok",
) => {
  const auth = {
    getUser: vi.fn(getUser),
    signOut: vi.fn(async () => ({ error: null })),
  };
  const cliente = {
    getToken: vi.fn(async () => token),
    refresh: vi.fn(),
    supabase: { auth },
  };
  getClienteMock.mockReturnValue(
    cliente as unknown as ReturnType<typeof getKontroliaClient>,
  );
  return { cliente, auth };
};

const respondeError = (error: object) => async () => ({
  data: { user: null },
  error,
});

beforeEach(() => sessionStorage.removeItem(CLAVE_DE_SESION_REVOCADA));
afterEach(() => {
  vi.useRealTimers();
  getClienteMock.mockReset();
});

describe("sesionRevocadaSegunError", () => {
  it.each([
    ["session_not_found (supabase-js lo convierte en AuthSessionMissingError)", { name: "AuthSessionMissingError", status: 400 }],
    ["session_not_found con código", { name: "AuthApiError", status: 403, code: "session_not_found" }],
    ["user_not_found", { name: "AuthApiError", status: 404, code: "user_not_found" }],
    ["bad_jwt", { name: "AuthApiError", status: 403, code: "bad_jwt" }],
    ["no_authorization", { name: "AuthApiError", status: 401, code: "no_authorization" }],
    ["401 sin código", { name: "AuthApiError", status: 401 }],
    ["403 sin código", { name: "AuthApiError", status: 403 }],
  ])("saca al usuario con %s", (_, error) => {
    expect(sesionRevocadaSegunError(error)).toBe(true);
  });

  it.each([
    ["sin error", null],
    ["error de red", { name: "AuthRetryableFetchError", status: 0 }],
    ["error de red con 502", { name: "AuthRetryableFetchError", status: 502 }],
    ["500", { name: "AuthApiError", status: 500 }],
    ["503", { name: "AuthUnknownError", status: 503 }],
    ["500 aunque traiga código de sesión", { name: "AuthApiError", status: 500, code: "session_not_found" }],
    ["429", { name: "AuthApiError", status: 429, code: "over_request_rate_limit" }],
    ["400 de otro tipo", { name: "AuthApiError", status: 400, code: "validation_failed" }],
    ["sin status", { name: "Error" }],
  ])("no saca al usuario con %s", (_, error) => {
    expect(sesionRevocadaSegunError(error)).toBe(false);
  });
});

describe("consultarSesionEnGoTrue", () => {
  it("pregunta a GoTrue con el token explícito, sin refrescar", async () => {
    const { cliente, auth } = clienteFalso(async () => ({
      data: { user: { id: "usuario-1" } },
      error: null,
    }));

    expect(await consultarSesionEnGoTrue()).toBe("valida");
    expect(auth.getUser).toHaveBeenCalledWith("tok");
    expect(cliente.refresh).not.toHaveBeenCalled();
  });

  it("revocada cuando GoTrue dice session_not_found", async () => {
    clienteFalso(respondeError({ name: "AuthSessionMissingError", status: 400 }));
    expect(await consultarSesionEnGoTrue()).toBe("revocada");
  });

  it("desconocido ante un 5xx", async () => {
    clienteFalso(respondeError({ name: "AuthApiError", status: 503 }));
    expect(await consultarSesionEnGoTrue()).toBe("desconocido");
  });

  it("desconocido si getUser lanza", async () => {
    clienteFalso(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await consultarSesionEnGoTrue()).toBe("desconocido");
  });

  it("desconocido si GoTrue no contesta en 5 s", async () => {
    vi.useFakeTimers();
    clienteFalso(() => new Promise(() => {}));

    const resultado = consultarSesionEnGoTrue();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await resultado).toBe("desconocido");
  });

  it("sin sesión no consulta nada", async () => {
    const { auth } = clienteFalso(async () => ({}), null);
    expect(await consultarSesionEnGoTrue()).toBe("desconocido");
    expect(auth.getUser).not.toHaveBeenCalled();
  });

  it("sin cliente configurado no consulta nada", async () => {
    getClienteMock.mockReturnValue(null);
    expect(await consultarSesionEnGoTrue()).toBe("desconocido");
  });
});

describe("descartarSesionSiFueRevocada", () => {
  it("con sesión revocada borra SOLO la sesión local y devuelve true", async () => {
    const { auth } = clienteFalso(
      respondeError({ name: "AuthApiError", status: 403, code: "session_not_found" }),
    );

    expect(await descartarSesionSiFueRevocada()).toBe(true);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("con sesión válida no toca nada", async () => {
    const { auth } = clienteFalso(async () => ({
      data: { user: { id: "usuario-1" } },
      error: null,
    }));

    expect(await descartarSesionSiFueRevocada()).toBe(false);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("ante un error transitorio no toca nada", async () => {
    const { auth } = clienteFalso(
      respondeError({ name: "AuthApiError", status: 429 }),
    );

    expect(await descartarSesionSiFueRevocada()).toBe(false);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("devuelve true aunque borrar la sesión local falle", async () => {
    const { auth } = clienteFalso(
      respondeError({ name: "AuthSessionMissingError", status: 400 }),
    );
    auth.signOut.mockRejectedValue(new Error("lock"));

    expect(await descartarSesionSiFueRevocada()).toBe(true);
  });

  it("no vuelve a mandar al acceso antes de un minuto (sin bucles)", async () => {
    const { auth } = clienteFalso(
      respondeError({ name: "AuthSessionMissingError", status: 400 }),
    );
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await descartarSesionSiFueRevocada()).toBe(true);
    expect(await descartarSesionSiFueRevocada()).toBe(false);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();

    // Pasado el minuto, sí.
    sessionStorage.setItem(
      CLAVE_DE_SESION_REVOCADA,
      String(Date.now() - 61_000),
    );
    expect(await descartarSesionSiFueRevocada()).toBe(true);
  });
});

// Con el cliente real de supabase-js y solo `fetch` simulado: supabase-js no
// entrega `session_not_found` como `error.code`, lo convierte en
// `AuthSessionMissingError` (status 400, sin código). Estas pruebas fijan que
// el caso del bug (logout global en el portal) de verdad saca al usuario.
describe("con el cliente real de supabase-js", () => {
  const conGoTrue = (respuesta: () => Response) => {
    const fetchMock = vi.fn(async (..._: unknown[]) => respuesta());
    const supabase = createClient("https://auth.supabase.co", "anon", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchMock as unknown as typeof fetch },
    });
    const cliente = {
      getToken: vi.fn(async () => "tok"),
      refresh: vi.fn(),
      supabase,
    };
    getClienteMock.mockReturnValue(
      cliente as unknown as ReturnType<typeof getKontroliaClient>,
    );
    return { fetchMock, cliente };
  };

  const json = (status: number, cuerpo: object, headers = {}) =>
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    });

  it("403 session_not_found (respuesta de los logs de GoTrue) → revocada", async () => {
    const { fetchMock, cliente } = conGoTrue(() =>
      json(403, {
        code: 403,
        error_code: "session_not_found",
        msg: "Session from session_id claim in JWT does not exist",
      }),
    );

    expect(await consultarSesionEnGoTrue()).toBe("revocada");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://auth.supabase.co/auth/v1/user");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
    expect(cliente.refresh).not.toHaveBeenCalled();
  });

  it("403 session_not_found con API 2024-01-01 → revocada", async () => {
    conGoTrue(() =>
      json(
        403,
        { code: "session_not_found", message: "Session not found" },
        { "X-Supabase-Api-Version": "2024-01-01" },
      ),
    );
    expect(await consultarSesionEnGoTrue()).toBe("revocada");
  });

  it("descartarSesionSiFueRevocada saca al usuario sin pedir logout al servidor", async () => {
    const { fetchMock } = conGoTrue(() =>
      json(403, { code: 403, error_code: "session_not_found", msg: "x" }),
    );

    expect(await descartarSesionSiFueRevocada()).toBe(true);
    // Solo la consulta de /user: signOut({ scope: "local" }) no toca el
    // servidor central ni la sesión de la cuenta nueva.
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/logout"))).toBe(false);
  });

  it("200 con usuario → valida", async () => {
    conGoTrue(() => json(200, { id: "usuario-1", aud: "authenticated" }));
    expect(await consultarSesionEnGoTrue()).toBe("valida");
  });

  it("503 → desconocido", async () => {
    conGoTrue(() => json(503, { msg: "upstream" }));
    expect(await consultarSesionEnGoTrue()).toBe("desconocido");
  });

  it("429 → desconocido", async () => {
    conGoTrue(() =>
      json(429, { code: 429, error_code: "over_request_rate_limit", msg: "x" }),
    );
    expect(await consultarSesionEnGoTrue()).toBe("desconocido");
  });

  it("fallo de red → desconocido", async () => {
    conGoTrue(() => {
      throw new TypeError("Failed to fetch");
    });
    expect(await consultarSesionEnGoTrue()).toBe("desconocido");
  });
});

describe("salidaRecienteAlAcceso", () => {
  it("es false sin salida anotada o con un valor ilegible", () => {
    expect(salidaRecienteAlAcceso()).toBe(false);
    sessionStorage.setItem(CLAVE_DE_SESION_REVOCADA, "basura");
    expect(salidaRecienteAlAcceso()).toBe(false);
  });
});

describe("limitarFrecuencia", () => {
  it("deja pasar como mucho una vez por intervalo", () => {
    let ahora = 1_000_000;
    const toca = limitarFrecuencia(30_000, () => ahora);

    expect(toca()).toBe(true);
    ahora += 29_999;
    expect(toca()).toBe(false);
    ahora += 1;
    expect(toca()).toBe(true);
    expect(toca()).toBe(false);
  });
});

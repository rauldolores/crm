import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { kontroliaAuthServerUrl: "https://auth.kontrolia.io" },
}));

vi.mock("./client", () => ({
  getKontroliaAccessToken: vi.fn(),
}));

vi.mock("@kontrolia/auth", () => ({
  decodeAccessToken: vi.fn(),
}));

import { decodeAccessToken } from "@kontrolia/auth";
import { getKontroliaAccessToken } from "./client";
import {
  invitarATuOrganizacion,
  listarRolesDisponibles,
  organizacionActivaId,
} from "./equipo";

const getTokenMock = vi.mocked(getKontroliaAccessToken);
const decodeMock = vi.mocked(decodeAccessToken);

/** Deja `fetch` mockeado y devuelve la petición que se hizo. */
const capturarPeticion = (respuesta: Partial<Response> = { ok: true }) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    ...respuesta,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
  getTokenMock.mockReset();
  decodeMock.mockReset();
});

describe("organizacionActivaId", () => {
  it("es null sin sesión", async () => {
    getTokenMock.mockResolvedValue(null);

    const resultado = await organizacionActivaId();

    expect(resultado).toBeNull();
  });

  it("lee organization_id del token decodificado", async () => {
    getTokenMock.mockResolvedValue("un-token");
    decodeMock.mockReturnValue({ organization_id: "org-1" } as never);

    const resultado = await organizacionActivaId();

    expect(resultado).toBe("org-1");
  });
});

describe("listarRolesDisponibles", () => {
  it("consulta /api/roles con el token del usuario y la organización en la query", async () => {
    getTokenMock.mockResolvedValue("token-de-usuario");
    const fetchMock = capturarPeticion({
      json: async () => [{ id: "r1", name: "Administrador" }],
    });

    const roles = await listarRolesDisponibles("org-1");

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://auth.kontrolia.io/api/roles?organizationId=org-1",
    );
    expect(opciones.headers.Authorization).toBe("Bearer token-de-usuario");
    expect(roles).toEqual([{ id: "r1", name: "Administrador" }]);
  });

  it("lanza si no hay sesión, sin llamar a fetch", async () => {
    getTokenMock.mockResolvedValue(null);
    const fetchMock = capturarPeticion();

    await expect(listarRolesDisponibles("org-1")).rejects.toThrow();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lanza si la respuesta no es exitosa", async () => {
    getTokenMock.mockResolvedValue("token-de-usuario");
    capturarPeticion({ ok: false, status: 403 });

    await expect(listarRolesDisponibles("org-1")).rejects.toThrow();
  });
});

describe("invitarATuOrganizacion", () => {
  it("envía POST /api/invitations con el token del usuario y el cuerpo esperado, sin API key", async () => {
    getTokenMock.mockResolvedValue("token-de-usuario");
    const fetchMock = capturarPeticion();

    await invitarATuOrganizacion({
      organizationId: "org-1",
      email: "nuevo@empresa.com",
      roleId: "r1",
    });

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://auth.kontrolia.io/api/invitations");
    expect(opciones.method).toBe("POST");
    expect(opciones.headers.Authorization).toBe("Bearer token-de-usuario");
    expect(opciones.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opciones.body)).toEqual({
      organizationId: "org-1",
      email: "nuevo@empresa.com",
      roleId: "r1",
    });
  });

  it("lanza con el mensaje del servidor cuando la respuesta no es exitosa", async () => {
    getTokenMock.mockResolvedValue("token-de-usuario");
    capturarPeticion({
      ok: false,
      status: 409,
      json: async () => ({ message: "Ya existe una invitación pendiente." }),
    });

    await expect(
      invitarATuOrganizacion({
        organizationId: "org-1",
        email: "nuevo@empresa.com",
        roleId: "r1",
      }),
    ).rejects.toThrow("Ya existe una invitación pendiente.");
  });
});

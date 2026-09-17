import { describe, expect, it, vi } from "vitest";

import {
  crearOrganizacionEnKontroliaAuth,
  slugDeOrganizacion,
  subDelToken,
} from "./crearOrganizacion";

const AUTH = "https://auth.kontrolia.io";
const APP = { id: "app-crm", name: "Vinqulia", slug: "crm" };

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Un auth-server de mentira que responde a cada paso de la secuencia y
 * registra lo que recibió. `fallaEn` hace fallar un paso concreto.
 */
const authServerFalso = (fallaEn?: string) => {
  const llamadas: { url: string; method: string; body: unknown }[] = [];
  const fetchFalso = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada).replace(AUTH, "");
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    llamadas.push({ url, method, body });
    if (fallaEn && url.startsWith(fallaEn) && method !== "GET") {
      return json({ error: `falló ${url}` }, 400);
    }
    if (url === "/api/organizations" && method === "POST") {
      return json(
        { organization: { id: "org-nueva", name: body.name, slug: body.slug } },
        201,
      );
    }
    if (url === "/api/applications") return json({ applications: [APP] });
    if (url === "/api/organizations/org-nueva/applications") {
      return new Response(null, { status: 201 });
    }
    if (url.startsWith("/api/roles?")) {
      return json({
        roles: [
          { id: "rol-owner", slug: "owner", application_id: null },
          { id: "rol-admin", slug: "admin-crm", application_id: "app-crm" },
        ],
      });
    }
    if (url === "/api/roles" && method === "POST") {
      return json({ role: { id: "rol-usuario" } }, 201);
    }
    if (url.startsWith("/api/organization-members?")) {
      return json({
        members: [
          { membershipId: "mem-otro", userId: "otro" },
          { membershipId: "mem-yo", userId: "yo" },
        ],
      });
    }
    if (url === "/api/organization-members/roles") {
      return new Response(null, { status: 201 });
    }
    throw new Error(`petición inesperada: ${method} ${url}`);
  }) as unknown as typeof fetch;
  return { fetchFalso, llamadas };
};

const deps = (fetchFalso: typeof fetch) => ({
  authServerUrl: AUTH,
  applicationSlug: "crm",
  token: "token-de-usuario",
  userId: "yo",
  fetch: fetchFalso,
});

describe("slugDeOrganizacion", () => {
  it("normaliza el nombre y añade el sufijo aleatorio", () => {
    expect(slugDeOrganizacion("  Panadería Ñandú & Cía. ", "abc123")).toBe(
      "panaderia-nandu-cia-abc123",
    );
  });

  it("cae a «org» si el nombre no deja nada útil", () => {
    expect(slugDeOrganizacion("¡¡¡", "abc123")).toBe("org-abc123");
  });
});

describe("subDelToken", () => {
  it("lee el sub de un JWT sin verificar la firma", () => {
    const payload = btoa(JSON.stringify({ sub: "u-1" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(subDelToken(`cabecera.${payload}.firma`)).toBe("u-1");
    expect(subDelToken("no-es-un-jwt")).toBeNull();
  });
});

describe("crearOrganizacionEnKontroliaAuth", () => {
  it("crea la organización, habilita la app, asigna el rol de administrador al creador y crea el rol de usuario", async () => {
    // Arrange
    const { fetchFalso, llamadas } = authServerFalso();

    // Act
    const resultado = await crearOrganizacionEnKontroliaAuth(
      "Mi empresa",
      deps(fetchFalso),
    );

    // Assert
    expect(resultado).toEqual({
      organizacion: {
        id: "org-nueva",
        nombre: "Mi empresa",
        slug: expect.stringMatching(/^mi-empresa-[0-9a-f]{6}$/),
      },
    });
    expect(llamadas.map((l) => `${l.method} ${l.url.split("?")[0]}`)).toEqual([
      "POST /api/organizations",
      "GET /api/applications",
      "POST /api/organizations/org-nueva/applications",
      "GET /api/roles",
      "GET /api/organization-members",
      "POST /api/organization-members/roles",
      "POST /api/roles",
    ]);
    expect(llamadas[2].body).toEqual({ applicationId: "app-crm" });
    // El rol de administrador va a MI membresía, no a la de otro.
    expect(llamadas[5].body).toEqual({
      membershipId: "mem-yo",
      roleId: "rol-admin",
    });
    expect(llamadas[6].body).toEqual({
      organizationId: "org-nueva",
      applicationId: "app-crm",
      name: "Usuario de Vinqulia",
    });
    // Siempre con el token del usuario, nunca una API key.
    const init = vi.mocked(fetchFalso).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer token-de-usuario",
    );
  });

  it("propaga el error del auth-server si no se puede crear la organización", async () => {
    const { fetchFalso } = authServerFalso("/api/organizations");

    await expect(
      crearOrganizacionEnKontroliaAuth("Mi empresa", deps(fetchFalso)),
    ).rejects.toThrow("falló /api/organizations");
  });

  it("devuelve la organización con aviso si falla un paso posterior a crearla", async () => {
    const { fetchFalso } = authServerFalso(
      "/api/organizations/org-nueva/applications",
    );

    const resultado = await crearOrganizacionEnKontroliaAuth(
      "Mi empresa",
      deps(fetchFalso),
    );

    expect(resultado.organizacion.id).toBe("org-nueva");
    expect(resultado.aviso).toBe(
      "falló /api/organizations/org-nueva/applications",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// La clave de API se resuelve contra la base; aquí se simula esa búsqueda.
const organizacionDeClaveDeApi = vi.fn();
vi.mock("@/lib/server/apiKeys", () => ({
  PREFIJO_CLAVE_DE_API: "vnq_",
  organizacionDeClaveDeApi: (clave: string) => organizacionDeClaveDeApi(clave),
}));
vi.mock("@/lib/kontrolia-auth/config", () => ({
  kontroliaAuthConfig: { supabaseUrl: "https://auth.ejemplo.test" },
}));

import { validateToken } from "./auth";

const conBearer = (token: string) =>
  new Request("https://crm.ejemplo.test/api/mcp", {
    headers: { authorization: `Bearer ${token}` },
  });

describe("validateToken con clave de API", () => {
  beforeEach(() => organizacionDeClaveDeApi.mockReset());

  it("una clave activa entra con los claims de su organización", async () => {
    // Un agente que corre solo, 24/7, no puede colgar de la sesión de una
    // persona: cada "cerrar sesión" global le borraba el acceso al CRM.
    organizacionDeClaveDeApi.mockResolvedValue("org-1");

    const info = await validateToken(conBearer("vnq_abc"));

    expect(info).toMatchObject({
      viaClaveDeApi: true,
      organizationId: "org-1",
      userId: "clave-de-api:org-1",
    });
    // Es TODO lo que mira RLS (crm.current_organization_id()): sin sub, lo
    // que escriba queda sin responsable, igual que por /api/datos.
    expect(info?.claims).toEqual({
      role: "authenticated",
      organization_id: "org-1",
    });
  });

  it("una clave revocada o inexistente no entra", async () => {
    organizacionDeClaveDeApi.mockResolvedValue(null);
    expect(await validateToken(conBearer("vnq_revocada"))).toBeNull();
  });

  it("sin cabecera o con otro esquema, no entra", async () => {
    expect(
      await validateToken(new Request("https://crm.ejemplo.test/api/mcp")),
    ).toBeNull();
    expect(
      await validateToken(
        new Request("https://crm.ejemplo.test/api/mcp", {
          headers: { authorization: "Basic vnq_abc" },
        }),
      ),
    ).toBeNull();
    expect(organizacionDeClaveDeApi).not.toHaveBeenCalled();
  });

  it("un token que no es clave ni JWT válido no entra (no se consulta como clave)", async () => {
    expect(await validateToken(conBearer("cualquier-cosa"))).toBeNull();
    expect(organizacionDeClaveDeApi).not.toHaveBeenCalled();
  });
});

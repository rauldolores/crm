import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@kontrolia/auth/server", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: { kontroliaApplicationSlug: "crm" },
}));

vi.mock("./exigirCupoDeUsuario", () => ({
  exigirCupoDeUsuario: vi.fn().mockResolvedValue(null),
}));

import { requirePermission } from "@kontrolia/auth/server";
import { requireKontroliaPermission } from "./requireKontroliaPermission";

const requirePermissionMock = vi.mocked(requirePermission);

const peticion = new Request("https://crm.kontrolia.io/api/lo-que-sea", {
  headers: { authorization: "Bearer token-de-prueba" },
});

/**
 * KontrolIA Auth es compartido por todo el ecosistema: tener una sesión
 * válida ahí (organization_id presente) no dice nada sobre si ESA
 * organización tiene el CRM contratado. Estas pruebas cubren el bug real:
 * un usuario de otra aplicación (aquí, Faqturia) entraba igual porque las
 * rutas pedían el permiso `[]`, que el checker del SDK trata como "no
 * compruebes nada".
 */
describe("requireKontroliaPermission: acceso a la aplicación", () => {
  beforeEach(() => {
    requirePermissionMock.mockReset();
  });

  it("rechaza una sesión válida sin ningún permiso crm.*", async () => {
    // Arrange: organización activa, pero solo con permisos de otra app.
    requirePermissionMock.mockResolvedValue({
      claims: {
        sub: "usuario-1",
        organization_id: "org-1",
        roles: ["owner"],
        permissions: ["facturacion.suscripciones.ver"],
      },
    } as never);

    // Act
    const resultado = await requireKontroliaPermission(peticion, []);

    // Assert
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.response.status).toBe(403);
    }
  });

  it("rechaza una sesión sin ningún permiso en absoluto", async () => {
    requirePermissionMock.mockResolvedValue({
      claims: {
        sub: "usuario-1",
        organization_id: "org-1",
        roles: [],
        permissions: [],
      },
    } as never);

    const resultado = await requireKontroliaPermission(peticion, []);

    expect(resultado.ok).toBe(false);
  });

  it("acepta una sesión con al menos un permiso crm.*", async () => {
    requirePermissionMock.mockResolvedValue({
      claims: {
        sub: "usuario-1",
        organization_id: "org-1",
        roles: ["admin-crm"],
        permissions: ["crm.contactos.ver", "facturacion.suscripciones.ver"],
      },
    } as never);

    const resultado = await requireKontroliaPermission(peticion, []);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.sesion.organizacionId).toBe("org-1");
      expect(resultado.sesion.permisos).toContain("crm.contactos.ver");
    }
  });

  it("no deja pasar aunque la ruta pida un permiso concreto y distinto de crm.*", async () => {
    // La comprobación de la aplicación es independiente del `permiso` que
    // pida cada ruta: aunque el SDK ya haya validado ese permiso concreto,
    // sigue haciendo falta al menos una clave crm.* en el token.
    requirePermissionMock.mockResolvedValue({
      claims: {
        sub: "usuario-1",
        organization_id: "org-1",
        roles: ["algun-rol"],
        permissions: ["otraApp.recurso.ver"],
      },
    } as never);

    const resultado = await requireKontroliaPermission(
      peticion,
      "otraApp.recurso.ver",
    );

    expect(resultado.ok).toBe(false);
  });

  it("deja pasar al personal de KontrolIA Auth (is_platform_admin) aunque no tenga ningún permiso crm.*", async () => {
    // El caso real reportado: el panel de KontrolIA Auth le dice a esa
    // cuenta que tiene acceso a todo, pero ese acceso viaja en
    // is_platform_admin — un claim aparte que ningún catálogo de permisos
    // de esta aplicación puede otorgar.
    requirePermissionMock.mockResolvedValue({
      claims: {
        sub: "usuario-1",
        organization_id: "org-1",
        roles: ["owner"],
        permissions: ["facturacion.suscripciones.ver"],
        is_platform_admin: true,
      },
    } as never);

    const resultado = await requireKontroliaPermission(peticion, []);

    expect(resultado.ok).toBe(true);
  });
});

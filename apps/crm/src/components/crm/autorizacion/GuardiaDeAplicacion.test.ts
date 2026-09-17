import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { kontroliaApplicationSlug: "crm" },
}));

import {
  decidirSinPermiso,
  tieneAccesoALaApp,
  tienePermisoDeLaApp,
} from "./GuardiaDeAplicacion";

describe("tienePermisoDeLaApp", () => {
  it("es falso sin ningún permiso", () => {
    expect(tienePermisoDeLaApp([])).toBe(false);
  });

  it("es falso con permisos de otra aplicación del ecosistema", () => {
    // El caso real: un token válido de KontrolIA Auth, pero solo con
    // permisos de Faqturia, no del CRM.
    expect(
      tienePermisoDeLaApp([
        "facturacion.suscripciones.ver",
        "facturacion.facturas.crear",
      ]),
    ).toBe(false);
  });

  it("es verdadero con al menos un permiso crm.*, aunque haya otros de más aplicaciones", () => {
    expect(
      tienePermisoDeLaApp([
        "facturacion.suscripciones.ver",
        "crm.contactos.ver",
      ]),
    ).toBe(true);
  });

  it("no confunde un recurso que empieza igual con el prefijo real", () => {
    // "crmx.algo" no es "crm." — el prefijo lleva el punto para no hacer
    // match parcial de nombres de aplicación.
    expect(tienePermisoDeLaApp(["crmx.contactos.ver"])).toBe(false);
  });
});

describe("tieneAccesoALaApp", () => {
  it("es falso sin claims", () => {
    expect(tieneAccesoALaApp(null)).toBe(false);
  });

  it("es falso con permisos de otra app y sin ser admin de la plataforma", () => {
    expect(
      tieneAccesoALaApp({ permissions: ["facturacion.suscripciones.ver"] }),
    ).toBe(false);
  });

  it("es verdadero con un permiso crm.*", () => {
    expect(tieneAccesoALaApp({ permissions: ["crm.contactos.ver"] })).toBe(
      true,
    );
  });

  it("es verdadero para el personal de KontrolIA Auth (is_platform_admin), aunque no traiga ningún permiso crm.*", () => {
    // El caso real reportado: el panel de KontrolIA Auth dice "acceso a
    // todo", pero ese acceso viaja en is_platform_admin, no en
    // `permissions` — un catálogo de esta aplicación no puede otorgarlo.
    expect(
      tieneAccesoALaApp({
        permissions: ["facturacion.suscripciones.ver"],
        is_platform_admin: true,
      }),
    ).toBe(true);
  });

  it("is_platform_admin en false no otorga nada por sí solo", () => {
    expect(
      tieneAccesoALaApp({ permissions: [], is_platform_admin: false }),
    ).toBe(false);
  });
});

describe("decidirSinPermiso", () => {
  // El caso que motiva esto: una organización recién creada desde el CRM
  // (o una que dejó vencer su plan) no trae permisos crm.* en el token
  // porque el hook los quita sin plan vigente — pero su sitio es «elige tu
  // plan», no «sin acceso».
  it("deja al bloqueo por plan una organización que exige plan y no lo tiene", () => {
    expect(
      decidirSinPermiso(
        { plansRequired: true, access: "no_subscription" },
        null,
        true,
      ),
    ).toBe("dejar_al_plan");
    expect(
      decidirSinPermiso({ plansRequired: true, access: "expired" }, null, true),
    ).toBe("dejar_al_plan");
  });

  it("bloquea si la organización tiene plan vigente y aun así no hay permisos: no usa esta app", () => {
    expect(
      decidirSinPermiso({ plansRequired: true, access: "ok" }, null, true),
    ).toBe("sin_acceso");
    expect(
      decidirSinPermiso({ plansRequired: false, access: "ok" }, null, true),
    ).toBe("sin_acceso");
  });

  it("espera a conocer los derechos antes de decidir", () => {
    expect(decidirSinPermiso(null, null, true)).toBe("esperar");
  });

  it("bloquea sin esperar si los derechos no llegan o la instalación no tiene planes", () => {
    expect(decidirSinPermiso(null, "Sin respuesta", true)).toBe("sin_acceso");
    expect(decidirSinPermiso(null, null, false)).toBe("sin_acceso");
  });
});

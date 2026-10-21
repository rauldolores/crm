import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ajustarModuloDeFamilia } from "./modulos";

/**
 * Regresión del botón que no podía cumplir: el módulo de Facturación se
 * encendía a mano, sin relación con el conector, así que «Emitir factura»
 * aparecía en la cotización aunque no hubiera proveedor y fallaba con un 404
 * al pulsarlo.
 */

const ORG = "11111111-1111-1111-1111-111111111111";

let configuracion: Record<string, unknown> | null;
const update = vi.fn();

vi.mock("../supabase-service", () => ({
  getServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { config: configuracion } }),
        }),
      }),
      update: (valores: Record<string, unknown>) => {
        update(valores);
        return { eq: async () => ({ error: null }) };
      },
    }),
  }),
}));

beforeEach(() => {
  update.mockReset();
  configuracion = { title: "Vinqulia", modules: {} };
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ajustarModuloDeFamilia", () => {
  it("enciende el módulo al conectar, sin tocar el resto de la configuración", async () => {
    configuracion = { title: "Vinqulia", modules: { customers: { active: true } } };

    await ajustarModuloDeFamilia(ORG, "invoicing", true);

    expect(update).toHaveBeenCalledWith({
      config: {
        title: "Vinqulia",
        modules: {
          customers: { active: true },
          invoicing: { active: true },
        },
      },
    });
  });

  it("lo apaga al desconectar", async () => {
    configuracion = { modules: { invoicing: { active: true } } };

    await ajustarModuloDeFamilia(ORG, "invoicing", false);

    expect(update.mock.calls[0][0].config.modules.invoicing).toEqual({
      active: false,
    });
  });

  it("no escribe si ya estaba como debe", async () => {
    configuracion = { modules: { products: { active: true } } };

    await ajustarModuloDeFamilia(ORG, "products", true);

    // Conectar dos veces seguidas no debe escribir la configuración dos veces.
    expect(update).not.toHaveBeenCalled();
  });

  it("conserva lo que el módulo tuviera guardado además de `active`", async () => {
    configuracion = { modules: { invoicing: { active: false, nota: "x" } } };

    await ajustarModuloDeFamilia(ORG, "invoicing", true);

    expect(update.mock.calls[0][0].config.modules.invoicing).toEqual({
      active: true,
      nota: "x",
    });
  });

  it("nunca hace fallar la conexión: el conector ya quedó guardado", async () => {
    configuracion = null;
    update.mockImplementation(() => {
      throw new Error("base caída");
    });

    await expect(
      ajustarModuloDeFamilia(ORG, "invoicing", true),
    ).resolves.toBeUndefined();
  });
});

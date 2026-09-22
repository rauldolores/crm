import type { DataProvider } from "ra-core";
import { describe, expect, it, vi } from "vitest";

import type { Deal } from "../types";
import { ingresoAsociado } from "./ingresoAsociado";

const oportunidad = {
  id: 1,
  name: "Demo Tecmilenio",
  company_id: 17,
} as unknown as Deal;

/** Un proveedor que solo sabe decir qué recursos tienen filas. */
const proveedorCon = (conFilas: string[]): DataProvider =>
  ({
    getList: vi.fn(async (recurso: string) => ({
      data: conFilas.includes(recurso) ? [{ id: 1 }] : [],
      total: conFilas.includes(recurso) ? 1 : 0,
    })),
  }) as unknown as DataProvider;

describe("ingresoAsociado", () => {
  it("vale una cotización aceptada de la oportunidad", async () => {
    expect(await ingresoAsociado(proveedorCon(["quotes"]), oportunidad)).toBe(
      "quote",
    );
  });

  it("vale un contrato o una compra de la empresa", async () => {
    expect(
      await ingresoAsociado(proveedorCon(["contracts"]), oportunidad),
    ).toBe("contract");
    expect(
      await ingresoAsociado(proveedorCon(["purchases"]), oportunidad),
    ).toBe("purchase");
  });

  it("sin nada de eso, no hay ingreso que respalde la venta", async () => {
    expect(await ingresoAsociado(proveedorCon([]), oportunidad)).toBeNull();
  });

  it("solo cuenta la cotización aceptada, no una enviada", async () => {
    const dataProvider = proveedorCon(["quotes"]);
    await ingresoAsociado(dataProvider, oportunidad);
    expect(dataProvider.getList).toHaveBeenCalledWith(
      "quotes",
      expect.objectContaining({
        filter: { deal_id: 1, status: "accepted" },
      }),
    );
  });

  it("una oportunidad sin empresa solo puede apoyarse en su cotización", async () => {
    const dataProvider = proveedorCon(["contracts", "purchases"]);
    const sinEmpresa = { ...oportunidad, company_id: null } as unknown as Deal;

    expect(await ingresoAsociado(dataProvider, sinEmpresa)).toBeNull();
    expect(dataProvider.getList).toHaveBeenCalledTimes(1);
  });

  it("si la consulta falla, no bloquea el movimiento", async () => {
    const dataProvider = {
      getList: vi.fn(async () => {
        throw new Error("sin red");
      }),
    } as unknown as DataProvider;

    expect(await ingresoAsociado(dataProvider, oportunidad)).toBe("quote");
  });
});

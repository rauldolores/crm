import { describe, expect, it, vi } from "vitest";

import { estadoDeAccesoAlPagar } from "./acceso";
import { AJUSTES_POR_OMISION } from "./ajustes";
import {
  AvisoDeExcedente,
  facturaDeExcedente,
  finIncluido,
  importeCuadra,
  notaDelConsumo,
  planearFacturaDeExcedente,
  referenciaDelExcedente,
} from "./excedente";
import { notaDelPeriodo, type Db } from "./guardar";
import type { ContratoAFacturar, EmpresaFiscal } from "./tipos";

const ORG = "11111111-1111-1111-1111-111111111111";
const ORG_AUTH = "22222222-2222-2222-2222-222222222222";

const contrato: ContratoAFacturar = {
  id: 7,
  company_id: 4,
  name: "AduaniaX · IMMEX",
  status: "active",
  billing_period: "monthly",
  amount: 34000,
  currency: "MXN",
  renews_on: "2026-11-01",
  provider: "manual",
  application_slug: "aduaniax",
  plan_name: "IMMEX",
  addons: [],
  billing_enabled: true,
};

const empresa: EmpresaFiscal = {
  id: 4,
  name: "Maquila del Norte",
  tax_identifier: "MNO010101AB1",
  tax_regime: "601",
  cfdi_use: "G03",
  zipcode: "64000",
  sales_id: 2,
};

const aviso = (datos: Record<string, unknown> = {}) =>
  AvisoDeExcedente.parse({
    id: "evt-9",
    type: "usage.overage",
    occurred_at: "2026-11-01T06:00:00Z",
    organization_id: ORG_AUTH,
    application: { id: "app-1", slug: "aduaniax", name: "AduaniaX" },
    data: {
      closure_id: "cl-123",
      subscription_id: "sub-1",
      limit_key: "ctm_paginas",
      description: "páginas CTM",
      period_start: "2026-10-01",
      period_end: "2026-10-31",
      used: 260,
      included: 200,
      credit_units: 0,
      excess_units: 60,
      unit_price_amount: 1000,
      currency: "MXN",
      amount: 60000,
      ...datos,
    },
    snapshot: {},
  });

const HOY = "2026-11-01";

describe("planearFacturaDeExcedente", () => {
  it("una factura aparte, PPD, con el concepto del excedente y el mes", () => {
    const plan = planearFacturaDeExcedente(aviso(), {
      ajustes: AJUSTES_POR_OMISION,
      contrato,
      hoy: HOY,
    })!;
    expect(plan.origin).toBe("overage");
    expect(plan.contract_id).toBe(7);
    expect(plan.company_id).toBe(4);
    expect(plan.source_ref).toBe("kontrolia-auth:overage:cl-123");
    expect(plan.period_start).toBe("2026-10-01");
    expect(plan.period_end).toBe("2026-10-31");
    expect(plan.payment_method).toBe("PPD");
    expect(plan.payment_form).toBe("99");
    expect(plan.payment_status).toBe("unpaid");
    expect(plan.due_on).toBe("2026-11-16");
    expect(plan.renglones).toHaveLength(1);
    const [renglon] = plan.renglones;
    expect(renglon.description).toBe(
      "AduaniaX · Excedente de páginas CTM · octubre 2026",
    );
    expect(renglon.quantity).toBe(60);
    expect(renglon.unit_price).toBe(10);
    expect(renglon.amount).toBe(600);
    expect(renglon.clave_prod_serv).toBe("81112106");
    expect(renglon.clave_unidad).toBe("E48");
    expect(renglon.product_ref).toBe("aduaniax:excedente:ctm_paginas");
    expect(plan.subtotal).toBe(600);
    expect(plan.tax).toBe(96);
    expect(plan.total).toBe(696);
    expect(plan.notes).toBe(
      "Usado 260, incluido 200, cubierto con créditos 0",
    );
  });

  it("si el producto dice que sus precios incluyen IVA, se le quita", () => {
    const plan = planearFacturaDeExcedente(aviso({ unit_price_amount: 1160 }), {
      ajustes: { ...AJUSTES_POR_OMISION, prices_include_tax: true },
      contrato,
      hoy: HOY,
    })!;
    expect(plan.renglones[0].unit_price).toBe(10);
    expect(plan.total).toBe(696);
  });

  it("usa las claves del SAT y la forma de pago del producto", () => {
    const plan = planearFacturaDeExcedente(aviso(), {
      ajustes: {
        ...AJUSTES_POR_OMISION,
        clave_prod_serv: "43231500",
        clave_unidad: "ACT",
        forma_pago_transferencia: "03",
      },
      contrato,
      hoy: HOY,
    })!;
    expect(plan.renglones[0].clave_prod_serv).toBe("43231500");
    expect(plan.renglones[0].clave_unidad).toBe("ACT");
    expect(plan.payment_form).toBe("03");
    // El método siempre es PPD: el excedente se paga después.
    expect(plan.payment_method).toBe("PPD");
  });

  it("sin descripción, el concepto es la clave del límite", () => {
    const plan = planearFacturaDeExcedente(aviso({ description: null }), {
      ajustes: AJUSTES_POR_OMISION,
      contrato,
      hoy: HOY,
    })!;
    expect(plan.renglones[0].description).toBe(
      "AduaniaX · Excedente de ctm_paginas · octubre 2026",
    );
  });

  it("cero unidades o precio cero: nada que facturar", () => {
    const contexto = { ajustes: AJUSTES_POR_OMISION, contrato, hoy: HOY };
    expect(
      planearFacturaDeExcedente(aviso({ excess_units: 0 }), contexto),
    ).toBeNull();
    expect(
      planearFacturaDeExcedente(aviso({ unit_price_amount: 0 }), contexto),
    ).toBeNull();
  });

  it("un fin exclusivo (día primero del mes siguiente) se lee como el mes", () => {
    expect(finIncluido("2026-10-01", "2026-11-01")).toBe("2026-10-31");
    expect(finIncluido("2026-10-01", "2026-10-31")).toBe("2026-10-31");
    const plan = planearFacturaDeExcedente(
      aviso({ period_end: "2026-11-01" }),
      { ajustes: AJUSTES_POR_OMISION, contrato, hoy: HOY },
    )!;
    expect(plan.period_end).toBe("2026-10-31");
    expect(plan.periodo_texto).toBe("octubre 2026");
  });
});

describe("partes sueltas", () => {
  it("la referencia es única por cierre", () => {
    expect(referenciaDelExcedente(aviso({ closure_id: 55 }))).toBe(
      "kontrolia-auth:overage:55",
    );
  });

  it("el consumo con separador de miles", () => {
    expect(
      notaDelConsumo({ used: 1260, included: 1000, credit_units: 60 }),
    ).toBe("Usado 1,260, incluido 1,000, cubierto con créditos 60");
  });

  it("revisa que el importe sea unidades × precio", () => {
    expect(importeCuadra(aviso().data)).toBe(true);
    expect(importeCuadra(aviso({ amount: 59000 }).data)).toBe(false);
    expect(importeCuadra(aviso({ amount: null }).data)).toBe(true);
  });

  it("la nota del CFDI junta el periodo y el consumo", () => {
    expect(
      notaDelPeriodo({
        period_start: "2026-10-01",
        period_end: "2026-10-31",
        notes: "Usado 260, incluido 200, cubierto con créditos 0",
      }),
    ).toBe(
      "Periodo: octubre 2026. Usado 260, incluido 200, cubierto con créditos 0",
    );
    expect(
      notaDelPeriodo({ period_start: "2026-10-01", period_end: "2026-10-31" }),
    ).toBe("Periodo: octubre 2026");
  });

  it("un excedente nunca renueva el acceso", () => {
    expect(
      estadoDeAccesoAlPagar(
        {
          id: 1,
          origin: "overage",
          billing_status: "stamped",
          payment_status: "paid",
          period_start: "2026-10-01",
          period_end: "2026-10-31",
          total: "696.00",
          currency: "MXN",
          serie: null,
          folio: null,
          uuid: null,
          paid_at: null,
          payment_reference: null,
        },
        null,
      ),
    ).toBe("not_applicable");
  });

  it("rechaza un aviso sin cierre o con fechas raras", () => {
    expect(() => aviso({ closure_id: "" })).toThrow();
    expect(() => aviso({ period_start: "octubre" })).toThrow();
  });
});

// ── Con la base (falsa) ─────────────────────────────────────────────────

/**
 * Una base falsa que contesta por tabla y anota lo que se inserta. Basta
 * para el camino del excedente: buscar contrato, ajustes, empresa,
 * conector, factura previa y guardar.
 */
const baseFalsa = (datos: {
  contrato: ContratoAFacturar | null;
  previa?: Record<string, unknown> | null;
  ajustes?: Record<string, unknown>[];
}) => {
  const insertadas: Record<string, unknown[]> = {};
  const respuesta = (tabla: string) => {
    switch (tabla) {
      case "contracts":
        return datos.contrato;
      case "billing_settings":
        return datos.ajustes ?? [];
      case "companies":
        return empresa;
      case "connectors":
        return { id: 3, provider: "faqturia" };
      case "invoices":
        return datos.previa ?? null;
      case "contacts":
        return { id: 10 };
      default:
        return null;
    }
  };
  const db = {
    from: (tabla: string) => {
      let insertado: unknown = null;
      const constructor = {
        select: () => constructor,
        eq: () => constructor,
        is: () => constructor,
        order: () => constructor,
        limit: () => constructor,
        delete: () => constructor,
        insert: (fila: unknown) => {
          (insertadas[tabla] ??= []).push(fila);
          insertado = fila;
          return constructor;
        },
        maybeSingle: async () => ({ data: respuesta(tabla), error: null }),
        single: async () => ({
          data: { id: 99, ...(insertado as object) },
          error: null,
        }),
        then: (resolver: (valor: unknown) => unknown) =>
          Promise.resolve(
            insertado
              ? { data: null, error: null }
              : { data: respuesta(tabla), error: null },
          ).then(resolver),
      };
      return constructor;
    },
  };
  return { db: db as unknown as Db, insertadas };
};

describe("facturaDeExcedente", () => {
  it("sin contrato no crea nada y dice por qué", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, insertadas } = baseFalsa({ contrato: null });
    const resultado = await facturaDeExcedente(aviso(), ORG, db, HOY);
    expect(resultado.registrada).toBe(false);
    if (!resultado.registrada) {
      expect(resultado.motivo).toBe("no_contract");
      expect(resultado.mensaje).toContain("kontrolia-auth:overage:cl-123");
    }
    expect(insertadas.invoices).toBeUndefined();
    error.mockRestore();
  });

  it("guarda la factura en revisión con el acceso que no aplica", async () => {
    const { db, insertadas } = baseFalsa({ contrato });
    const resultado = await facturaDeExcedente(aviso(), ORG, db, HOY);
    expect(resultado.registrada).toBe(true);
    const [fila] = insertadas.invoices as Record<string, unknown>[];
    expect(fila).toMatchObject({
      organization_id: ORG,
      origin: "overage",
      contract_id: 7,
      company_id: 4,
      source_ref: "kontrolia-auth:overage:cl-123",
      payment_method: "PPD",
      // Ajustes por omisión: «revisar antes de timbrar».
      billing_status: "pending_review",
      access_status: "not_applicable",
      notes: "Usado 260, incluido 200, cubierto con créditos 0",
      total: 696,
    });
    expect(insertadas.invoice_items).toHaveLength(1);
  });

  it("aunque el contrato no tenga encendida la facturación, entra a revisión", async () => {
    const { db, insertadas } = baseFalsa({
      contrato: { ...contrato, billing_enabled: false },
    });
    await facturaDeExcedente(aviso(), ORG, db, HOY);
    const [fila] = insertadas.invoices as Record<string, unknown>[];
    expect(fila.billing_status).toBe("pending_review");
  });

  it("con el producto en «timbrar sola» y el contrato encendido, a la cola", async () => {
    const { db, insertadas } = baseFalsa({
      contrato,
      ajustes: [{ product_key: "aduaniax", mode: "auto", active: true }],
    });
    await facturaDeExcedente(aviso(), ORG, db, HOY);
    const [fila] = insertadas.invoices as Record<string, unknown>[];
    expect(fila.billing_status).toBe("queued");
  });

  it("un aviso repetido devuelve la factura que ya existe", async () => {
    const { db, insertadas } = baseFalsa({
      contrato,
      previa: { id: 5, origin: "overage", billing_status: "stamped" },
    });
    const resultado = await facturaDeExcedente(aviso(), ORG, db, HOY);
    expect(resultado.registrada && resultado.creada).toBe(false);
    expect(insertadas.invoices).toBeUndefined();
  });
});

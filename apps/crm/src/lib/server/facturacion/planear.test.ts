import { describe, expect, it } from "vitest";

import { AJUSTES_POR_OMISION, ajustesDelProducto } from "./ajustes";
import {
  conceptoDesdePlantilla,
  estadoInicial,
  fechaDeFacturacion,
  listaDeProblemas,
  motivoParaNoFacturar,
  planearFacturaDeContrato,
  problemasFiscales,
  totalesDe,
} from "./planear";
import type { ContratoAFacturar, EmpresaFiscal } from "./tipos";

const contrato = (cambios: Partial<ContratoAFacturar> = {}): ContratoAFacturar => ({
  id: 7,
  company_id: 3,
  name: "AduaniaX · IMMEX",
  status: "active",
  billing_period: "monthly",
  amount: "10000",
  currency: "MXN",
  renews_on: "2027-01-01",
  provider: "manual",
  application_slug: "aduaniax",
  plan_name: "IMMEX",
  addons: [],
  billing_enabled: true,
  ...cambios,
});

const ajustes = AJUSTES_POR_OMISION;

describe("conceptoDesdePlantilla", () => {
  it("llena los marcadores", () => {
    expect(
      conceptoDesdePlantilla("{producto} · {plan} · {periodo}", {
        producto: "AduaniaX",
        plan: "IMMEX",
        periodo: "enero 2027",
      }),
    ).toBe("AduaniaX · IMMEX · enero 2027");
  });
  it("sin plan no deja un tramo vacío", () => {
    expect(
      conceptoDesdePlantilla("{producto} · {plan} · {periodo}", {
        producto: "Soporte",
        plan: null,
        periodo: "enero 2027",
      }),
    ).toBe("Soporte · enero 2027");
  });
});

describe("motivoParaNoFacturar", () => {
  it("no factura sin el interruptor encendido", () => {
    expect(
      motivoParaNoFacturar(
        contrato({ billing_enabled: false }),
        ajustes,
        "2026-12-20",
      ),
    ).toBe("disabled");
  });
  it("espera a days_before antes de la renovación", () => {
    expect(fechaDeFacturacion(contrato(), ajustes)).toBe("2026-12-17");
    expect(motivoParaNoFacturar(contrato(), ajustes, "2026-12-16")).toBe(
      "too_early",
    );
    expect(motivoParaNoFacturar(contrato(), ajustes, "2026-12-17")).toBeNull();
  });
  it("lo de tarjeta no se factura por calendario", () => {
    expect(
      motivoParaNoFacturar(contrato({ provider: "stripe" }), ajustes, "2026-12-20"),
    ).toBe("card");
  });
  it("«facturar ahora» no exige interruptor ni fecha", () => {
    expect(
      motivoParaNoFacturar(
        contrato({ billing_enabled: false }),
        ajustes,
        "2026-01-01",
        { forzar: true },
      ),
    ).toBeNull();
  });
  it("un producto inactivo no se factura solo", () => {
    expect(
      motivoParaNoFacturar(
        contrato(),
        { ...ajustes, active: false },
        "2026-12-20",
      ),
    ).toBe("inactive_product");
  });
});

describe("planearFacturaDeContrato", () => {
  it("mensual: PPD/99, periodo siguiente, IVA aparte", () => {
    const plan = planearFacturaDeContrato(contrato(), ajustes, "2026-12-20")!;
    expect(plan.period_start).toBe("2027-01-01");
    expect(plan.period_end).toBe("2027-01-31");
    expect(plan.due_on).toBe("2027-01-01");
    expect(plan.payment_method).toBe("PPD");
    expect(plan.payment_form).toBe("99");
    expect(plan.payment_status).toBe("unpaid");
    expect(plan.renglones).toHaveLength(1);
    expect(plan.renglones[0].description).toBe("AduaniaX · IMMEX · enero 2027");
    expect(plan.renglones[0].clave_prod_serv).toBe("81112106");
    expect(plan.renglones[0].clave_unidad).toBe("E48");
    expect(plan.subtotal).toBe(10000);
    expect(plan.tax).toBe(1600);
    expect(plan.total).toBe(11600);
  });

  it("anual con extras: el incluido no va, el mensual se cobra por 12", () => {
    const plan = planearFacturaDeContrato(
      contrato({
        billing_period: "yearly",
        amount: 120000,
        addons: [
          { slug: "mve", name: "Manifestación de valor", price_amount: 850000 },
          { slug: "sap", name: "Conector SAP", included: true, price_amount: 500000 },
          {
            slug: "ctm",
            name: "Constancias",
            price_amount: 100000,
            contract_amount: 50000,
          },
          {
            slug: "viejo",
            name: "Ya quitado",
            price_amount: 100000,
            ends_at: "2026-12-15T00:00:00Z",
          },
        ],
      }),
      ajustes,
      "2026-12-20",
    )!;
    expect(plan.renglones.map((r) => r.description)).toEqual([
      "AduaniaX · IMMEX · ene 2027 – dic 2027",
      "Manifestación de valor · ene 2027 – dic 2027",
      "Constancias · ene 2027 – dic 2027",
    ]);
    // 8,500 al mes × 12; el precio pactado (500) manda sobre el de lista.
    expect(plan.renglones[1].amount).toBe(102000);
    expect(plan.renglones[2].amount).toBe(6000);
    expect(plan.subtotal).toBe(228000);
  });

  it("si los precios ya traen IVA, se le quita", () => {
    const plan = planearFacturaDeContrato(
      contrato({ amount: 11600 }),
      { ...ajustes, prices_include_tax: true },
      "2026-12-20",
    )!;
    expect(plan.renglones[0].unit_price).toBe(10000);
    expect(plan.total).toBe(11600);
  });

  it("los ajustes del producto mandan sobre los generales", () => {
    const filas = [
      { product_key: "*", clave_prod_serv: "81112106", days_before: 15 },
      { product_key: "aduaniax", clave_prod_serv: "43232408", days_before: "30", tax_rate: "0.08" },
    ];
    const propios = ajustesDelProducto(filas, "aduaniax");
    expect(propios.clave_prod_serv).toBe("43232408");
    expect(propios.days_before).toBe(30);
    expect(propios.tax_rate).toBe(0.08);
    expect(ajustesDelProducto(filas, "faqturia").clave_prod_serv).toBe("81112106");
    expect(ajustesDelProducto([], "x").mode).toBe("review");
  });

  it("sin importe no hay factura", () => {
    expect(
      planearFacturaDeContrato(contrato({ amount: null }), ajustes, "2026-12-20"),
    ).toBeNull();
  });
});

describe("totalesDe", () => {
  it("el IVA se redondea renglón por renglón", () => {
    expect(
      totalesDe([
        { amount: 0.05, tax_rate: 0.16 },
        { amount: 0.05, tax_rate: 0.16 },
      ]),
    ).toEqual({ subtotal: 0.1, tax: 0.02, total: 0.12 });
  });
});

describe("problemasFiscales y estadoInicial", () => {
  const empresa: EmpresaFiscal = {
    id: 3,
    name: "Acme",
    tax_identifier: "AAA010101AAA",
    tax_regime: "601",
    cfdi_use: "G03",
    zipcode: "06600",
  };
  it("con todo, sin problemas", () => {
    expect(problemasFiscales(empresa)).toEqual([]);
  });
  it("dice qué falta", () => {
    const problemas = problemasFiscales({
      ...empresa,
      tax_identifier: "XYZ",
      zipcode: null,
    });
    expect(problemas).toEqual(["rfc", "zipcode"]);
    expect(listaDeProblemas(problemas)).toBe("el RFC y el código postal fiscal");
    expect(problemasFiscales(null)).toEqual(["customer"]);
  });
  it("sin datos: falta información; con ellos, según el modo", () => {
    expect(estadoInicial(["rfc"], true)).toBe("missing_data");
    expect(estadoInicial([], false)).toBe("pending_review");
    expect(estadoInicial([], true)).toBe("queued");
  });
});

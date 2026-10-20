import { describe, expect, it } from "vitest";

import { AJUSTES_POR_OMISION } from "./ajustes";
import { AvisoDeCobro, facturaDeCobro, repartir } from "./tarjeta";
import type { ContratoAFacturar } from "./tipos";

const ORG = "11111111-1111-1111-1111-111111111111";

const contrato: ContratoAFacturar = {
  id: 9,
  company_id: 4,
  name: "Faqturia · Pro",
  status: "active",
  billing_period: "monthly",
  amount: 999,
  currency: "MXN",
  renews_on: "2027-02-01",
  provider: "stripe",
  application_slug: "faqturia",
  plan_name: "Pro",
  addons: [],
  billing_enabled: false,
};

const aviso = (payload: Record<string, unknown>, kind = "subscription") =>
  AvisoDeCobro.parse({
    id: "evt-1",
    type: "payment.succeeded",
    organization_id: ORG,
    application: { slug: "faqturia", name: "Faqturia" },
    data: {
      subscription_event_id: 123,
      kind,
      subscription_id: "sub-1",
      provider: "stripe",
      payload,
    },
  });

const contexto = { ajustes: AJUSTES_POR_OMISION, contrato, companyId: 4 };

describe("repartir", () => {
  it("cuadra exacto con los centavos en el último", () => {
    const partes = repartir(100, [1, 1, 1]);
    expect(partes).toEqual([33.33, 33.33, 33.34]);
    expect(partes.reduce((s, p) => s + p, 0)).toBeCloseTo(100, 10);
  });
});

describe("facturaDeCobro", () => {
  it("una suscripción: PUE, forma 04, pagada, IVA despejado del total", () => {
    const plan = facturaDeCobro(
      aviso({
        invoiceId: "in_123",
        amountPaid: 115884,
        currency: "mxn",
        periodStart: Date.UTC(2027, 0, 1, 6) / 1000,
        periodEnd: Date.UTC(2027, 1, 1, 6) / 1000,
        paidAt: Date.UTC(2027, 0, 1, 7) / 1000,
        lines: [],
      }),
      contexto,
    )!;
    expect(plan.origin).toBe("card");
    expect(plan.source_ref).toBe("in_123");
    expect(plan.payment_method).toBe("PUE");
    expect(plan.payment_form).toBe("04");
    expect(plan.payment_status).toBe("paid");
    expect(plan.currency).toBe("MXN");
    expect(plan.total).toBe(1158.84);
    expect(plan.subtotal).toBe(999);
    expect(plan.tax).toBe(159.84);
    expect(plan.paid_amount).toBe(1158.84);
    expect(plan.period_start).toBe("2027-01-01");
    expect(plan.period_end).toBe("2027-01-31");
    expect(plan.renglones).toHaveLength(1);
    expect(plan.renglones[0].description).toBe("Faqturia · Pro · enero 2027");
    expect(plan.contract_id).toBe(9);
  });

  it("usa las líneas de Stripe si suman lo cobrado", () => {
    const plan = facturaDeCobro(
      aviso({
        invoiceId: "in_2",
        amountPaid: 11600,
        currency: "mxn",
        lines: [
          { description: "Plan Pro", amount: 5800, quantity: 1 },
          { description: "Usuarios extra", amount: 5800, quantity: 2 },
        ],
      }),
      contexto,
    )!;
    expect(plan.renglones.map((r) => r.description)).toEqual([
      "Plan Pro",
      "Usuarios extra",
    ]);
    expect(plan.renglones.map((r) => r.amount)).toEqual([50, 50]);
  });

  it("con un prorrateo negativo, una sola línea con la plantilla", () => {
    const plan = facturaDeCobro(
      aviso({
        invoiceId: "in_3",
        amountPaid: 5000,
        lines: [
          { description: "Crédito", amount: -1000 },
          { description: "Plan", amount: 6000 },
        ],
      }),
      contexto,
    )!;
    expect(plan.renglones).toHaveLength(1);
    expect(plan.subtotal + plan.tax).toBeCloseTo(50, 10);
  });

  it("créditos: concepto del paquete y referencia de la sesión", () => {
    const plan = facturaDeCobro(
      aviso(
        {
          limitKey: "timbres",
          units: 500,
          amountPaid: 58000,
          currency: "mxn",
          sessionId: "cs_1",
        },
        "credits",
      ),
      contexto,
    )!;
    expect(plan.origin).toBe("credits");
    expect(plan.source_ref).toBe("cs_1");
    expect(plan.renglones[0].description).toBe(
      "Faqturia · Paquete de 500 timbres",
    );
    expect(plan.period_start).toBeNull();
  });

  it("un cobro de cero no se factura", () => {
    expect(facturaDeCobro(aviso({ invoiceId: "x", amountPaid: 0 }), contexto)).toBeNull();
  });
});

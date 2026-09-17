import { describe, expect, it } from "vitest";

import type { KontroliaPlan } from "@/lib/kontrolia-auth/facturacion";

import {
  ahorroAnual,
  equivalenteMensual,
  nombreDelPlanConIntervalo,
  precioAnualDelPlan,
  precioDelPlan,
} from "./formato";
import {
  estadoRespectoAlActual,
  hayOpcionAnual,
  intervaloDeCompra,
} from "./PlanesDisponibles";

const plan = (extra: Partial<KontroliaPlan>): KontroliaPlan =>
  ({
    id: "p",
    applicationId: "a",
    slug: "pro",
    name: "Plan Pro",
    description: null,
    priceAmount: 99900,
    yearlyPriceAmount: null,
    currency: "mxn",
    billingInterval: "month",
    trialDays: 0,
    features: [],
    isDefault: false,
    isActive: true,
    sortOrder: 1,
    permissions: [],
    limits: [],
    ...extra,
  }) as KontroliaPlan;

const proConAnual = plan({ yearlyPriceAmount: 999000 }); // 10 meses
const gratis = plan({ slug: "free", priceAmount: 0 });

describe("precios anuales", () => {
  it("formatea el precio anual en la moneda del plan y el equivalente mensual", () => {
    expect(precioDelPlan(proConAnual)).toBe("$999.00 MXN");
    expect(precioAnualDelPlan(proConAnual)).toBe("$9,990.00 MXN");
    expect(equivalenteMensual(proConAnual)).toBe("$832.50 MXN");
  });

  it("no inventa precio anual para un plan sin él", () => {
    expect(precioAnualDelPlan(plan({}))).toBeNull();
    expect(equivalenteMensual(plan({}))).toBeNull();
    expect(ahorroAnual(plan({}))).toBeNull();
    expect(ahorroAnual(gratis)).toBeNull();
  });

  it("calcula el ahorro con la fórmula de billing.md", () => {
    // 9990 frente a 12 × 999 = 11988 → 16.67 % → 17 %
    expect(ahorroAnual(proConAnual)).toBe(17);
    // Sin descuento real: 0, nunca negativo.
    expect(ahorroAnual(plan({ yearlyPriceAmount: 99900 * 12 }))).toBe(0);
    expect(ahorroAnual(plan({ yearlyPriceAmount: 99900 * 13 }))).toBe(0);
  });
});

describe("hayOpcionAnual", () => {
  it("solo hay interruptor si algún plan trae precio anual", () => {
    expect(hayOpcionAnual([gratis, plan({})])).toBe(false);
    expect(hayOpcionAnual([gratis, proConAnual])).toBe(true);
  });
});

describe("intervaloDeCompra", () => {
  it("con «Anual» solo cobra al año a los planes que lo tienen", () => {
    expect(intervaloDeCompra(proConAnual, "year")).toBe("year");
    expect(intervaloDeCompra(plan({}), "year")).toBe("month");
    expect(intervaloDeCompra(gratis, "year")).toBe("month");
    expect(intervaloDeCompra(proConAnual, "month")).toBe("month");
  });
});

describe("estadoRespectoAlActual", () => {
  const proMensual = { planSlug: "pro", billingInterval: "month" };
  const proAnual = { planSlug: "pro", billingInterval: "year" };

  it("es «actual» solo cuando coinciden plan e intervalo", () => {
    expect(estadoRespectoAlActual(proConAnual, "month", proMensual)).toBe(
      "actual",
    );
    expect(estadoRespectoAlActual(proConAnual, "year", proAnual)).toBe(
      "actual",
    );
  });

  it("en Pro mensual, mirar Pro anual ofrece cambiar a anual (y al revés)", () => {
    expect(estadoRespectoAlActual(proConAnual, "year", proMensual)).toBe(
      "cambiar_a_anual",
    );
    expect(estadoRespectoAlActual(proConAnual, "month", proAnual)).toBe(
      "cambiar_a_mensual",
    );
  });

  it("otro plan, o sin suscripción, es simplemente otro", () => {
    expect(estadoRespectoAlActual(gratis, "month", proMensual)).toBe("otro");
    expect(estadoRespectoAlActual(proConAnual, "month", null)).toBe("otro");
  });
});

describe("nombreDelPlanConIntervalo", () => {
  it("añade «(anual)» solo cuando se cobra al año", () => {
    expect(
      nombreDelPlanConIntervalo({
        planName: "Plan Pro",
        billingInterval: "year",
      }),
    ).toBe("Plan Pro (anual)");
    expect(
      nombreDelPlanConIntervalo({
        planName: "Plan Pro",
        billingInterval: "month",
      }),
    ).toBe("Plan Pro");
  });
});

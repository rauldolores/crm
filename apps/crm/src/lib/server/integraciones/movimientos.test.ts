import { describe, expect, it } from "vitest";

import {
  describirHistorial,
  describirMovimiento,
  describirRenovacion,
  dinero,
  fechaCorta,
  type ContextoDeMovimiento,
  type MovimientoParaDescribir,
} from "./movimientos";

const ID_IMMEX = "0b5c1a52-1f7e-4d55-9a3e-5b4a3c2d1e0f";
const ID_PLATAFORMA = "7d1e2f3a-4b5c-4d6e-8f90-a1b2c3d4e5f6";

const contexto: ContextoDeMovimiento = {
  planes: [
    { id: ID_IMMEX, slug: "immex", name: "IMMEX" },
    { id: ID_PLATAFORMA, slug: "plataforma", name: "Plataforma" },
    { slug: "profesional", name: "Profesional" },
    { slug: "completo", name: "Completo" },
  ],
  extras: [
    {
      addon_id: "a-mve",
      slug: "manifestacion-valor",
      name: "Manifestación de valor",
    },
  ],
};

const mov = (
  type: string,
  payload: Record<string, unknown> = {},
  extra: Partial<MovimientoParaDescribir> = {},
): MovimientoParaDescribir => ({
  id: "m1",
  type,
  occurred_at: "2026-10-19T18:00:00Z",
  subscription_id: "sub-1",
  application_slug: "aduaniax",
  payload,
  ...extra,
});

const titulo = (m: MovimientoParaDescribir, c = contexto) =>
  describirMovimiento(m, c)?.title ?? null;

describe("formatos", () => {
  it("fechas cortas en hora de México", () => {
    expect(fechaCorta("2026-11-01")).toBe("1 nov 2026");
    // 05:59 UTC del 1 de enero todavía es 31 de diciembre en México.
    expect(fechaCorta("2027-01-01T05:59:59Z")).toBe("31 dic 2026");
    expect(fechaCorta(null)).toBeNull();
  });

  it("centavos a pesos con moneda", () => {
    expect(dinero(5050000)).toBe("$50,500.00 MXN");
    expect(dinero(0, "mxn")).toBe("$0.00 MXN");
    expect(dinero(49900, "usd")).toBe("$499.00 USD");
    expect(dinero(null)).toBeNull();
  });
});

describe("describirMovimiento", () => {
  it("plan asignado con vigencia y precio pactado", () => {
    const d = describirMovimiento(
      mov("manual.assigned", {
        planId: ID_IMMEX,
        planSlug: "immex",
        status: "active",
        contract: {
          amount: 0,
          currency: "MXN",
          reference: "CT-7",
          notes: null,
        },
        currentPeriodStart: "2026-10-19T18:00:00Z",
        currentPeriodEnd: "2028-01-01T18:00:00Z",
      }),
      contexto,
    );
    expect(d).toEqual({
      title:
        "Plan asignado: IMMEX · vigente del 19 oct 2026 al 1 ene 2028 · precio pactado $0.00 MXN",
      detail: "Contrato: CT-7",
    });
  });

  it("plan asignado sin fecha de fin ni precio", () => {
    expect(
      titulo(
        mov("manual.assigned", {
          planSlug: "immex",
          contract: null,
          currentPeriodStart: "2026-10-19",
          currentPeriodEnd: null,
        }),
      ),
    ).toBe("Plan asignado: IMMEX · vigente desde el 19 oct 2026, sin fecha de fin");
  });

  it("nunca enseña un uuid de plan que no conoce", () => {
    expect(
      titulo(
        mov("manual.assigned", {
          planId: "99999999-9999-4999-8999-999999999999",
        }),
      ),
    ).toBeNull();
    expect(
      titulo(
        mov(
          "manual.assigned",
          { planId: "99999999-9999-4999-8999-999999999999" },
          { plan_slug: "nuevo" },
        ),
      ),
    ).toBe("Plan asignado: nuevo");
  });

  it("contrato editado: dice qué cambió", () => {
    const antes = {
      status: "active",
      contract: null,
      billingInterval: "month",
      manualGraceDays: 5,
      currentPeriodEnd: "2026-11-01T18:00:00Z",
      currentPeriodStart: "2026-10-01T18:00:00.000Z",
    };
    const despues = {
      ...antes,
      contract: { amount: 3400000, currency: "MXN", reference: null },
      manualGraceDays: null,
      currentPeriodEnd: "2026-12-01T18:00:00Z",
      // El mismo instante escrito distinto no es un cambio.
      currentPeriodStart: "2026-10-01T18:00:00Z",
    };
    expect(
      titulo(mov("manual.updated", { before: antes, after: despues })),
    ).toBe(
      "Contrato editado: vigencia 1 nov 2026 → 1 dic 2026; precio pactado — → $34,000.00 MXN; días de gracia 5 → los de la aplicación",
    );
  });

  it("contrato editado: estado, periodicidad y contrato", () => {
    const antes = {
      status: "trialing",
      billingInterval: "month",
      contract: { amount: 100, currency: "MXN", reference: "A" },
    };
    const despues = {
      status: "active",
      billingInterval: "year",
      contract: { amount: 100, currency: "MXN", reference: "B" },
    };
    expect(
      titulo(mov("manual.updated", { before: antes, after: despues })),
    ).toBe(
      "Contrato editado: estado en prueba → activo; periodicidad mensual → anual; contrato A → B",
    );
  });

  it("contrato editado sin cambio real no se enseña", () => {
    const antes = {
      status: "active",
      currentPeriodStart: "2026-10-01T18:00:00Z",
      currentPeriodEnd: "2026-11-01T18:00:00Z",
      contract: { amount: 100, currency: "MXN", reference: null },
      manualGraceDays: null,
    };
    const despues = {
      ...antes,
      // Unas horas de diferencia en el inicio no cuentan.
      currentPeriodStart: "2026-10-01T20:30:00Z",
      currentPeriodEnd: "2026-11-01T18:00:00.000Z",
      contract: { amount: 100, currency: "mxn", reference: null, notes: "x" },
    };
    expect(
      titulo(mov("manual.updated", { before: antes, after: despues })),
    ).toBeNull();
    expect(titulo(mov("manual.updated", {}))).toBeNull();
  });

  it("renovaciones", () => {
    const pago = {
      renewal_id: "r1",
      previous_period_end: "2028-01-01T18:00:00Z",
      new_period_end: "2029-01-01T18:00:00Z",
      amount: 5050000,
      currency: "MXN",
      payment_reference: "SPEI 123",
      notes: "Pago anual",
    };
    expect(describirMovimiento(mov("manual.renewed", pago), contexto)).toEqual(
      {
        title:
          "Renovación pagada: vigencia 1 ene 2028 → 1 ene 2029 · $50,500.00 MXN · ref. SPEI 123",
        detail: "Pago anual",
      },
    );
    expect(titulo(mov("platform.renewed", { ...pago, covered: true }))).toBe(
      "Pago registrado (el periodo ya estaba cubierto): $50,500.00 MXN · ref. SPEI 123",
    );
    expect(describirRenovacion({ amount: null })).toBeNull();
  });

  it("suspensión, cambio de plan y cortesía", () => {
    expect(titulo(mov("platform.suspended", { reason: "Falta de pago" }))).toBe(
      "Acceso suspendido: Falta de pago",
    );
    expect(
      describirMovimiento(
        mov("manual.plan_changed", {
          de: "profesional",
          a: "completo",
          motivo: "Pidió Anexo 24",
        }),
        contexto,
      ),
    ).toEqual({
      title: "Cambio de plan: Profesional → Completo",
      detail: "Pidió Anexo 24",
    });
    expect(
      titulo(
        mov("manual.courtesy_grant", {
          months: 2,
          planId: ID_IMMEX,
          reason: "Retraso en la puesta en marcha",
          newPeriodEnd: "2026-12-22T18:00:00Z",
          previousPeriodEnd: "2026-10-22T18:00:00Z",
        }),
      ),
    ).toBe(
      "2 meses de cortesía: Retraso en la puesta en marcha · hasta 22 dic 2026",
    );
    expect(
      titulo(mov("stripe.courtesy_grant", { months: 1, reason: "Promoción" })),
    ).toBe("1 mes de cortesía: Promoción");
  });

  it("ajuste con Stripe solo si algo cambió", () => {
    expect(
      titulo(
        mov("reconciled", {
          before: { status: "active", planId: ID_PLATAFORMA },
          after: { status: "past_due", planId: ID_IMMEX },
        }),
      ),
    ).toBe(
      "Ajuste con Stripe: estado activo → pago pendiente; plan Plataforma → IMMEX",
    );
    expect(
      titulo(
        mov("reconciled", {
          before: { status: "active", planId: ID_IMMEX },
          after: { status: "active", planId: ID_IMMEX },
        }),
      ),
    ).toBeNull();
    expect(titulo(mov("reconciled.missing"))).toBe(
      "Stripe ya no tiene la suscripción: se marcó cancelada",
    );
  });

  it("cobros con tarjeta", () => {
    expect(
      titulo(
        mov("invoice.paid", {
          invoiceId: "in_1",
          amountDue: 49900,
          currency: "mxn",
          periodStart: "2026-10-12T18:00:00Z",
          periodEnd: "2026-11-11T18:00:00Z",
        }),
      ),
    ).toBe("Cobro con tarjeta: $499.00 MXN · periodo 12 oct – 11 nov 2026");
    // Factura en cero (periodo de prueba): no se enseña.
    expect(
      titulo(mov("invoice.paid", { amountDue: 0, currency: "mxn" })),
    ).toBeNull();
    expect(
      titulo(
        mov("invoice.paid", { amountDue: 49900, amountPaid: 0, currency: "mxn" }),
      ),
    ).toBeNull();
    expect(
      titulo(mov("invoice.payment_failed", { amountDue: 49900, currency: "mxn" })),
    ).toBe("Cobro con tarjeta rechazado: $499.00 MXN");
  });

  it("suscripción con tarjeta y créditos", () => {
    expect(
      titulo(mov("subscribed", { planId: ID_IMMEX, interval: "month" })),
    ).toBe("Contrató con tarjeta: IMMEX (mensual)");
    expect(titulo(mov("plan_changed", { planId: ID_PLATAFORMA }))).toBe(
      "Cambio de plan con tarjeta: → Plataforma",
    );
    expect(
      titulo(
        mov("credits.purchased", {
          limitKey: "conversations",
          units: 500,
          amountPaid: 105000,
          currency: "mxn",
        }),
      ),
    ).toBe("Compró 500 créditos de conversaciones: $1,050.00 MXN");
  });

  it("extras con nombre, fecha de fin y precio", () => {
    expect(
      titulo(
        mov("addon.added", {
          addonId: "a-mve",
          addonSlug: "manifestacion-valor",
          startsAt: "2026-11-01T18:00:00Z",
          endsAt: null,
          contract: { contract_amount: 9600000, contract_currency: "MXN" },
        }),
      ),
    ).toBe(
      "Extra agregado: Manifestación de valor · desde el 1 nov 2026 · precio pactado $96,000.00 MXN",
    );
    expect(
      titulo(
        mov("addon.removal_scheduled", {
          addonId: "a-mve",
          before: { endsAt: null, status: "active" },
          change: { ends_at: "2026-12-01T18:00:00Z" },
        }),
      ),
    ).toBe(
      "Extra programado para quitarse: Manifestación de valor · termina el 1 dic 2026",
    );
    expect(titulo(mov("addon.removed", { addonId: "a-mve" }))).toBe(
      "Extra quitado: Manifestación de valor",
    );
    expect(
      titulo(
        mov("addon.updated", {
          addonId: "a-mve",
          before: { endsAt: "2026-12-01T18:00:00Z" },
          change: { ends_at: null, contract_amount: 5000000 },
        }),
      ),
    ).toBe(
      "Extra editado: Manifestación de valor · fin 1 dic 2026 → sin fecha de fin; precio pactado $50,000.00 MXN",
    );
    expect(
      titulo(
        mov("addon.updated", {
          addonId: "a-mve",
          before: { endsAt: null },
          change: { updated_at: "2026-10-19T00:00:00Z" },
        }),
      ),
    ).toBeNull();
    // Un extra que no se puede nombrar no se enseña.
    expect(
      titulo(mov("addon.removed", { addonId: "11111111-1111-4111-8111-111111111111" })),
    ).toBeNull();
  });

  it("descarta el ruido", () => {
    for (const tipo of [
      "stripe.invoice.paid",
      "stripe.customer.subscription.updated",
      "checkout.started",
      "credits.checkout_started",
      "status.unpaid",
      "otro.evento",
    ]) {
      expect(titulo(mov(tipo, { planId: ID_IMMEX }))).toBeNull();
    }
  });

  it("status.active solo después de prueba o pago pendiente", () => {
    expect(titulo(mov("status.active"))).toBeNull();
    expect(
      titulo(mov("status.active"), { ...contexto, anterior: "status.trialing" }),
    ).toBe("Suscripción activa (cobro con tarjeta)");
    expect(titulo(mov("status.trialing", { planId: ID_IMMEX }))).toBe(
      "Inicia periodo de prueba: IMMEX",
    );
    expect(titulo(mov("status.past_due"))).toBe("Pago con tarjeta pendiente");
    expect(titulo(mov("status.canceled"))).toBe("Suscripción cancelada");
  });
});

describe("describirHistorial", () => {
  it("ordena, filtra y usa el renglón anterior de la misma suscripción", () => {
    const historial = [
      mov("status.active", {}, { id: "3", occurred_at: "2026-10-03T00:00:00Z" }),
      mov(
        "status.trialing",
        {},
        { id: "1", occurred_at: "2026-10-01T00:00:00Z" },
      ),
      mov(
        "stripe.invoice.paid",
        {},
        { id: "2", occurred_at: "2026-10-02T00:00:00Z" },
      ),
      mov(
        "status.active",
        {},
        { id: "4", occurred_at: "2026-10-04T00:00:00Z" },
      ),
    ];
    const renglones = describirHistorial(historial, [], contexto);
    expect(renglones.map((r) => r.movimiento?.id)).toEqual(["1", "3"]);
  });

  it("una renovación va una sola vez", () => {
    const historial = [
      mov("manual.renewed", {
        renewal_id: "r1",
        amount: 100,
        currency: "MXN",
      }),
    ];
    const renovaciones = [
      { id: "r1", amount: 100, currency: "MXN" },
      { id: "r2", amount: 200, currency: "MXN", payment_reference: "X" },
    ];
    const renglones = describirHistorial(historial, renovaciones, contexto);
    expect(renglones).toHaveLength(2);
    expect(renglones[0].movimiento?.id).toBe("m1");
    expect(renglones[1].renovacion?.id).toBe("r2");
    expect(renglones[1].descripcion.title).toBe(
      "Renovación pagada: $2.00 MXN · ref. X",
    );
  });
});

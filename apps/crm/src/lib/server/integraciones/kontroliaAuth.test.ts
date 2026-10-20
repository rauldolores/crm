import { describe, expect, it } from "vitest";

import {
  AvisoKontroliaAuth,
  camposDeContacto,
  compraDeRenovacion,
  contactoDeMiembro,
  contratoDeSuscripcion,
  dividirNombre,
  estadoDeContrato,
  etapaDelCliente,
  eventosDeLaFoto,
  fechaDe,
  importeDeContrato,
  planDeLaFoto,
  tituloDeMovimiento,
  unirCorreos,
  type FotoKontroliaAuth,
  type SuscripcionKontroliaAuth,
} from "./kontroliaAuth";

const ORG = "11111111-1111-1111-1111-111111111111";

/** Aviso como lo documenta platform-webhooks.md, con datos realistas. */
const aviso = {
  id: "evt-1",
  type: "subscription.renewed",
  api_version: "2026-10-19",
  occurred_at: "2026-10-19T23:00:00Z",
  organization_id: ORG,
  application: { id: "app", slug: "aduaniax", name: "Aduaniax" },
  data: {},
  snapshot: {
    generated_at: "2026-10-19T23:00:05Z",
    organization: {
      id: ORG,
      name: "Acme",
      slug: "acme",
      created_at: "2026-01-01T00:00:00Z",
    },
    members: [
      {
        user_id: "u-ana",
        email: "ana@acme.mx",
        name: "Ana Pérez López",
        phone: "+52 55 1234 5678",
        status: "active",
        roles: [{ slug: "owner", name: "Owner", application_id: null }],
        joined_at: "2026-01-02T00:00:00Z",
        last_sign_in_at: "2026-10-18T15:00:00Z",
      },
      {
        user_id: "u-beto",
        email: "beto@acme.mx",
        name: null,
        phone: null,
        status: "removed",
        roles: [],
        joined_at: "2026-02-01T00:00:00Z",
        last_sign_in_at: null,
      },
    ],
    subscriptions: [
      {
        id: "sub-adx",
        application_id: "app",
        application_slug: "aduaniax",
        application_name: "Aduaniax",
        plan: {
          id: "p1",
          slug: "completo",
          name: "Completo",
          price_amount: 5050000,
          yearly_price_amount: 55550000,
          currency: "MXN",
        },
        status: "active",
        is_live: true,
        provider: "manual",
        billing_interval: "year",
        current_period_start: "2026-01-01T06:00:00Z",
        current_period_end: "2027-01-01T05:59:59Z",
        cancel_at_period_end: false,
        contract: {
          reference: "Contrato 2026-014",
          amount: 50500000,
          currency: "MXN",
        },
        courtesy: { months: 2, until: "2027-03-01", reason: "Migración" },
        addons: [
          {
            addon_id: "a1",
            slug: "manifestacion-valor",
            name: "Manifestación de valor",
            included: false,
            price_amount: 850000,
            currency: "MXN",
            starts_at: "2026-05-01T00:00:00Z",
            ends_at: null,
            contract_amount: null,
            contract_currency: null,
          },
        ],
      },
      {
        id: "sub-fq",
        application_id: "app2",
        application_slug: "facturacion",
        application_name: "Faqturia",
        plan: {
          id: "p2",
          slug: "basico",
          name: "Básico",
          price_amount: 49900,
          yearly_price_amount: null,
          currency: "MXN",
        },
        status: "canceled",
        is_live: false,
        provider: "stripe",
        billing_interval: "month",
        current_period_start: "2026-08-01T06:00:00Z",
        current_period_end: "2026-09-01T06:00:00Z",
        cancel_at_period_end: true,
        contract: { reference: null, amount: null, currency: null },
        courtesy: null,
        addons: [],
      },
    ],
    renewals: [
      {
        id: "ren-1",
        subscription_id: "sub-adx",
        application_slug: "aduaniax",
        previous_period_end: "2026-01-01T05:59:59Z",
        new_period_end: "2027-01-01T05:59:59Z",
        amount: 50500000,
        currency: "MXN",
        payment_reference: "SPEI 123",
        paid_at: "2026-12-20",
        notes: null,
        created_at: "2026-12-20T18:00:00Z",
      },
      {
        id: "ren-sin-pago",
        subscription_id: "sub-adx",
        application_slug: "aduaniax",
        previous_period_end: null,
        new_period_end: null,
        amount: null,
        currency: null,
        payment_reference: null,
        paid_at: null,
        notes: null,
        created_at: "2026-06-01T00:00:00Z",
      },
    ],
    history: [
      {
        id: "h1",
        type: "manual.assigned",
        occurred_at: "2026-01-01T06:00:00Z",
        provider: "manual",
        subscription_id: "sub-adx",
        application_slug: "aduaniax",
        plan_slug: "completo",
        plan_name: "Completo",
        payload: { planSlug: "completo" },
      },
      {
        id: 42,
        type: "addon.added",
        occurred_at: "2026-05-01T00:00:00Z",
        provider: "manual",
        subscription_id: "sub-adx",
        application_slug: "aduaniax",
        plan_slug: "completo",
        plan_name: "Completo",
        payload: { addonSlug: "manifestacion-valor" },
      },
    ],
  },
};

const foto = (): FotoKontroliaAuth =>
  AvisoKontroliaAuth.parse(structuredClone(aviso)).snapshot;
const suscripcion = (i: number): SuscripcionKontroliaAuth =>
  foto().subscriptions[i];

describe("AvisoKontroliaAuth", () => {
  it("acepta el aviso documentado y convierte ids numéricos del historial a texto", () => {
    const f = foto();
    expect(f.organization.name).toBe("Acme");
    expect(f.history[1].id).toBe("42");
  });

  it("rechaza un aviso sin foto", () => {
    expect(AvisoKontroliaAuth.safeParse({ id: "x" }).success).toBe(false);
  });
});

describe("fechaDe", () => {
  it("lee el fin de periodo como fecha de México, no de UTC", () => {
    expect(fechaDe("2027-01-01T05:59:59Z")).toBe("2026-12-31");
    expect(fechaDe("2026-01-01T06:00:00Z")).toBe("2026-01-01");
  });
  it("respeta una fecha sin hora y tolera nulos", () => {
    expect(fechaDe("2026-12-20")).toBe("2026-12-20");
    expect(fechaDe(null)).toBeNull();
    expect(fechaDe("no es fecha")).toBeNull();
  });
});

describe("dividirNombre", () => {
  it("corta en el primer espacio", () => {
    expect(dividirNombre("Ana Pérez López", null)).toEqual({
      first_name: "Ana",
      last_name: "Pérez López",
    });
    expect(dividirNombre("Ana", null)).toEqual({
      first_name: "Ana",
      last_name: null,
    });
  });
  it("sin nombre usa la parte local del correo", () => {
    expect(dividirNombre(null, "beto@acme.mx")).toEqual({
      first_name: "beto",
      last_name: null,
    });
  });
});

describe("etapaDelCliente", () => {
  const viva = [{ is_live: true }];
  const muerta = [{ is_live: false }];

  it("con una suscripción viva es cliente", () => {
    expect(etapaDelCliente(null, viva)).toBe("customer");
    expect(etapaDelCliente("prospect", viva)).toBe("customer");
    expect(etapaDelCliente("churned", viva)).toBe("customer");
    expect(etapaDelCliente("customer", viva)).toBeUndefined();
  });

  it("si ya no le queda ninguna viva, el cliente pasa a perdido", () => {
    expect(etapaDelCliente("customer", muerta)).toBe("churned");
    expect(etapaDelCliente("prospect", muerta)).toBeUndefined();
  });

  it("nunca pisa una etapa que puso una persona", () => {
    expect(etapaDelCliente("at-risk", viva)).toBeUndefined();
    expect(etapaDelCliente("at-risk", muerta)).toBeUndefined();
  });

  it("sin suscripciones y sin etapa es prospecto", () => {
    expect(etapaDelCliente(null, [])).toBe("prospect");
    expect(etapaDelCliente("customer", [])).toBeUndefined();
  });
});

describe("contactos", () => {
  it("conserva los otros correos y agrega el del usuario", () => {
    expect(
      unirCorreos(
        [{ email: "personal@gmail.com", type: "Home" }],
        "ana@acme.mx",
      ),
    ).toEqual([
      { email: "ana@acme.mx", type: "Work" },
      { email: "personal@gmail.com", type: "Home" },
    ]);
    expect(
      unirCorreos([{ email: "ANA@acme.mx", type: "Work" }], "ana@acme.mx"),
    ).toHaveLength(1);
  });

  it("un usuario activo se desarchiva; uno quitado se archiva sin perder la fecha original", () => {
    const [ana, beto] = foto().members.map(contactoDeMiembro);
    const ahora = "2026-10-20T00:00:00.000Z";

    const nueva = camposDeContacto(ana, null, ahora, 7);
    expect(nueva).toMatchObject({
      first_name: "Ana",
      last_name: "Pérez López",
      email_jsonb: [{ email: "ana@acme.mx", type: "Work" }],
      phone_jsonb: [{ number: "+52 55 1234 5678", type: "Work" }],
      company_id: 7,
      last_seen: "2026-10-18T15:00:00Z",
      archived_at: null,
      source: "kontrolia_auth",
      external_id: "u-ana",
      first_seen: "2026-01-02T00:00:00Z",
    });

    const yaArchivado = camposDeContacto(
      beto,
      {
        id: 1,
        email_jsonb: [],
        phone_jsonb: null,
        archived_at: "2026-03-01T00:00:00Z",
        last_seen: "2026-02-15T00:00:00Z",
      },
      ahora,
      7,
    );
    expect(yaArchivado.archived_at).toBe("2026-03-01T00:00:00Z");
    expect(yaArchivado.last_seen).toBe("2026-02-15T00:00:00Z");
    expect(yaArchivado).not.toHaveProperty("first_seen");
    expect(camposDeContacto(beto, null, ahora, 7).archived_at).toBe(ahora);
  });
});

describe("contratos", () => {
  it("una suscripción viva por contrato anual pactado", () => {
    const contrato = contratoDeSuscripcion(ORG, suscripcion(0));
    expect(contrato).toMatchObject({
      name: "Aduaniax · Completo",
      status: "active",
      billing_period: "yearly",
      amount: 505000,
      currency: "MXN",
      started_on: "2026-01-01",
      renews_on: "2026-12-31",
      ended_on: null,
      auto_renew: false,
      application_slug: "aduaniax",
      plan_slug: "completo",
      plan_name: "Completo",
      provider: "manual",
      source: "kontrolia_auth",
      external_id: `${ORG}:aduaniax`,
    });
    expect(contrato.addons).toHaveLength(1);
    expect(contrato.notes).toContain("Contrato: Contrato 2026-014");
    expect(contrato.notes).toContain("2 meses de cortesía hasta el");
    expect(contrato.notes).toContain("(Migración)");
  });

  it("una cancelada ya no está viva: cancelada, con fecha de fin y sin renovación", () => {
    const contrato = contratoDeSuscripcion(ORG, suscripcion(1));
    expect(contrato).toMatchObject({
      status: "cancelled",
      billing_period: "monthly",
      amount: 499,
      renews_on: null,
      ended_on: "2026-09-01",
      notes: null,
    });
  });

  it("estado: viva aunque esté programada para cancelarse; vencida si no está viva ni cancelada", () => {
    expect(estadoDeContrato({ is_live: true, status: "active" })).toBe(
      "active",
    );
    expect(estadoDeContrato({ is_live: false, status: "past_due" })).toBe(
      "expired",
    );
    expect(estadoDeContrato({ is_live: false, status: "canceled" })).toBe(
      "cancelled",
    );
  });

  it("renueva sola solo con tarjeta y sin cancelación programada", () => {
    const s = { ...suscripcion(1), is_live: true, cancel_at_period_end: false };
    expect(contratoDeSuscripcion(ORG, s).auto_renew).toBe(true);
    expect(
      contratoDeSuscripcion(ORG, { ...s, cancel_at_period_end: true })
        .auto_renew,
    ).toBe(false);
  });

  it("guarda los días de gracia solo si la suscripción está en gracia", () => {
    const sinGracia = contratoDeSuscripcion(ORG, suscripcion(0));
    expect(sinGracia).toMatchObject({ in_grace: false, grace_until: null });

    const enGracia = contratoDeSuscripcion(ORG, {
      ...suscripcion(0),
      in_grace: true,
      grace_until: "2027-01-10T05:59:59Z",
      manual_grace_days: 10,
    });
    expect(enGracia).toMatchObject({
      in_grace: true,
      grace_until: "2027-01-10T05:59:59Z",
    });

    const yaNo = contratoDeSuscripcion(ORG, {
      ...suscripcion(0),
      in_grace: false,
      grace_until: "2027-01-10T05:59:59Z",
    });
    expect(yaNo).toMatchObject({ in_grace: false, grace_until: null });
  });

  it("sin precio pactado usa el de lista: el anual o doce mensualidades", () => {
    const base = suscripcion(0);
    const sinPacto = { ...base, contract: null };
    expect(importeDeContrato(sinPacto)).toBe(555500);
    expect(
      importeDeContrato({
        ...sinPacto,
        plan: { ...base.plan, yearly_price_amount: null },
      }),
    ).toBe(606000);
    expect(importeDeContrato({ ...sinPacto, billing_interval: "month" })).toBe(
      50500,
    );
  });
});

describe("compras", () => {
  it("cada renovación con importe es una compra pagada con su línea", () => {
    const f = foto();
    const compra = compraDeRenovacion(f.renewals[0], f.subscriptions);
    expect(compra).toEqual({
      application_slug: "aduaniax",
      compra: {
        purchased_on: "2026-12-20",
        amount: 505000,
        currency: "MXN",
        status: "paid",
        reference: "SPEI 123",
        source: "kontrolia_auth",
        external_id: "ren-1",
      },
      linea: {
        description: "Renovación Completo (2025-12-31 → 2026-12-31)",
        product_ref: "aduaniax:completo",
        quantity: 1,
        unit_price: 505000,
        amount: 505000,
      },
    });
  });

  it("una renovación sin importe no es compra", () => {
    const f = foto();
    expect(compraDeRenovacion(f.renewals[1], f.subscriptions)).toBeNull();
  });
});

describe("historial", () => {
  it("títulos en español por tipo", () => {
    const f = foto();
    expect(tituloDeMovimiento(f.history[0], f.subscriptions)).toBe(
      "Plan asignado: Completo",
    );
    expect(tituloDeMovimiento(f.history[1], f.subscriptions)).toBe(
      "Extra agregado: Manifestación de valor",
    );
    const m = (type: string) => ({ ...f.history[0], type, payload: {} });
    expect(tituloDeMovimiento(m("manual.updated"))).toBe(
      "Vigencia o contrato editado",
    );
    expect(tituloDeMovimiento(m("manual.renewed"))).toBe("Renovación");
    expect(tituloDeMovimiento(m("manual.granted_free_months"))).toBe(
      "Meses de cortesía",
    );
    expect(tituloDeMovimiento(m("addon.removal_scheduled"))).toBe(
      "Extra programado para quitarse",
    );
    expect(tituloDeMovimiento(m("stripe.invoice.paid"))).toBe(
      "Cobro con tarjeta: invoice.paid",
    );
    expect(tituloDeMovimiento(m("otro.evento"))).toBe("otro.evento");
  });

  it("un evento por movimiento y uno por renovación, con llaves estables", () => {
    const eventos = eventosDeLaFoto(foto());
    expect(eventos.map((e) => e.fila.external_id)).toEqual([
      "h1",
      "42",
      "renewal:ren-1",
      "renewal:ren-sin-pago",
    ]);
    const pagada = eventos[2];
    expect(pagada.application_slug).toBe("aduaniax");
    expect(pagada.fila).toMatchObject({
      type: "renewal",
      title: "Renovación pagada",
      amount: 505000,
      currency: "MXN",
      occurred_at: "2026-12-20T18:00:00Z",
    });
    expect(eventos[3].fila).toMatchObject({ amount: null, currency: null });
    expect(eventos[0].fila.detail).toMatchObject({
      planSlug: "completo",
      provider: "manual",
    });
  });
});

describe("planDeLaFoto", () => {
  it("arma todo lo que hay que guardar", () => {
    const plan = planDeLaFoto(foto());
    expect(plan.organizacionExterna).toEqual({ id: ORG, name: "Acme" });
    expect(plan.contactos).toHaveLength(2);
    expect(plan.contratos).toHaveLength(2);
    expect(plan.compras).toHaveLength(1);
    expect(plan.eventos).toHaveLength(4);
  });

  it("una foto sin usuarios ni suscripciones también es válida", () => {
    const vacia = AvisoKontroliaAuth.parse({
      snapshot: {
        generated_at: "2026-10-19T00:00:00Z",
        organization: { id: ORG, name: "Nueva" },
      },
    }).snapshot;
    const plan = planDeLaFoto(vacia);
    expect(plan.contactos).toEqual([]);
    expect(plan.contratos).toEqual([]);
    expect(plan.eventos).toEqual([]);
  });
});

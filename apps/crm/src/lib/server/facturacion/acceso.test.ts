import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cambiosPorResultado,
  configuracionDeAcceso,
  debeRenovarAcceso,
  estadoDeAccesoAlPagar,
  interpretarRespuesta,
  MAX_INTENTOS_DE_ACCESO,
  pedirRenovacion,
  peticionDeRenovacion,
  separarLlaveDeContrato,
  siguienteIntento,
  type ContratoParaAcceso,
  type FacturaParaAcceso,
} from "./acceso";
import { instanteDelPago } from "./acciones";

const ORG_AUTH = "22222222-2222-2222-2222-222222222222";

const factura = (
  cambios: Partial<FacturaParaAcceso> = {},
): FacturaParaAcceso => ({
  id: 41,
  origin: "contract",
  billing_status: "stamped",
  payment_status: "paid",
  period_start: "2027-01-01",
  period_end: "2027-12-31",
  total: "34800.00",
  currency: "MXN",
  serie: "A",
  folio: "120",
  uuid: "uuid-1",
  paid_at: "2026-12-20T18:00:00.000Z",
  payment_reference: null,
  ...cambios,
});

const contrato = (
  cambios: Partial<ContratoParaAcceso> = {},
): ContratoParaAcceso => ({
  id: 7,
  source: "kontrolia_auth",
  provider: "manual",
  external_id: `${ORG_AUTH}:aduaniax`,
  billing_period: "yearly",
  application_slug: "aduaniax",
  ...cambios,
});

describe("debeRenovarAcceso", () => {
  it("la factura pagada y timbrada de un contrato de KontrolIA Auth por transferencia", () => {
    expect(debeRenovarAcceso(factura(), contrato())).toBe(true);
  });

  it("no sin pagar, sin timbrar, sin periodo o de otro origen", () => {
    expect(
      debeRenovarAcceso(factura({ payment_status: "partial" }), contrato()),
    ).toBe(false);
    expect(
      debeRenovarAcceso(factura({ billing_status: "queued" }), contrato()),
    ).toBe(false);
    expect(debeRenovarAcceso(factura({ period_end: null }), contrato())).toBe(
      false,
    );
    expect(debeRenovarAcceso(factura({ origin: "card" }), contrato())).toBe(
      false,
    );
  });

  it("no si el contrato se cobra con tarjeta o no viene de KontrolIA Auth", () => {
    expect(debeRenovarAcceso(factura(), contrato({ provider: "stripe" }))).toBe(
      false,
    );
    expect(debeRenovarAcceso(factura(), contrato({ source: "manual" }))).toBe(
      false,
    );
    expect(debeRenovarAcceso(factura(), null)).toBe(false);
  });
});

describe("estadoDeAccesoAlPagar", () => {
  it("tarjeta y créditos no aplican aunque no estén pagadas", () => {
    expect(estadoDeAccesoAlPagar(factura({ origin: "card" }), null)).toBe(
      "not_applicable",
    );
    expect(
      estadoDeAccesoAlPagar(
        factura({ origin: "credits", payment_status: "unpaid" }),
        null,
      ),
    ).toBe("not_applicable");
  });

  it("pendiente si hay que renovar; no aplica si el contrato no es por transferencia", () => {
    expect(estadoDeAccesoAlPagar(factura(), contrato())).toBe("pending");
    expect(
      estadoDeAccesoAlPagar(factura(), contrato({ provider: "stripe" })),
    ).toBe("not_applicable");
  });

  it("todavía nada si no está pagada o es de cotización", () => {
    expect(
      estadoDeAccesoAlPagar(factura({ payment_status: "unpaid" }), contrato()),
    ).toBeNull();
    expect(
      estadoDeAccesoAlPagar(factura({ origin: "quote" }), contrato()),
    ).toBeNull();
  });
});

describe("separarLlaveDeContrato", () => {
  it("corta en el primer «:»", () => {
    expect(separarLlaveDeContrato(`${ORG_AUTH}:aduaniax`)).toEqual({
      organizationId: ORG_AUTH,
      application: "aduaniax",
    });
    expect(separarLlaveDeContrato("org:app:extra")).toEqual({
      organizationId: "org",
      application: "app:extra",
    });
  });

  it("nulo si falta alguna de las dos partes", () => {
    expect(separarLlaveDeContrato(null)).toBeNull();
    expect(separarLlaveDeContrato("sin-dos-puntos")).toBeNull();
    expect(separarLlaveDeContrato(":app")).toBeNull();
    expect(separarLlaveDeContrato("org:")).toBeNull();
  });
});

describe("peticionDeRenovacion", () => {
  it("arma lo que pide KontrolIA Auth", () => {
    expect(peticionDeRenovacion(factura(), contrato())).toEqual({
      organizationId: ORG_AUTH,
      application: "aduaniax",
      months: 12,
      periodStart: "2027-01-01",
      periodEnd: "2027-12-31",
      amount: 3480000,
      currency: "MXN",
      paymentReference: "A-120",
      paidAt: "2026-12-20T18:00:00.000Z",
      notes: "Factura A-120 pagada",
      externalRef: "vinqulia:invoice:41",
    });
  });

  it("meses por periodicidad, UUID sin folio y la referencia del pago en las notas", () => {
    const p = peticionDeRenovacion(
      factura({
        serie: null,
        folio: null,
        payment_reference: "SPEI 123",
        total: 1160.1,
      }),
      contrato({ billing_period: "quarterly" }),
    );
    expect(p.months).toBe(3);
    expect(p.paymentReference).toBe("uuid-1");
    expect(p.notes).toBe("Factura uuid-1 pagada · Ref. SPEI 123");
    expect(p.amount).toBe(116010);
    expect(
      peticionDeRenovacion(factura(), contrato({ billing_period: "monthly" }))
        .months,
    ).toBe(1);
  });

  it("rechaza un contrato sin llave o sin periodicidad", () => {
    expect(() =>
      peticionDeRenovacion(factura(), contrato({ external_id: "x" })),
    ).toThrow(/organización/);
    expect(() =>
      peticionDeRenovacion(factura(), contrato({ billing_period: "one_time" })),
    ).toThrow(/periodicidad/);
  });
});

describe("interpretarRespuesta", () => {
  it("200 y «ya estaba» son renovado, con la nueva vigencia", () => {
    expect(
      interpretarRespuesta(200, {
        subscription: {
          currentPeriodEnd: "2028-01-01T05:59:59Z",
          isLive: true,
        },
        renewal: { id: "r1" },
      }),
    ).toEqual({ tipo: "renovado", hasta: "2028-01-01T05:59:59Z" });
    expect(
      interpretarRespuesta(200, {
        already: true,
        subscription: { currentPeriodEnd: "2028-01-01T05:59:59Z" },
      }),
    ).toEqual({ tipo: "renovado", hasta: "2028-01-01T05:59:59Z" });
  });

  it("409 se omite con el motivo de KontrolIA Auth", () => {
    expect(
      interpretarRespuesta(409, { error: "Se cobra con tarjeta." }),
    ).toEqual({
      tipo: "omitido",
      motivo: "Se cobra con tarjeta.",
    });
  });

  it("5xx, 429 y clave rechazada se reintentan; otro 4xx no", () => {
    expect(interpretarRespuesta(503, null).tipo).toBe("reintentar");
    expect(interpretarRespuesta(429, {}).tipo).toBe("reintentar");
    expect(interpretarRespuesta(401, {}).tipo).toBe("reintentar");
    expect(interpretarRespuesta(422, { error: "periodEnd inválido" })).toEqual({
      tipo: "rechazado",
      motivo: "KontrolIA Auth rechazó la renovación: periodEnd inválido",
    });
  });
});

describe("siguienteIntento y cambiosPorResultado", () => {
  const ahora = Date.parse("2026-12-20T00:00:00Z");

  it("espera 1, 2, 4… horas, hasta 24, y se detiene en el tope", () => {
    expect(siguienteIntento(1, ahora)).toBe("2026-12-20T01:00:00.000Z");
    expect(siguienteIntento(3, ahora)).toBe("2026-12-20T04:00:00.000Z");
    expect(siguienteIntento(7, ahora)).toBe("2026-12-21T00:00:00.000Z");
    expect(siguienteIntento(MAX_INTENTOS_DE_ACCESO, ahora)).toBeNull();
  });

  it("renovado guarda la vigencia y limpia el error", () => {
    expect(
      cambiosPorResultado(
        { tipo: "renovado", hasta: "2028-01-01T05:59:59Z" },
        2,
        ahora,
      ),
    ).toMatchObject({
      access_status: "renewed",
      access_renewed_until: "2028-01-01T05:59:59Z",
      access_error: null,
      access_next_attempt_at: null,
      access_attempts: 3,
    });
  });

  it("un error para reintentar programa el siguiente; uno rechazado o una omitida no", () => {
    expect(
      cambiosPorResultado({ tipo: "reintentar", motivo: "caído" }, 0, ahora),
    ).toMatchObject({
      access_status: "error",
      access_error: "caído",
      access_attempts: 1,
      access_next_attempt_at: "2026-12-20T01:00:00.000Z",
    });
    expect(
      cambiosPorResultado(
        { tipo: "reintentar", motivo: "caído" },
        MAX_INTENTOS_DE_ACCESO - 1,
        ahora,
      ).access_next_attempt_at,
    ).toBeNull();
    expect(
      cambiosPorResultado({ tipo: "rechazado", motivo: "x" }, 0, ahora),
    ).toMatchObject({
      access_status: "error",
      access_next_attempt_at: null,
    });
    expect(
      cambiosPorResultado({ tipo: "omitido", motivo: "tarjeta" }, 0, ahora),
    ).toMatchObject({
      access_status: "skipped",
      access_error: "tarjeta",
      access_next_attempt_at: null,
    });
  });
});

describe("pedirRenovacion", () => {
  const configuracion = { url: "https://auth.example", clave: "kpk_live_x" };

  it("manda la petición con la clave y lee la respuesta", async () => {
    const llamar = vi.fn(async () =>
      Response.json({
        subscription: { currentPeriodEnd: "2028-01-01T05:59:59Z" },
      }),
    );
    const resultado = await pedirRenovacion(
      configuracion,
      peticionDeRenovacion(factura(), contrato()),
      llamar as unknown as typeof fetch,
    );
    expect(resultado).toEqual({
      tipo: "renovado",
      hasta: "2028-01-01T05:59:59Z",
    });
    const [url, init] = llamar.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://auth.example/api/platform/subscriptions/renew");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer kpk_live_x",
    );
    expect(JSON.parse(init.body as string).externalRef).toBe(
      "vinqulia:invoice:41",
    );
  });

  it("un corte de red se reintenta", async () => {
    const llamar = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    const resultado = await pedirRenovacion(
      configuracion,
      peticionDeRenovacion(factura(), contrato()),
      llamar as unknown as typeof fetch,
    );
    expect(resultado.tipo).toBe("reintentar");
  });
});

describe("configuracionDeAcceso", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("necesita la URL y la clave", () => {
    vi.stubEnv("KONTROLIA_AUTH_SERVER_URL", "https://auth.example/");
    vi.stubEnv("KONTROLIA_PLATFORM_API_KEY", "");
    expect(configuracionDeAcceso()).toBeNull();
    vi.stubEnv("KONTROLIA_PLATFORM_API_KEY", "kpk_live_x");
    expect(configuracionDeAcceso()).toEqual({
      url: "https://auth.example",
      clave: "kpk_live_x",
    });
  });
});

describe("instanteDelPago", () => {
  it("una fecha sola es mediodía en México; basura es nulo", () => {
    expect(instanteDelPago("2026-12-20")).toBe("2026-12-20T18:00:00.000Z");
    expect(instanteDelPago("2026-12-20T10:00:00Z")).toBe(
      "2026-12-20T10:00:00.000Z",
    );
    expect(instanteDelPago("ayer")).toBeNull();
  });
});

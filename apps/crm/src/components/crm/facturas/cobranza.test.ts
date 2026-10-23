import { describe, expect, test } from "vitest";

import { diasDeAtraso, hoyEnMexico, resumirCobranza } from "./cobranza";

describe("diasDeAtraso", () => {
  test("cuenta los días desde el vencimiento", () => {
    expect(diasDeAtraso("2026-10-01", "2026-10-23")).toBe(22);
  });

  test("una factura que vence hoy o después no está atrasada", () => {
    expect(diasDeAtraso("2026-10-23", "2026-10-23")).toBe(0);
    expect(diasDeAtraso("2026-11-15", "2026-10-23")).toBe(0);
  });

  test("sin fecha de vencimiento no hay atraso", () => {
    expect(diasDeAtraso(null, "2026-10-23")).toBe(0);
  });
});

describe("hoyEnMexico", () => {
  test("a las 2 de la mañana en UTC todavía es el día anterior en México", () => {
    expect(hoyEnMexico(new Date("2026-10-24T02:00:00Z"))).toBe("2026-10-23");
  });
});

describe("resumirCobranza", () => {
  test("suma lo que falta por cobrar y aparta lo vencido", () => {
    const resumen = resumirCobranza(
      [
        { total: 1160, paid_amount: 0, currency: "MXN", due_on: "2026-10-01" },
        { total: 2320, paid_amount: 0, currency: "MXN", due_on: "2026-11-30" },
      ],
      "2026-10-23",
    );

    expect(resumen.porCobrar).toEqual({
      cantidad: 2,
      importes: { MXN: 3480 },
    });
    expect(resumen.vencidas).toEqual({ cantidad: 1, importes: { MXN: 1160 } });
  });

  test("de una factura pagada en parte solo cuenta el saldo", () => {
    const resumen = resumirCobranza(
      [
        {
          total: 1000,
          paid_amount: "400.00",
          currency: "MXN",
          due_on: null,
        },
      ],
      "2026-10-23",
    );

    expect(resumen.porCobrar.importes).toEqual({ MXN: 600 });
    expect(resumen.vencidas.cantidad).toBe(0);
  });

  test("no mezcla pesos con dólares", () => {
    const resumen = resumirCobranza(
      [
        { total: 100, paid_amount: 0, currency: "USD", due_on: null },
        { total: 500, paid_amount: 0, currency: "MXN", due_on: null },
      ],
      "2026-10-23",
    );

    expect(resumen.porCobrar.importes).toEqual({ USD: 100, MXN: 500 });
  });

  test("sin facturas, todo en cero", () => {
    expect(resumirCobranza([], "2026-10-23")).toEqual({
      porCobrar: { cantidad: 0, importes: {} },
      vencidas: { cantidad: 0, importes: {} },
    });
  });
});

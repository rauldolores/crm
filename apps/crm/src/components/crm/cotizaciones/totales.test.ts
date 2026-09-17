import { describe, expect, it } from "vitest";

import { calcularTotales, importeDeLinea, venceEn } from "./totales";

describe("importeDeLinea", () => {
  it("aplica cantidad, precio y descuento redondeando a centavos", () => {
    // 3 × 1,234.56 × 0.9 = 3,333.312 → 3,333.31
    expect(
      importeDeLinea({ quantity: 3, unit_price: 1234.56, discount_pct: 10 }),
    ).toBe(3333.31);
  });

  it("trata un campo vacío como cero, no como NaN", () => {
    // Mientras se escribe en el formulario los campos llegan como "" o null.
    expect(importeDeLinea({ quantity: "", unit_price: 100 })).toBe(0);
    expect(importeDeLinea({ quantity: 2, unit_price: null })).toBe(0);
  });
});

describe("calcularTotales", () => {
  it("coincide con lo que calcula la base para la misma cotización", () => {
    // Verificado en producción: 79,000 + 45,000 con 20% de descuento y 16%
    // de IVA dio subtotal 115,000, IVA 18,400 y total 133,400.
    const totales = calcularTotales([
      { quantity: 1, unit_price: 79000, discount_pct: 0, tax_rate: 16 },
      { quantity: 1, unit_price: 45000, discount_pct: 20, tax_rate: 16 },
    ]);

    expect(totales).toEqual({ subtotal: 115000, iva: 18400, total: 133400 });
  });

  it("permite líneas sin IVA junto a líneas con IVA", () => {
    const totales = calcularTotales([
      { quantity: 1, unit_price: 100, tax_rate: 16 },
      { quantity: 1, unit_price: 100, tax_rate: 0 },
    ]);

    expect(totales).toEqual({ subtotal: 200, iva: 16, total: 216 });
  });

  it("devuelve ceros sin líneas", () => {
    expect(calcularTotales(undefined)).toEqual({
      subtotal: 0,
      iva: 0,
      total: 0,
    });
  });
});

describe("venceEn", () => {
  it("suma días naturales y devuelve solo la fecha", () => {
    expect(venceEn(30, new Date("2026-09-17T12:00:00Z"))).toBe("2026-10-17");
  });
});

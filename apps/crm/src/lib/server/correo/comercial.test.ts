import { describe, expect, test } from "vitest";

import {
  cabecerasDeBaja,
  esComercial,
  limiteDeHoy,
  normalizarCorreo,
  respuestasDesde,
} from "./comercial";

const dia = (n: number) => new Date(Date.UTC(2026, 9, 1 + n, 12));

describe("esComercial", () => {
  test("un correo de automatización o envío masivo es comercial", () => {
    expect(
      esComercial({ quote_id: null, ticket_id: null, contract_id: null }),
    ).toBe(true);
  });

  test("cotización, ticket y renovación son respuestas al cliente, no comerciales", () => {
    const base = { quote_id: null, ticket_id: null, contract_id: null };
    expect(esComercial({ ...base, quote_id: 1 })).toBe(false);
    expect(esComercial({ ...base, ticket_id: 1 })).toBe(false);
    expect(esComercial({ ...base, contract_id: 1 })).toBe(false);
  });
});

describe("limiteDeHoy", () => {
  test("sin calentamiento, el máximo desde el primer día", () => {
    expect(
      limiteDeHoy({ limiteDiario: 300, calentamiento: false }, null, dia(0)),
    ).toBe(300);
  });

  test("con calentamiento, empieza en 20 y sube 20 por día", () => {
    const ajustes = { limiteDiario: 200, calentamiento: true };
    expect(limiteDeHoy(ajustes, null, dia(0))).toBe(20);
    expect(limiteDeHoy(ajustes, dia(0), dia(0))).toBe(20);
    expect(limiteDeHoy(ajustes, dia(0), dia(1))).toBe(40);
    expect(limiteDeHoy(ajustes, dia(0), dia(4))).toBe(100);
  });

  test("el calentamiento nunca pasa del máximo", () => {
    expect(
      limiteDeHoy({ limiteDiario: 50, calentamiento: true }, dia(0), dia(30)),
    ).toBe(50);
  });
});

describe("respuestasDesde", () => {
  test("cuenta desde que se abrió la oportunidad", () => {
    expect(
      respuestasDesde("2026-09-01T00:00:00.000Z", "2026-10-20T00:00:00.000Z"),
    ).toBe("2026-09-01T00:00:00.000Z");
  });

  test("sin oportunidad, los 30 días anteriores a encolarlo", () => {
    expect(respuestasDesde(null, "2026-10-31T00:00:00.000Z")).toBe(
      "2026-10-01T00:00:00.000Z",
    );
  });
});

describe("baja", () => {
  test("la misma dirección escrita distinto es la misma", () => {
    expect(normalizarCorreo("  Ana@Empresa.MX ")).toBe("ana@empresa.mx");
  });

  test("las cabeceras piden la baja de un clic", () => {
    expect(cabecerasDeBaja("https://app.vinqulia.com/api/correos/baja/t")).toEqual({
      "List-Unsubscribe": "<https://app.vinqulia.com/api/correos/baja/t>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });
});

import { describe, expect, test } from "vitest";

import { limpiarSla } from "./limpiarSla";

describe("limpiarSla", () => {
  test("descarta las prioridades sin ningún plazo", () => {
    expect(
      limpiarSla({
        low: { firstResponseHours: null, resolutionHours: null },
        normal: {},
      }),
    ).toEqual({});
  });

  test("conserva las horas válidas, redondeadas, y anula las que no lo son", () => {
    expect(
      limpiarSla({
        urgent: { firstResponseHours: 1.4, resolutionHours: 0 },
        high: { firstResponseHours: -2, resolutionHours: 24 },
      }),
    ).toEqual({
      urgent: { firstResponseHours: 1, resolutionHours: null },
      high: { firstResponseHours: null, resolutionHours: 24 },
    });
  });

  test("acepta una configuración ausente", () => {
    expect(limpiarSla(undefined)).toEqual({});
  });
});

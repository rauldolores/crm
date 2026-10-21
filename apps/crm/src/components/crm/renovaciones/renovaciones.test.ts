import { describe, expect, it } from "vitest";

import {
  AJUSTES_DE_RENOVACIONES_DE_FABRICA,
  ajustesDeRenovaciones,
  diasDeAnticipacion,
  diasValidos,
  estadoDeRenovacion,
  hoyComoFecha,
  limpiarRenovaciones,
  sumarDias,
} from "./renovaciones";

const fabrica = AJUSTES_DE_RENOVACIONES_DE_FABRICA;

describe("ajustesDeRenovaciones", () => {
  it("sin nada guardado valen los de fábrica", () => {
    expect(ajustesDeRenovaciones(undefined)).toEqual(fabrica);
    expect(ajustesDeRenovaciones(null)).toEqual(fabrica);
    expect(ajustesDeRenovaciones("x")).toEqual(fabrica);
    expect(fabrica).toMatchObject({
      active: true,
      daysBeforeYearly: 60,
      daysBeforeQuarterly: 30,
      daysBeforeMonthly: 15,
      includeCardContracts: false,
      pipeline: "renovaciones",
    });
  });

  it("respeta lo guardado y descarta lo que no sirve", () => {
    expect(
      ajustesDeRenovaciones({
        active: false,
        daysBeforeYearly: "90",
        daysBeforeQuarterly: -3,
        daysBeforeMonthly: 1000,
        includeCardContracts: true,
        pipeline: "mal valor!",
        systemPipeline: "renovaciones",
      }),
    ).toEqual({
      active: false,
      daysBeforeYearly: 90,
      daysBeforeQuarterly: 30,
      daysBeforeMonthly: 366,
      includeCardContracts: true,
      pipeline: "renovaciones",
      systemPipeline: "renovaciones",
    });
  });

  it("diasValidos acepta 0 y rechaza decimales", () => {
    expect(diasValidos(0, 15)).toBe(0);
    expect(diasValidos(1.5, 15)).toBe(15);
    expect(diasValidos("", 15)).toBe(15);
  });
});

describe("diasDeAnticipacion", () => {
  it("usa la ventana de cada periodicidad", () => {
    expect(diasDeAnticipacion(fabrica, "yearly")).toBe(60);
    expect(diasDeAnticipacion(fabrica, "quarterly")).toBe(30);
    expect(diasDeAnticipacion(fabrica, "monthly")).toBe(15);
  });
});

describe("sumarDias y hoyComoFecha", () => {
  it("cruza meses y años", () => {
    expect(sumarDias("2027-01-10", -60)).toBe("2026-11-11");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("da la fecha local", () => {
    expect(hoyComoFecha(new Date(2026, 9, 5, 23, 0))).toBe("2026-10-05");
  });
});

describe("estadoDeRenovacion", () => {
  const contrato = {
    status: "active",
    billing_period: "yearly",
    renews_on: "2027-01-10",
    provider: "manual",
  };

  it("enseña la oportunidad abierta de la fecha que viene", () => {
    const abierta = {
      id: 7,
      stage: "renovacion-por-contactar",
      renewal_for: "2027-01-10",
    };
    const vieja = { id: 3, stage: "renovada", renewal_for: "2026-01-10" };
    expect(
      estadoDeRenovacion(contrato, [vieja, abierta], fabrica, "2026-11-20"),
    ).toEqual({ tipo: "abierta", oportunidad: abierta });
  });

  it("dice cuándo se abrirá", () => {
    expect(estadoDeRenovacion(contrato, [], fabrica, "2026-10-20")).toEqual({
      tipo: "programada",
      fecha: "2026-11-11",
    });
    expect(
      estadoDeRenovacion(
        { ...contrato, billing_period: "monthly", renews_on: "2026-11-30" },
        [],
        fabrica,
        "2026-10-20",
      ),
    ).toEqual({ tipo: "programada", fecha: "2026-11-15" });
  });

  it("si la ventana ya empezó, se abre en la próxima corrida (hoy)", () => {
    expect(estadoDeRenovacion(contrato, [], fabrica, "2026-12-01")).toEqual({
      tipo: "programada",
      fecha: "2026-12-01",
    });
  });

  it("no aplica a tarjeta, inactivos, sin fecha, pago único o apagado", () => {
    const hoy = "2026-10-20";
    const casos = [
      { ...contrato, provider: "stripe" },
      { ...contrato, status: "cancelled" },
      { ...contrato, renews_on: null },
      { ...contrato, billing_period: "one_time" },
      { ...contrato, renews_on: "2026-10-01" },
    ];
    for (const caso of casos) {
      expect(estadoDeRenovacion(caso, [], fabrica, hoy)).toEqual({
        tipo: "no_aplica",
      });
    }
    expect(
      estadoDeRenovacion(contrato, [], { ...fabrica, active: false }, hoy),
    ).toEqual({ tipo: "no_aplica" });
  });

  it("con tarjeta incluida, también se programa", () => {
    expect(
      estadoDeRenovacion(
        { ...contrato, provider: "stripe" },
        [],
        { ...fabrica, includeCardContracts: true },
        "2026-10-20",
      ).tipo,
    ).toBe("programada");
  });
});

describe("limpiarRenovaciones", () => {
  it("conserva el embudo que agregó el sistema, venga o no del formulario", () => {
    expect(
      limpiarRenovaciones(
        { active: false, daysBeforeYearly: 45, systemPipeline: "otro" },
        { systemPipeline: "renovaciones" },
      ),
    ).toEqual({
      ...fabrica,
      active: false,
      daysBeforeYearly: 45,
      systemPipeline: "renovaciones",
    });
    expect(limpiarRenovaciones({ daysBeforeMonthly: 10 }, undefined)).toEqual({
      ...fabrica,
      daysBeforeMonthly: 10,
    });
  });
});

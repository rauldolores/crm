import { describe, expect, it } from "vitest";

import {
  fechaDeInstante,
  mesesEntre,
  periodoAFacturar,
  sumarDias,
  sumarMeses,
  textoDelPeriodo,
} from "./periodos";

describe("sumarMeses", () => {
  it("respeta el fin de mes", () => {
    expect(sumarMeses("2027-01-31", 1)).toBe("2027-02-28");
    expect(sumarMeses("2028-01-31", 1)).toBe("2028-02-29");
    expect(sumarMeses("2026-11-15", 3)).toBe("2027-02-15");
    expect(sumarMeses("2026-12-01", 12)).toBe("2027-12-01");
  });
});

describe("sumarDias", () => {
  it("cruza meses y años", () => {
    expect(sumarDias("2027-01-01", -15)).toBe("2026-12-17");
    expect(sumarDias("2027-02-28", 1)).toBe("2027-03-01");
  });
});

describe("periodoAFacturar", () => {
  it("un mes, un trimestre y un año, con el fin incluido", () => {
    expect(periodoAFacturar("2027-01-01", "monthly")).toEqual({
      inicio: "2027-01-01",
      fin: "2027-01-31",
    });
    expect(periodoAFacturar("2027-01-01", "quarterly")).toEqual({
      inicio: "2027-01-01",
      fin: "2027-03-31",
    });
    expect(periodoAFacturar("2027-01-15", "yearly")).toEqual({
      inicio: "2027-01-15",
      fin: "2028-01-14",
    });
  });
});

describe("textoDelPeriodo", () => {
  it("un mes completo se dice por su nombre", () => {
    expect(textoDelPeriodo("2027-01-01", "2027-01-31")).toBe("enero 2027");
  });
  it("varios meses completos, abreviados", () => {
    expect(textoDelPeriodo("2027-01-01", "2027-12-31")).toBe(
      "ene 2027 – dic 2027",
    );
  });
  it("si no empieza el día primero, con días", () => {
    expect(textoDelPeriodo("2027-01-15", "2027-02-14")).toBe(
      "15 ene 2027 – 14 feb 2027",
    );
  });
});

describe("mesesEntre", () => {
  it("cuenta los meses del periodo", () => {
    expect(mesesEntre("2027-01-01", "2027-01-31")).toBe(1);
    expect(mesesEntre("2027-01-01", "2027-03-31")).toBe(3);
    expect(mesesEntre("2027-01-15", "2028-01-14")).toBe(12);
  });
});

describe("fechaDeInstante", () => {
  it("lee segundos Unix (Stripe) en hora de México", () => {
    // 2027-02-01T05:59:59Z es todavía 31 de enero en la Ciudad de México.
    expect(fechaDeInstante(Date.UTC(2027, 1, 1, 5, 59, 59) / 1000)).toBe(
      "2027-01-31",
    );
  });
  it("respeta una fecha sin hora y rechaza basura", () => {
    expect(fechaDeInstante("2027-03-01")).toBe("2027-03-01");
    expect(fechaDeInstante("mañana")).toBeNull();
    expect(fechaDeInstante(null)).toBeNull();
  });
});

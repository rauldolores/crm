import { describe, expect, it } from "vitest";

import {
  clavesDelCuerpo,
  limpiarValor,
  rellenarPlantilla,
  SID_DE_PLANTILLA,
  variablesSinRellenar,
} from "./plantillas";

const CUERPO =
  "Hola {{1}}, soy Raúl de Kontrolia. ¿Te viene bien una demo de 15 minutos el {{2}}?";

describe("rellenarPlantilla", () => {
  it("sustituye cada marcador por su valor", () => {
    expect(rellenarPlantilla(CUERPO, { "1": "Ana", "2": "martes" })).toBe(
      "Hola Ana, soy Raúl de Kontrolia. ¿Te viene bien una demo de 15 minutos el martes?",
    );
  });

  it("deja a la vista, con sus llaves, la variable que falta", () => {
    expect(rellenarPlantilla(CUERPO, { "1": "Ana" })).toContain("el {{2}}?");
  });

  it("trata un valor de solo espacios como vacío", () => {
    expect(rellenarPlantilla("Hola {{1}}", { "1": "   " })).toBe("Hola {{1}}");
  });

  it("acepta marcadores con espacios dentro de las llaves", () => {
    expect(rellenarPlantilla("Hola {{ 1 }}", { "1": "Ana" })).toBe("Hola Ana");
  });

  it("repite el mismo valor si el marcador aparece dos veces", () => {
    expect(rellenarPlantilla("{{1}} y {{1}}", { "1": "Ana" })).toBe("Ana y Ana");
  });
});

describe("limpiarValor", () => {
  it("quita saltos de línea, tabuladores y rachas de espacios, que Meta rechaza", () => {
    expect(limpiarValor("  Ana\nMaría\t  López  ")).toBe("Ana María López");
  });
});

describe("clavesDelCuerpo", () => {
  it("devuelve las claves sin repetir y en orden de aparición", () => {
    expect(clavesDelCuerpo("{{2}} {{1}} {{2}}")).toEqual(["2", "1"]);
  });

  it("devuelve una lista vacía si no hay marcadores", () => {
    expect(clavesDelCuerpo("Sin variables")).toEqual([]);
  });
});

describe("variablesSinRellenar", () => {
  const plantilla = {
    variables: [
      { clave: "1", ejemplo: "Juan" },
      { clave: "2", ejemplo: "martes" },
    ],
  };

  it("lista las que aún no tienen valor", () => {
    expect(variablesSinRellenar(plantilla, { "1": "Ana", "2": " " })).toEqual([
      "2",
    ]);
  });

  it("devuelve vacío cuando están todas", () => {
    expect(
      variablesSinRellenar(plantilla, { "1": "Ana", "2": "martes" }),
    ).toEqual([]);
  });
});

describe("SID_DE_PLANTILLA", () => {
  it("acepta un Content SID de Twilio y rechaza lo demás", () => {
    expect(SID_DE_PLANTILLA.test(`HX${"a".repeat(32)}`)).toBe(true);
    expect(SID_DE_PLANTILLA.test(`MG${"a".repeat(32)}`)).toBe(false);
    expect(SID_DE_PLANTILLA.test("HX123")).toBe(false);
  });
});

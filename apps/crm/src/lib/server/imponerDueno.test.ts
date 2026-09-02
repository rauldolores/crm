import { describe, it, expect } from "vitest";

import { imponerDueno } from "./imponerDueno";

const ORG = "25e354a1-95e6-4b88-afc2-d7a991f5e164";

describe("imponerDueno", () => {
  it("impone la organización aunque el cliente mande otra", () => {
    // Arrange
    const cuerpo = JSON.stringify({
      text: "Llamar",
      organization_id: "de-otra-empresa",
    });

    // Act
    const resultado = JSON.parse(imponerDueno(cuerpo, ORG, null));

    // Assert
    expect(resultado.organization_id).toBe(ORG);
  });

  it("pone como responsable a quien crea la fila", () => {
    const resultado = JSON.parse(
      imponerDueno(JSON.stringify({ text: "Llamar" }), ORG, 9),
    );

    expect(resultado.sales_id).toBe(9);
  });

  it("respeta el responsable que eligió el formulario", () => {
    const resultado = JSON.parse(
      imponerDueno(JSON.stringify({ text: "Llamar", sales_id: 10 }), ORG, 9),
    );

    expect(resultado.sales_id).toBe(10);
  });

  it("rellena el responsable cuando viene explícitamente nulo", () => {
    const resultado = JSON.parse(
      imponerDueno(JSON.stringify({ text: "Llamar", sales_id: null }), ORG, 9),
    );

    expect(resultado.sales_id).toBe(9);
  });

  it("deja la fila sin responsable cuando no hay sesión, como una clave de API", () => {
    const resultado = JSON.parse(
      imponerDueno(JSON.stringify({ text: "Llamar" }), ORG, null),
    );

    expect(resultado.sales_id).toBeUndefined();
  });

  it("trata igual cada fila de un alta en lote", () => {
    const resultado = JSON.parse(
      imponerDueno(
        JSON.stringify([{ text: "Una" }, { text: "Otra", sales_id: 10 }]),
        ORG,
        9,
      ),
    );

    expect(resultado).toEqual([
      { text: "Una", organization_id: ORG, sales_id: 9 },
      { text: "Otra", organization_id: ORG, sales_id: 10 },
    ]);
  });

  it("devuelve tal cual un cuerpo que no es JSON", () => {
    expect(imponerDueno("no soy json", ORG, 9)).toBe("no soy json");
  });
});

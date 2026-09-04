import { describe, it, expect } from "vitest";

import { restringirAPropios } from "./restringirAPropios";

describe("restringirAPropios", () => {
  it("fuerza el sales_id del afiliado aunque el cliente no mande ninguno", () => {
    const resultado = JSON.parse(
      restringirAPropios(JSON.stringify({ first_name: "Ana" }), 9),
    );

    expect(resultado.sales_id).toBe(9);
  });

  it("sobrescribe el sales_id que mande el cliente, a diferencia de imponerDueno", () => {
    const resultado = JSON.parse(
      restringirAPropios(
        JSON.stringify({ first_name: "Ana", sales_id: 999 }),
        9,
      ),
    );

    expect(resultado.sales_id).toBe(9);
  });

  it("trata igual cada fila de un alta en lote", () => {
    const resultado = JSON.parse(
      restringirAPropios(
        JSON.stringify([
          { name: "Una" },
          { name: "Otra", sales_id: 999 },
        ]),
        9,
      ),
    );

    expect(resultado).toEqual([
      { name: "Una", sales_id: 9 },
      { name: "Otra", sales_id: 9 },
    ]);
  });

  it("devuelve tal cual un cuerpo que no es JSON", () => {
    expect(restringirAPropios("no soy json", 9)).toBe("no soy json");
  });
});

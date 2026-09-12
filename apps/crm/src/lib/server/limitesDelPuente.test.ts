import { describe, expect, it } from "vitest";

import { contactosNuevos, embudosNuevos, idsDe } from "./limitesDelPuente";

describe("contactosNuevos", () => {
  it("cuenta uno para un alta simple y todos para una importación", () => {
    expect(contactosNuevos(JSON.stringify({ first_name: "Ana" }))).toBe(1);
    expect(
      contactosNuevos(JSON.stringify([{ first_name: "A" }, { first_name: "B" }])),
    ).toBe(2);
  });

  it("no cuenta nada si el cuerpo no son filas", () => {
    // Un cuerpo vacío o roto no debe bloquear ni consumir cupo.
    expect(contactosNuevos("")).toBe(0);
    expect(contactosNuevos("no es json")).toBe(0);
  });
});

describe("idsDe", () => {
  it("saca los ids de lo que devolvió PostgREST", () => {
    expect(idsDe(JSON.stringify([{ id: 7 }, { id: 8, name: "x" }]))).toEqual([
      7, 8,
    ]);
  });

  it("ignora filas sin id, que no se pueden contar de forma idempotente", () => {
    expect(idsDe(JSON.stringify([{ name: "sin id" }]))).toEqual([]);
  });
});

describe("embudosNuevos", () => {
  const guardado = {
    dealPipelines: [{ value: "ventas" }, { value: "soporte" }],
  };

  it("devuelve solo los embudos que no existían", () => {
    const cuerpo = JSON.stringify({
      config: {
        dealPipelines: [
          { value: "ventas" },
          { value: "soporte" },
          { value: "renovaciones" },
        ],
      },
    });

    expect(embudosNuevos(cuerpo, guardado)).toEqual(["renovaciones"]);
  });

  it("no cuenta nada al guardar Ajustes sin tocar los embudos", () => {
    const cuerpo = JSON.stringify({
      config: { dealPipelines: [{ value: "ventas" }, { value: "soporte" }] },
    });

    expect(embudosNuevos(cuerpo, guardado)).toEqual([]);
  });

  it("cuenta todos la primera vez, cuando la configuración está vacía", () => {
    // Al aprovisionar, la fila se crea con config {} y el primer guardado
    // trae el embudo por defecto: ese sí es un embudo nuevo.
    const cuerpo = JSON.stringify({
      config: { dealPipelines: [{ value: "ventas" }] },
    });

    expect(embudosNuevos(cuerpo, {})).toEqual(["ventas"]);
    expect(embudosNuevos(cuerpo, null)).toEqual(["ventas"]);
  });

  it("no cuenta nada si la escritura no trae embudos", () => {
    expect(embudosNuevos(JSON.stringify({ config: { currency: "MXN" } }), guardado)).toEqual([]);
  });
});

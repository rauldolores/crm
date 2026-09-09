import { describe, expect, it } from "vitest";

import { acotarLimite, construirSet, LIMITE_MAXIMO } from "./consultas";

describe("construirSet", () => {
  it("solo incluye los campos que llegaron", () => {
    // Las herramientas de edición reciben todo opcional: el agente manda solo
    // lo que cambia, y lo ausente debe quedarse como está.
    const { set, parametros } = construirSet({
      first_name: "Ana",
      last_name: undefined,
      title: "CTO",
    });

    expect(set).toBe("first_name = $1, title = $2");
    expect(parametros).toEqual(["Ana", "CTO"]);
  });

  it("numera los parámetros desde donde se le diga", () => {
    // El id del registro ocupa su propio hueco al final, así que a veces el
    // SET tiene que empezar más adelante.
    const { set } = construirSet({ a: 1, b: 2 }, 3);

    expect(set).toBe("a = $3, b = $4");
  });

  it("conserva un null explícito, que es vaciar el campo", () => {
    const { set, parametros } = construirSet({ sales_id: null });

    expect(set).toBe("sales_id = $1");
    expect(parametros).toEqual([null]);
  });

  it("devuelve vacío cuando no llegó ningún campo", () => {
    // Es lo que las herramientas detectan para avisar en vez de lanzar un
    // UPDATE sin SET, que sería un error de sintaxis.
    const { set, parametros } = construirSet({ a: undefined });

    expect(set).toBe("");
    expect(parametros).toEqual([]);
  });
});

describe("acotarLimite", () => {
  it("usa 25 cuando el agente no pide un límite", () => {
    expect(acotarLimite(undefined)).toBe(25);
  });

  it("respeta el límite pedido", () => {
    expect(acotarLimite(10)).toBe(10);
  });

  it("no deja pedir más del máximo", () => {
    // Sin tope, un agente pidiendo 10.000 filas llenaría su propio contexto.
    expect(acotarLimite(10_000)).toBe(LIMITE_MAXIMO);
  });

  it("no deja pedir cero ni negativos", () => {
    expect(acotarLimite(0)).toBe(1);
    expect(acotarLimite(-5)).toBe(1);
  });
});

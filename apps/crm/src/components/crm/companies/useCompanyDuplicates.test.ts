import { describe, expect, it } from "vitest";

import { palabraMasLarga } from "./useCompanyDuplicates";

describe("palabraMasLarga", () => {
  it("se queda con la palabra que de verdad identifica a la empresa", () => {
    expect(palabraMasLarga("Panadería Lola S.A. de C.V.")).toBe("Panadería");
    expect(palabraMasLarga("Grupo Bimbo")).toBe("Grupo");
  });

  it("descarta la forma jurídica y la puntuación", () => {
    expect(palabraMasLarga("Lolita S.A. de C.V.")).toBe("Lolita");
    expect(palabraMasLarga("Aceros (Noroeste)")).toBe("Noroeste");
  });

  it("no busca con menos de cuatro letras: encontraría medio fichero", () => {
    expect(palabraMasLarga("Pan")).toBe("");
    expect(palabraMasLarga("S.A.")).toBe("");
    expect(palabraMasLarga("")).toBe("");
  });
});

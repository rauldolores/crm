import { describe, expect, it } from "vitest";

import { borraAlUsuarioDeLaSesion, idsDelFiltro } from "./borradoDeUsuarios";

const parametros = (busqueda: string) => new URLSearchParams(busqueda);

describe("idsDelFiltro", () => {
  it("lee una fila y varias, que es como borra el proveedor de datos", () => {
    expect(idsDelFiltro("eq.7")).toEqual(["7"]);
    expect(idsDelFiltro("in.(7,9,11)")).toEqual(["7", "9", "11"]);
    expect(idsDelFiltro('in.("7", "9")')).toEqual(["7", "9"]);
  });

  it("devuelve null con un filtro que no sabe leer", () => {
    expect(idsDelFiltro(null)).toBeNull();
    expect(idsDelFiltro("gt.3")).toBeNull();
  });
});

describe("borraAlUsuarioDeLaSesion", () => {
  it("corta el borrado de la propia fila, sola o dentro de una selección", () => {
    expect(borraAlUsuarioDeLaSesion(parametros("id=eq.7"), 7)).toBe(true);
    expect(borraAlUsuarioDeLaSesion(parametros("id=in.(3,7)"), 7)).toBe(true);
  });

  it("deja pasar el borrado de otra persona del equipo", () => {
    expect(borraAlUsuarioDeLaSesion(parametros("id=eq.3"), 7)).toBe(false);
    expect(borraAlUsuarioDeLaSesion(parametros("id=in.(3,9)"), 7)).toBe(false);
  });

  it("corta un borrado sin filtro de id: se llevaría al equipo entero", () => {
    expect(borraAlUsuarioDeLaSesion(parametros("organization_id=eq.x"), 7)).toBe(
      true,
    );
    expect(borraAlUsuarioDeLaSesion(parametros("id=gt.0"), 7)).toBe(true);
  });

  it("no aplica cuando quien pide no tiene fila propia (una clave de API)", () => {
    expect(borraAlUsuarioDeLaSesion(parametros(""), null)).toBe(false);
  });
});

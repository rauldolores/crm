import { describe, expect, test } from "vitest";

import { repartir } from "./repartir";

const oportunidad = (
  id: number,
  empresa: number | null,
  contactos: number[] | null,
) => ({ id, company_id: empresa, contact_ids: contactos });

describe("repartir", () => {
  test("reparte por turnos, con una de diferencia como mucho", () => {
    const lote = [1, 2, 3, 4, 5].map((id) => oportunidad(id, null, null));

    const reparto = repartir(lote, [18, 27]);

    expect(reparto.get(18)?.oportunidades).toEqual([1, 3, 5]);
    expect(reparto.get(27)?.oportunidades).toEqual([2, 4]);
  });

  test("con cada oportunidad van su contacto y su empresa", () => {
    const reparto = repartir(
      [oportunidad(1, 100, [10]), oportunidad(2, 200, [20, 21])],
      [18, 27],
    );

    expect(reparto.get(18)).toEqual({
      oportunidades: [1],
      contactos: [10],
      empresas: [100],
    });
    expect(reparto.get(27)).toEqual({
      oportunidades: [2],
      contactos: [20, 21],
      empresas: [200],
    });
  });

  test("un contacto o empresa compartidos se quedan con quien recibió la primera oportunidad", () => {
    const reparto = repartir(
      [oportunidad(1, 100, [10]), oportunidad(2, 100, [10])],
      [18, 27],
    );

    expect(reparto.get(18)?.contactos).toEqual([10]);
    expect(reparto.get(18)?.empresas).toEqual([100]);
    expect(reparto.get(27)).toEqual({
      oportunidades: [2],
      contactos: [],
      empresas: [],
    });
  });

  test("quien no recibe nada aparece igual, con las listas vacías", () => {
    const reparto = repartir([oportunidad(1, null, null)], [18, 27, 28]);

    expect(reparto.get(28)).toEqual({
      oportunidades: [],
      contactos: [],
      empresas: [],
    });
  });

  test("sin responsables no reparte nada", () => {
    expect(repartir([oportunidad(1, null, null)], []).size).toBe(0);
  });
});

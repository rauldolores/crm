import { describe, expect, test } from "vitest";

import { repartirDestinatarios } from "./destinatarios";

const oportunidad = (id: number, contactos: number[] | null) => ({
  id,
  contact_ids: contactos,
});

describe("repartirDestinatarios", () => {
  test("encola una por oportunidad, con el contacto ligado", () => {
    const { aEncolar, omitidos } = repartirDestinatarios(
      [oportunidad(1, [10]), oportunidad(2, [20])],
      new Set([10, 20]),
      new Set(),
    );

    expect(aEncolar).toEqual([
      { dealId: 1, contactId: 10 },
      { dealId: 2, contactId: 20 },
    ]);
    expect(omitidos).toEqual({});
  });

  test("usa el primer contacto cuando la oportunidad tiene varios", () => {
    const { aEncolar } = repartirDestinatarios(
      [oportunidad(1, [10, 11, 12])],
      new Set([10, 11, 12]),
      new Set(),
    );

    expect(aEncolar).toEqual([{ dealId: 1, contactId: 10 }]);
  });

  test("omite la que no tiene contacto: no hay a quién escribir", () => {
    const { aEncolar, omitidos } = repartirDestinatarios(
      [oportunidad(1, null), oportunidad(2, [])],
      new Set(),
      new Set(),
    );

    expect(aEncolar).toEqual([]);
    expect(omitidos).toEqual({ "sin-contacto": 2 });
  });

  test("omite la que tiene contacto sin correo", () => {
    const { aEncolar, omitidos } = repartirDestinatarios(
      [oportunidad(1, [10]), oportunidad(2, [20])],
      new Set([10]),
      new Set(),
    );

    expect(aEncolar).toEqual([{ dealId: 1, contactId: 10 }]);
    expect(omitidos).toEqual({ "sin-correo": 1 });
  });

  test("repetir la acción no vuelve a encolar: ya tenía ese correo", () => {
    const { aEncolar, omitidos } = repartirDestinatarios(
      [oportunidad(1, [10]), oportunidad(2, [20])],
      new Set([10, 20]),
      new Set([1]),
    );

    expect(aEncolar).toEqual([{ dealId: 2, contactId: 20 }]);
    expect(omitidos).toEqual({ "ya-encolado": 1 });
  });

  test("«ya encolado» gana a «sin correo»: si se encoló, correo tenía", () => {
    const { omitidos } = repartirDestinatarios(
      [oportunidad(1, [10])],
      new Set(),
      new Set([1]),
    );

    expect(omitidos).toEqual({ "ya-encolado": 1 });
  });

  test("solo informa de los motivos que ocurrieron", () => {
    const { aEncolar, omitidos } = repartirDestinatarios(
      [
        oportunidad(1, [10]),
        oportunidad(2, null),
        oportunidad(3, [30]),
        oportunidad(4, [40]),
      ],
      new Set([10, 40]),
      new Set([4]),
    );

    expect(aEncolar).toEqual([{ dealId: 1, contactId: 10 }]);
    expect(omitidos).toEqual({
      "sin-contacto": 1,
      "sin-correo": 1,
      "ya-encolado": 1,
    });
  });

  test("sin oportunidades no inventa nada", () => {
    expect(repartirDestinatarios([], new Set(), new Set())).toEqual({
      aEncolar: [],
      omitidos: {},
    });
  });
});

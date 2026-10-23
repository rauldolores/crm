import { describe, expect, test } from "vitest";

import type { Deal } from "../types";
import { getDealsByStage } from "./stages";

/**
 * Lo que se fija aquí es el contrato que hay que respetar al pintar el
 * tablero: el agrupamiento solo tiene claves para las etapas que se le
 * pasaron. Quien lo indexe por una etapa de otro embudo recibe `undefined`,
 * y el tipo (`Record<string, Deal[]>`) no lo avisa porque una firma de índice
 * da por hecho que siempre hay valor.
 *
 * De ahí vino el fallo de «algo ha salido mal» al cambiar de embudo: el
 * render ya pintaba las etapas del embudo nuevo mientras el agrupamiento
 * seguía siendo el del anterior.
 */

const etapasDeVentas = [
  { value: "opportunity", label: "Oportunidad" },
  { value: "won", label: "Ganada" },
];
const etapasDeProspeccion = [
  { value: "opportunity", label: "Por contactar" },
  { value: "whatsapp", label: "WhatsApp" },
];

const oportunidad = (id: number, stage: string, index: number): Deal =>
  ({ id, stage, index }) as Deal;

describe("getDealsByStage", () => {
  test("agrupa por etapa y ordena cada columna por su índice", () => {
    const porEtapa = getDealsByStage(
      [
        oportunidad(1, "opportunity", 2),
        oportunidad(2, "opportunity", 1),
        oportunidad(3, "won", 0),
      ],
      etapasDeVentas,
    );

    expect(porEtapa.opportunity.map((d) => d.id)).toEqual([2, 1]);
    expect(porEtapa.won.map((d) => d.id)).toEqual([3]);
  });

  test("solo crea claves para las etapas que se le pasaron", () => {
    const porEtapa = getDealsByStage([], etapasDeVentas);

    expect(Object.keys(porEtapa).sort()).toEqual(["opportunity", "won"]);
  });

  test("una etapa de otro embudo da undefined: el tablero debe preverlo", () => {
    const porEtapa = getDealsByStage(
      [oportunidad(1, "opportunity", 0)],
      etapasDeVentas,
    );

    // Esto es exactamente lo que recibía DealColumn al cambiar de Ventas a
    // Prospección fría antes del arreglo.
    expect(porEtapa[etapasDeProspeccion[1].value]).toBeUndefined();
  });

  test("sin etapas devuelve vacío, así que cualquier clave es undefined", () => {
    const porEtapa = getDealsByStage([oportunidad(1, "opportunity", 0)], []);

    expect(porEtapa).toEqual({});
    expect(porEtapa.opportunity).toBeUndefined();
  });

  test("una oportunidad con etapa desconocida cae en la primera", () => {
    const porEtapa = getDealsByStage(
      [oportunidad(1, "etapa-que-ya-no-existe", 0)],
      etapasDeVentas,
    );

    expect(porEtapa.opportunity.map((d) => d.id)).toEqual([1]);
    expect(porEtapa.won).toEqual([]);
  });
});

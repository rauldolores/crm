import { describe, expect, it } from "vitest";

import type { OportunidadDeInforme } from "../providers/commons/datosDeInformes";
import type { Sale, Ticket } from "../types";
import { desempenoDelEquipo } from "./metricasDelEquipo";

const ahora = new Date("2026-10-21T12:00:00Z");
const desde = new Date("2026-10-01T00:00:00Z");
const embudo = {
  value: "ventas",
  pipelineStatuses: ["won"],
  lostStages: ["lost"],
};

const comercial = (id: number, nombre: string, disabled = false) =>
  ({ id, first_name: nombre, last_name: "", disabled }) as Sale;

const oportunidad = (
  datos: Partial<OportunidadDeInforme>,
): OportunidadDeInforme => ({
  id: Math.random(),
  stage: "lead",
  pipeline: "ventas",
  amount: 100,
  sales_id: 1,
  created_at: "2026-10-10T00:00:00Z",
  updated_at: "2026-10-10T00:00:00Z",
  expected_closing_date: "2026-11-01",
  ...datos,
});

const calcular = (datos: Partial<Parameters<typeof desempenoDelEquipo>[0]>) =>
  desempenoDelEquipo({
    comerciales: [comercial(1, "Ana"), comercial(2, "Beto")],
    oportunidades: [],
    tareas: [],
    notas: [],
    tickets: [],
    embudo,
    desde,
    sinResponsable: "Sin responsable",
    ahora,
    ...datos,
  });

describe("desempenoDelEquipo", () => {
  it("cuenta las oportunidades abiertas de cada quien, sin importar cuándo se crearon", () => {
    const filas = calcular({
      oportunidades: [
        oportunidad({ sales_id: 1, amount: 300 }),
        oportunidad({ sales_id: 1, created_at: "2025-01-01T00:00:00Z" }),
        oportunidad({ sales_id: 2, stage: "won" }),
      ],
    });

    const ana = filas.find((fila) => fila.nombre === "Ana");
    expect(ana).toMatchObject({ abiertas: 2, importeAbierto: 400, nuevas: 1 });
    expect(filas.find((fila) => fila.nombre === "Beto")?.abiertas).toBe(0);
  });

  it("calcula ganadas, perdidas y conversión del periodo y ordena por lo vendido", () => {
    const filas = calcular({
      oportunidades: [
        oportunidad({ sales_id: 1, stage: "won", amount: 100 }),
        oportunidad({ sales_id: 2, stage: "won", amount: 500 }),
        oportunidad({ sales_id: 2, stage: "lost" }),
        // Ganada fuera del periodo: no cuenta.
        oportunidad({
          sales_id: 1,
          stage: "won",
          amount: 9999,
          created_at: "2026-01-01T00:00:00Z",
        }),
      ],
    });

    expect(filas.map((fila) => fila.nombre)).toEqual(["Beto", "Ana"]);
    expect(filas[0]).toMatchObject({
      ganadas: 1,
      importeGanado: 500,
      perdidas: 1,
      conversion: 50,
    });
    expect(filas[1]).toMatchObject({ importeGanado: 100, conversion: 100 });
  });

  it("ignora las oportunidades de otros embudos y las archivadas no cuentan como abiertas", () => {
    const filas = calcular({
      oportunidades: [
        oportunidad({ pipeline: "otro" }),
        oportunidad({ archived_at: "2026-10-15T00:00:00Z" }),
      ],
    });

    expect(filas.find((fila) => fila.nombre === "Ana")).toMatchObject({
      abiertas: 0,
      nuevas: 1,
    });
  });

  it("cuenta tareas completadas en el periodo y vencidas a hoy", () => {
    const filas = calcular({
      tareas: [
        {
          id: 1,
          sales_id: 1,
          due_date: null,
          done_date: "2026-10-05T00:00:00Z",
        },
        {
          id: 2,
          sales_id: 1,
          due_date: "2026-10-20T00:00:00Z",
          done_date: null,
        },
        {
          id: 3,
          sales_id: 1,
          due_date: "2026-12-01T00:00:00Z",
          done_date: null,
        },
        {
          id: 4,
          sales_id: 1,
          due_date: null,
          done_date: "2026-09-01T00:00:00Z",
        },
      ],
    });

    expect(filas.find((fila) => fila.nombre === "Ana")).toMatchObject({
      tareasCompletadas: 1,
      tareasVencidas: 1,
    });
  });

  it("cuenta notas del periodo y tickets abiertos y cerrados", () => {
    const filas = calcular({
      notas: [
        { sales_id: 2, date: "2026-10-03T00:00:00Z" },
        { sales_id: 2, date: "2026-08-03T00:00:00Z" },
      ],
      tickets: [
        { sales_id: 2, status: "open" },
        { sales_id: 2, status: "closed", closed_at: "2026-10-09T00:00:00Z" },
      ] as Ticket[],
    });

    expect(filas.find((fila) => fila.nombre === "Beto")).toMatchObject({
      notas: 1,
      ticketsAbiertos: 1,
      ticketsCerrados: 1,
    });
  });

  it("agrega «Sin responsable» al final solo si tiene algo, y oculta a quien está desactivado sin nada", () => {
    const filas = calcular({
      comerciales: [comercial(1, "Ana"), comercial(3, "Ceci", true)],
      oportunidades: [oportunidad({ sales_id: null as never })],
    });

    expect(filas.map((fila) => fila.nombre)).toEqual([
      "Ana",
      "Sin responsable",
    ]);
  });
});

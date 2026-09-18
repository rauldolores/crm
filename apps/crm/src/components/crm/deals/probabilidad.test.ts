import { describe, expect, it } from "vitest";

import type { Deal } from "../types";
import {
  importePonderado,
  probabilidadDeEtapa,
  pronosticoPorMes,
} from "./probabilidad";

// Etapas propias (no las de serie), para probar el reparto por orden.
const embudo = {
  stages: [
    { value: "primer-contacto", label: "Primer contacto" },
    { value: "proposal-sent", label: "Propuesta enviada", probability: 60 },
    { value: "negotiation", label: "Negociación" },
    { value: "won", label: "Ganada" },
    { value: "lost", label: "Perdida" },
  ],
  pipelineStatuses: ["won"],
  lostStages: ["lost"],
};

const oportunidad = (overrides: Partial<Deal>): Deal =>
  ({
    id: 1,
    name: "x",
    stage: "primer-contacto",
    pipeline: "ventas",
    amount: 1000,
    contact_ids: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }) as Deal;

describe("probabilidadDeEtapa", () => {
  it("usa la configurada; ganadas 100 y perdidas 0", () => {
    expect(probabilidadDeEtapa(embudo, "proposal-sent")).toBe(60);
    expect(probabilidadDeEtapa(embudo, "won")).toBe(100);
    expect(probabilidadDeEtapa(embudo, "lost")).toBe(0);
  });

  it("sin configurar, reparte las abiertas por su orden en el embudo", () => {
    // Tres abiertas: 25, (60 configurada), 75.
    expect(probabilidadDeEtapa(embudo, "primer-contacto")).toBe(25);
    expect(probabilidadDeEtapa(embudo, "negotiation")).toBe(75);
  });

  it("una etapa de serie sin configurar toma la probabilidad de serie, no la del orden", () => {
    const conAplazada = {
      ...embudo,
      stages: [...embudo.stages, { value: "delayed", label: "Aplazada" }],
    };
    expect(probabilidadDeEtapa(conAplazada, "delayed")).toBe(10);
  });

  it("acota una configuración fuera de rango", () => {
    expect(
      probabilidadDeEtapa(
        { ...embudo, stages: [{ value: "a", label: "A", probability: 140 }] },
        "a",
      ),
    ).toBe(100);
  });
});

describe("importePonderado", () => {
  it("es importe por probabilidad", () => {
    expect(
      importePonderado({ amount: 2000, stage: "proposal-sent" }, embudo),
    ).toBe(1200);
    expect(
      importePonderado({ amount: null as never, stage: "won" }, embudo),
    ).toBe(0);
  });
});

describe("pronosticoPorMes", () => {
  const hoy = new Date(2026, 8, 18); // 18 de septiembre de 2026

  it("agrupa lo abierto por mes previsto, cuenta lo vencido en el mes actual y aparta lo sin fecha", () => {
    // Arrange
    const deals = [
      oportunidad({ id: 1, expected_closing_date: "2026-10-05", amount: 1000 }),
      oportunidad({
        id: 2,
        expected_closing_date: "2026-10-20",
        amount: 500,
        stage: "proposal-sent",
      }),
      // Vencida: se esperaba en julio y sigue abierta → cuenta ahora.
      oportunidad({ id: 3, expected_closing_date: "2026-07-01", amount: 300 }),
      oportunidad({ id: 4, expected_closing_date: null as never, amount: 100 }),
      // Ganada y archivada: fuera del pronóstico.
      oportunidad({ id: 5, expected_closing_date: "2026-10-01", stage: "won" }),
      oportunidad({
        id: 6,
        expected_closing_date: "2026-10-01",
        archived_at: "2026-09-01T00:00:00.000Z",
      }),
    ];

    // Act
    const meses = pronosticoPorMes(deals, embudo, {
      meses: 3,
      hoy,
      sinFecha: "Sin fecha",
    });

    // Assert
    expect(meses.map((m) => m.clave)).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
      "sin-fecha",
    ]);
    expect(meses[0]).toMatchObject({
      abierto: 300,
      ponderado: 75,
      oportunidades: 1,
    });
    expect(meses[1]).toMatchObject({
      abierto: 1500,
      ponderado: 250 + 300,
      oportunidades: 2,
    });
    expect(meses[2]).toMatchObject({ abierto: 0, oportunidades: 0 });
    expect(meses[3]).toMatchObject({ abierto: 100, oportunidades: 1 });
    expect(meses[1].etiqueta).toBe("Octubre de 2026");
  });

  it("no añade la fila sin fecha cuando todo tiene fecha", () => {
    const meses = pronosticoPorMes(
      [oportunidad({ expected_closing_date: "2026-09-30" })],
      embudo,
      { meses: 2, hoy, sinFecha: "Sin fecha" },
    );
    expect(meses).toHaveLength(2);
  });
});

import { describe, expect, test } from "vitest";

import type { Ticket, TicketEvent } from "../types";
import { metricasDeSoporte } from "./metricasDeSoporte";

const AHORA = new Date("2026-09-18T12:00:00Z");
const HACE_30_DIAS = new Date("2026-08-19T12:00:00Z");

let siguienteId = 1;
const ticket = (extra: Partial<Ticket>): Ticket => ({
  id: siguienteId++,
  subject: "Prueba",
  status: "open",
  contact_id: 1,
  company_id: 1,
  priority: "normal",
  created_at: "2026-09-10T08:00:00Z",
  ...extra,
});

describe("metricasDeSoporte", () => {
  test("cuenta creados y cerrados del periodo, y abiertos y vencidos de ahora", () => {
    const tickets = [
      ticket({ created_at: "2026-09-10T08:00:00Z" }),
      ticket({
        created_at: "2026-07-01T08:00:00Z",
        status: "closed",
        closed_at: "2026-09-12T08:00:00Z",
      }),
      ticket({
        created_at: "2026-07-01T08:00:00Z",
        due_at: "2026-09-01T00:00:00Z",
      }),
    ];

    const m = metricasDeSoporte(tickets, [], HACE_30_DIAS, AHORA);

    expect(m.creados).toBe(1);
    expect(m.cerrados).toBe(1);
    expect(m.abiertos).toBe(2);
    expect(m.vencidos).toBe(1);
  });

  test("las medias salen en horas y solo de los tickets con dato", () => {
    const tickets = [
      ticket({
        created_at: "2026-09-10T08:00:00Z",
        first_response_at: "2026-09-10T10:00:00Z",
      }),
      ticket({
        created_at: "2026-09-11T08:00:00Z",
        first_response_at: "2026-09-11T12:00:00Z",
      }),
      ticket({ created_at: "2026-09-12T08:00:00Z" }),
    ];

    const m = metricasDeSoporte(tickets, [], HACE_30_DIAS, AHORA);

    expect(m.mediaPrimeraRespuestaHoras).toBe(3);
    expect(m.mediaResolucionHoras).toBeNull();
  });

  test("el cumplimiento de SLA se calcula sobre los cerrados con plazo", () => {
    const tickets = [
      ticket({
        status: "closed",
        due_at: "2026-09-12T00:00:00Z",
        closed_at: "2026-09-11T00:00:00Z",
      }),
      ticket({
        status: "closed",
        due_at: "2026-09-12T00:00:00Z",
        closed_at: "2026-09-13T00:00:00Z",
      }),
      ticket({ status: "closed", closed_at: "2026-09-13T00:00:00Z" }),
    ];

    const m = metricasDeSoporte(tickets, [], HACE_30_DIAS, AHORA);

    expect(m.conPlazo).toBe(2);
    expect(m.slaCumplidoPct).toBe(50);
  });

  test("CSAT promedia las encuestas respondidas en el periodo", () => {
    const tickets = [
      ticket({
        satisfaction_rating: 5,
        satisfaction_at: "2026-09-10T00:00:00Z",
      }),
      ticket({
        satisfaction_rating: 3,
        satisfaction_at: "2026-09-11T00:00:00Z",
      }),
      ticket({
        satisfaction_rating: 1,
        satisfaction_at: "2026-01-01T00:00:00Z",
      }),
    ];

    const m = metricasDeSoporte(tickets, [], HACE_30_DIAS, AHORA);

    expect(m.csat).toBe(4);
    expect(m.encuestas).toBe(2);
  });

  test("reparte por categoría (sin categoría aparte) y abiertos por responsable", () => {
    const tickets = [
      ticket({ category: "billing", sales_id: 9 }),
      ticket({ category: "billing", sales_id: null }),
      ticket({ category: null, sales_id: 9, status: "closed" }),
    ];
    const reaperturas: TicketEvent[] = [
      {
        id: 1,
        ticket_id: 1,
        field: "status",
        old_value: "closed",
        new_value: "open",
        created_at: "2026-09-15T00:00:00Z",
      },
    ];

    const m = metricasDeSoporte(tickets, reaperturas, HACE_30_DIAS, AHORA);

    expect(m.porCategoria).toEqual({ billing: 2, "": 1 });
    expect(m.abiertosPorResponsable).toEqual({ "9": 1, "": 1 });
    expect(m.reaperturas).toBe(1);
  });
});

import { describe, expect, test } from "vitest";

import type { Ticket } from "../types";
import { plazosDeTicket } from "./plazosDeTicket";

const AHORA = new Date("2026-09-18T12:00:00Z");

const ticket = (extra: Partial<Ticket>): Ticket => ({
  id: 1,
  subject: "Prueba",
  status: "open",
  contact_id: 1,
  company_id: 1,
  priority: "normal",
  created_at: "2026-09-18T08:00:00Z",
  ...extra,
});

describe("plazosDeTicket", () => {
  test("sin plazos configurados no hay nada que evaluar", () => {
    const { respuesta, resolucion } = plazosDeTicket(ticket({}), AHORA);

    expect(respuesta.estado).toBe("none");
    expect(resolucion.estado).toBe("none");
  });

  test("un plazo futuro queda pendiente con el tiempo que falta", () => {
    const { resolucion } = plazosDeTicket(
      ticket({ due_at: "2026-09-18T15:00:00Z" }),
      AHORA,
    );

    expect(resolucion.estado).toBe("pending");
    expect(resolucion.distancia).toBe("3 horas");
  });

  test("un plazo pasado sin respuesta está vencido", () => {
    const { respuesta } = plazosDeTicket(
      ticket({ first_response_due_at: "2026-09-18T10:00:00Z" }),
      AHORA,
    );

    expect(respuesta.estado).toBe("overdue");
    expect(respuesta.distancia).toBe("2 horas");
  });

  test("la primera respuesta dentro del plazo se da por cumplida", () => {
    const { respuesta } = plazosDeTicket(
      ticket({
        first_response_due_at: "2026-09-18T10:00:00Z",
        first_response_at: "2026-09-18T09:00:00Z",
      }),
      AHORA,
    );

    expect(respuesta.estado).toBe("met");
  });

  test("un ticket cerrado después de su plazo se resolvió tarde", () => {
    const { resolucion } = plazosDeTicket(
      ticket({
        status: "closed",
        due_at: "2026-09-18T10:00:00Z",
        closed_at: "2026-09-18T11:00:00Z",
      }),
      AHORA,
    );

    expect(resolucion.estado).toBe("late");
    expect(resolucion.distancia).toBe("1 hora");
  });

  test("un ticket abierto no cuenta como resuelto aunque tenga plazo", () => {
    const { resolucion } = plazosDeTicket(
      ticket({ due_at: "2026-09-18T10:00:00Z", closed_at: null }),
      AHORA,
    );

    expect(resolucion.estado).toBe("overdue");
  });
});

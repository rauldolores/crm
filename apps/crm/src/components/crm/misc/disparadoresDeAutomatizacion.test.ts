import { describe, expect, test } from "vitest";

import type { Automation } from "../types";
import {
  admiteAsignarResponsable,
  describirDisparador,
  disparadoresDisponibles,
  parametrosDelDisparador,
} from "./disparadoresDeAutomatizacion";

/** Traductor de prueba: devuelve la clave con sus argumentos, sin catálogo. */
const translate = (clave: string, args?: Record<string, unknown>) =>
  args ? `${clave} ${JSON.stringify(args)}` : clave;

const regla = (extra: Partial<Automation>): Automation =>
  ({
    id: 1,
    name: "Regla",
    active: true,
    trigger_resource: "tickets",
    trigger_event: "created",
    trigger_params: {},
    action_type: "create_task",
    action_params: {},
    ...extra,
  }) as Automation;

describe("disparadoresDisponibles", () => {
  test("ofrece los disparadores de tickets siempre y la renovación solo con el módulo Clientes", () => {
    const sinModulo = disparadoresDisponibles({}).map((d) => d.id);
    const conModulo = disparadoresDisponibles({
      customers: { active: true },
    }).map((d) => d.id);

    expect(sinModulo).toContain("tickets:created");
    expect(sinModulo).toContain("tickets:overdue");
    expect(sinModulo).not.toContain("contracts:renewal_due");
    expect(conModulo).toContain("contracts:renewal_due");
  });
});

describe("admiteAsignarResponsable", () => {
  test("no tiene sentido asignar sobre una renovación, una cotización o un cierre", () => {
    expect(admiteAsignarResponsable("tickets:created")).toBe(true);
    expect(admiteAsignarResponsable("tickets:unassigned")).toBe(true);
    expect(admiteAsignarResponsable("tickets:closed")).toBe(false);
    expect(admiteAsignarResponsable("quotes:unanswered")).toBe(false);
    expect(admiteAsignarResponsable("contracts:renewal_due")).toBe(false);
  });
});

describe("parametrosDelDisparador", () => {
  test("los disparadores por horas guardan hoursAfter como número", () => {
    expect(
      parametrosDelDisparador("tickets:unanswered", { hoursAfter: "6" }),
    ).toEqual({ hoursAfter: 6 });
  });

  test("un ticket creado guarda la prioridad solo si se eligió una", () => {
    expect(
      parametrosDelDisparador("tickets:created", { priority: "urgent" }),
    ).toEqual({ priority: "urgent" });
    expect(
      parametrosDelDisparador("tickets:created", { priority: "" }),
    ).toEqual({});
  });

  test("los disparadores anteriores conservan sus parámetros", () => {
    expect(
      parametrosDelDisparador("quotes:unanswered", { daysAfter: 5 }),
    ).toEqual({ daysAfter: 5 });
    expect(
      parametrosDelDisparador("deals:stage_changed", { stage: "won" }),
    ).toEqual({ stage: "won" });
  });
});

describe("describirDisparador", () => {
  test("una regla de ticket con prioridad usa la etiqueta legible", () => {
    const frase = describirDisparador(
      regla({ trigger_params: { priority: "urgent" } }),
      translate,
      { prioridad: "Urgente" },
    );

    expect(frase).toBe(
      'crm.automations.when.ticket_created_named {"priority":"Urgente"}',
    );
  });

  test("«sin respuesta» distingue tickets de cotizaciones", () => {
    const deTicket = describirDisparador(
      regla({ trigger_event: "unanswered", trigger_params: { hoursAfter: 2 } }),
      translate,
      {},
    );
    const deCotizacion = describirDisparador(
      regla({
        trigger_resource: "quotes",
        trigger_event: "unanswered",
        trigger_params: { daysAfter: 3 },
      }),
      translate,
      {},
    );

    expect(deTicket).toContain("ticket_unanswered_named");
    expect(deTicket).toContain('"hours":2');
    expect(deCotizacion).toContain("quote_unanswered_named");
  });
});

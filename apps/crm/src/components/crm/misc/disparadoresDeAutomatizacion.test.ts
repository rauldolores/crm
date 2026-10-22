import { describe, expect, test } from "vitest";

import type { Automation } from "../types";
import {
  admiteAsignarResponsable,
  admiteCondicion,
  admiteMoverDeEtapa,
  describirDisparador,
  disparadoresDisponibles,
  etapasDeDestino,
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

  test("ofrece «lleva días en una etapa» para las oportunidades", () => {
    expect(disparadoresDisponibles({}).map((d) => d.id)).toContain(
      "deals:stalled",
    );
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

  test("sí se puede reasignar una oportunidad estancada", () => {
    expect(admiteAsignarResponsable("deals:stalled")).toBe(true);
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

  test("«lleva días en una etapa» guarda embudo, etapa y días como número", () => {
    expect(
      parametrosDelDisparador("deals:stalled", {
        pipeline: "prospeccion-fria",
        stage: "whatsapp",
        daysInStage: "3",
      }),
    ).toEqual({
      pipeline: "prospeccion-fria",
      stage: "whatsapp",
      daysInStage: 3,
    });
  });

  test("sin días, «lleva días en una etapa» usa 3, como el motor", () => {
    expect(
      parametrosDelDisparador("deals:stalled", {
        pipeline: "ventas",
        stage: "proposal-sent",
      }).daysInStage,
    ).toBe(3);
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

  test("una oportunidad estancada nombra los días, la etapa y el embudo", () => {
    const frase = describirDisparador(
      regla({
        trigger_resource: "deals",
        trigger_event: "stalled",
        trigger_params: {
          pipeline: "prospeccion-fria",
          stage: "lost",
          daysInStage: 7,
        },
      }),
      translate,
      { etapa: "Descartado", embudo: "Prospección fría" },
    );

    expect(frase).toBe(
      'crm.automations.when.deal_stalled_named {"days":7,"stage":"Descartado","pipeline":"Prospección fría"}',
    );
  });

  test("una regla estancada sin embudo no inventa uno", () => {
    const frase = describirDisparador(
      regla({
        trigger_resource: "deals",
        trigger_event: "stalled",
        trigger_params: { stage: "won", daysInStage: 2 },
      }),
      translate,
      { etapa: "Ganada" },
    );

    expect(frase).toContain("deal_stalled_any_pipeline");
  });

  test("solo admiten condición los disparadores con texto que leer y que encolan", () => {
    for (const cuando of [
      "deals:created",
      "deals:stage_changed",
      "tickets:created",
      "tickets:closed",
    ]) {
      expect(admiteCondicion(cuando)).toBe(true);
    }

    // Un contacto recién creado no tiene texto todavía: su primera nota llega
    // después, en otra transacción.
    expect(admiteCondicion("contacts:created")).toBe(false);

    // Y estos los evalúa el cron horario, que no pasa por el motor de eventos
    // y por tanto no encola nada.
    for (const cuando of [
      "tickets:unanswered",
      "tickets:unassigned",
      "tickets:overdue",
      "quotes:unanswered",
      "contracts:renewal_due",
      "deals:stalled",
    ]) {
      expect(admiteCondicion(cuando)).toBe(false);
    }
  });
});

describe("admiteMoverDeEtapa", () => {
  test("solo desde «lleva N días en una etapa», que no corre dentro de un disparador", () => {
    expect(admiteMoverDeEtapa("deals:stalled")).toBe(true);
    // Mover desde un disparador de evento sería actualizar la oportunidad
    // desde su propio disparador: dos reglas cruzadas harían un bucle.
    expect(admiteMoverDeEtapa("deals:stage_changed")).toBe(false);
    expect(admiteMoverDeEtapa("deals:created")).toBe(false);
    expect(admiteMoverDeEtapa("tickets:created")).toBe(false);
  });
});

describe("etapasDeDestino", () => {
  const prospeccion = {
    stages: [
      { value: "opportunity", label: "Por contactar" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "correo", label: "Correo" },
      { value: "lost", label: "Descartado" },
    ],
    pipelineStatuses: [],
  };

  test("ofrece las demás etapas del embudo, sin la de origen", () => {
    expect(
      etapasDeDestino(prospeccion, "whatsapp").map((etapa) => etapa.value),
    ).toEqual(["opportunity", "correo", "lost"]);
  });

  test("no ofrece las etapas ganadas: dar una venta por ganada no es cosa de un reloj", () => {
    const ventas = {
      stages: [
        { value: "opportunity", label: "Oportunidad" },
        { value: "won", label: "Ganada" },
        { value: "lost", label: "Perdida" },
      ],
      pipelineStatuses: ["won"],
    };
    expect(
      etapasDeDestino(ventas, "opportunity").map((etapa) => etapa.value),
    ).toEqual(["lost"]);
  });

  test("sin embudo elegido no hay destinos", () => {
    expect(etapasDeDestino(undefined, "whatsapp")).toEqual([]);
  });
});

describe("filtro por teléfono del contacto", () => {
  test("guarda el filtro en una oportunidad creada", () => {
    expect(
      parametrosDelDisparador("deals:created", { contacto: "sin_movil" }),
    ).toEqual({ contacto: "sin_movil" });
  });

  test("convive con el filtro de etapa, que es otro eje", () => {
    expect(
      parametrosDelDisparador("deals:stage_changed", {
        stage: "whatsapp",
        contacto: "movil",
      }),
    ).toEqual({ stage: "whatsapp", contacto: "movil" });
  });

  test("convive con los días de una oportunidad estancada", () => {
    expect(
      parametrosDelDisparador("deals:stalled", {
        pipeline: "prospeccion-fria",
        stage: "whatsapp",
        daysInStage: 3,
        contacto: "movil",
      }),
    ).toEqual({
      pipeline: "prospeccion-fria",
      stage: "whatsapp",
      daysInStage: 3,
      contacto: "movil",
    });
  });

  test("no se guarda en disparadores que no son de oportunidades", () => {
    expect(
      parametrosDelDisparador("tickets:created", { contacto: "movil" }),
    ).toEqual({});
  });

  test("vacío significa que la regla no mira el teléfono", () => {
    expect(parametrosDelDisparador("deals:created", {})).toEqual({});
  });

  test("la frase de la regla dice el filtro, para no leerse igual que otra sin él", () => {
    const con = describirDisparador(
      regla({
        trigger_resource: "deals",
        trigger_event: "created",
        trigger_params: { contacto: "sin_movil" },
      }),
      translate,
      {},
    );
    const sin = describirDisparador(
      regla({
        trigger_resource: "deals",
        trigger_event: "created",
        trigger_params: {},
      }),
      translate,
      {},
    );

    expect(con).toContain("without_mobile");
    expect(sin).not.toContain("without_mobile");
    expect(con).not.toEqual(sin);
  });
});

describe("disparador de correo enviado", () => {
  test("mover de etapa se ofrece aquí, porque la fila que dispara no es la oportunidad", () => {
    expect(admiteMoverDeEtapa("email_outbox:sent")).toBe(true);
    expect(admiteMoverDeEtapa("deals:stalled")).toBe(true);
    // No desde el propio evento de la oportunidad: movería sin que nadie
    // hubiera hecho la acción que la etapa afirma.
    expect(admiteMoverDeEtapa("deals:created")).toBe(false);
    expect(admiteMoverDeEtapa("deals:stage_changed")).toBe(false);
  });

  test("no ofrece asignar responsable: un correo no es una ficha", () => {
    expect(admiteAsignarResponsable("email_outbox:sent")).toBe(false);
  });

  test("no admite condición: el cuerpo lo pone la plantilla, no una persona", () => {
    expect(admiteCondicion("email_outbox:sent")).toBe(false);
  });

  test("guarda la plantilla del disparador, con su propio nombre de campo", () => {
    expect(
      parametrosDelDisparador("email_outbox:sent", {
        plantillaDisparadora: 6,
        // El de la acción de mandar correo, que NO debe acabar en el filtro.
        templateId: 99,
      }),
    ).toEqual({ templateId: "6" });
  });

  test("sin plantilla elegida, la regla salta con cualquier correo", () => {
    expect(parametrosDelDisparador("email_outbox:sent", {})).toEqual({});
  });

  test("la frase nombra la plantilla cuando la regla la acota", () => {
    const acotada = describirDisparador(
      regla({
        trigger_resource: "email_outbox",
        trigger_event: "sent",
        trigger_params: { templateId: 6 },
      }),
      translate,
      { plantilla: "Primer contacto" },
    );
    const cualquiera = describirDisparador(
      regla({
        trigger_resource: "email_outbox",
        trigger_event: "sent",
        trigger_params: {},
      }),
      translate,
      {},
    );

    expect(acotada).toContain("Primer contacto");
    expect(cualquiera).toContain("email_sent");
    expect(cualquiera).not.toContain("Primer contacto");
  });
});

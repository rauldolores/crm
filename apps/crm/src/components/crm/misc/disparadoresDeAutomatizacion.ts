import type { Translate } from "ra-core";
import type { FieldValues } from "react-hook-form";

import type { ConfigurationContextValue } from "../root/ConfigurationContext";
import type { Automation } from "../types";

/** Un disparador tal como se elige en el formulario: `recurso:evento`. */
export interface Disparador {
  id: string;
  name: string;
}

/**
 * Los disparadores disponibles, por orden de uso. La renovación de contratos
 * solo existe con el módulo Clientes activo.
 */
export const disparadoresDisponibles = (
  modules: ConfigurationContextValue["modules"],
): Disparador[] => [
  { id: "contacts:created", name: "crm.automations.when.contact_created" },
  { id: "deals:created", name: "crm.automations.when.deal_created" },
  { id: "deals:stage_changed", name: "crm.automations.when.deal_stage" },
  ...(modules.customers?.active
    ? [
        {
          id: "contracts:renewal_due",
          name: "crm.automations.when.renewal_due",
        },
      ]
    : []),
  { id: "quotes:unanswered", name: "crm.automations.when.quote_unanswered" },
  { id: "tickets:created", name: "crm.automations.when.ticket_created" },
  { id: "tickets:unanswered", name: "crm.automations.when.ticket_unanswered" },
  { id: "tickets:unassigned", name: "crm.automations.when.ticket_unassigned" },
  { id: "tickets:overdue", name: "crm.automations.when.ticket_overdue" },
  { id: "tickets:closed", name: "crm.automations.when.ticket_closed" },
];

/** Los disparadores de tickets que se miden en horas (motor por fecha). */
export const esDisparadorPorHoras = (cuando: string) =>
  ["tickets:unanswered", "tickets:unassigned", "tickets:overdue"].includes(
    cuando,
  );

/**
 * «Asignar responsable» cambia la fila que disparó la regla: no tiene
 * sentido para un contrato que se acerca a su renovación ni para una
 * cotización sin respuesta (no son filas nuevas a las que asignar nadie).
 */
export const admiteAsignarResponsable = (cuando: string) =>
  !["contracts:renewal_due", "quotes:unanswered", "tickets:closed"].includes(
    cuando,
  );

/** Los parámetros del disparador a partir de los valores del formulario. */
export const parametrosDelDisparador = (
  cuando: string,
  valores: FieldValues,
): Record<string, unknown> => {
  const [, evento] = cuando.split(":");
  if (cuando === "quotes:unanswered") {
    return { daysAfter: Number(valores.daysAfter ?? 3) };
  }
  if (cuando === "contracts:renewal_due") {
    return { daysBefore: Number(valores.daysBefore ?? 30) };
  }
  if (esDisparadorPorHoras(cuando)) {
    return { hoursAfter: Number(valores.hoursAfter ?? 4) };
  }
  if (evento === "stage_changed" && valores.stage) {
    return { stage: valores.stage };
  }
  if (cuando === "tickets:created" && valores.priority) {
    return { priority: valores.priority };
  }
  return {};
};

/** La parte «cuando…» de la frase que describe una regla guardada. */
export const describirDisparador = (
  regla: Automation,
  translate: Translate,
  etiquetas: { etapa?: string; prioridad?: string },
): string => {
  const clave = `${regla.trigger_resource}:${regla.trigger_event}`;
  const params = regla.trigger_params ?? {};
  switch (clave) {
    case "quotes:unanswered":
      return translate("crm.automations.when.quote_unanswered_named", {
        days: params.daysAfter ?? 3,
      });
    case "contracts:renewal_due":
      return translate("crm.automations.when.renewal_due_named", {
        days: params.daysBefore ?? 30,
      });
    case "deals:stage_changed":
      return translate("crm.automations.when.deal_stage_named", {
        stage: etiquetas.etapa ?? "",
      });
    case "contacts:created":
      return translate("crm.automations.when.contact_created");
    case "deals:created":
      return translate("crm.automations.when.deal_created");
    case "tickets:created":
      return params.priority
        ? translate("crm.automations.when.ticket_created_named", {
            priority: etiquetas.prioridad ?? String(params.priority),
          })
        : translate("crm.automations.when.ticket_created");
    case "tickets:closed":
      return translate("crm.automations.when.ticket_closed");
    case "tickets:unanswered":
    case "tickets:unassigned":
    case "tickets:overdue":
      return translate(
        `crm.automations.when.ticket_${regla.trigger_event}_named`,
        {
          hours: params.hoursAfter ?? 4,
        },
      );
    default:
      return clave;
  }
};

import { useGetMany, useTranslate } from "ra-core";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale, TicketEvent } from "../types";

/**
 * Convierte los eventos del historial (crm.ticket_events) en frases: «Estado:
 * Abierto → Cerrado», «Asignado a Raúl…». Resuelve de una vez los nombres de
 * las personas implicadas (quien hizo el cambio y a quién se asignó).
 */
export const useDescripcionDeEventos = (eventos: TicketEvent[]) => {
  const translate = useTranslate();
  const { ticketStatuses, ticketPriorities, ticketCategories } =
    useConfigurationContext();
  const idsDeUsuarios = Array.from(
    new Set(
      eventos
        .flatMap((e) => [
          e.sales_id,
          e.field === "sales_id" ? Number(e.new_value) : null,
        ])
        .filter((id): id is number => id != null && Number.isFinite(id)),
    ),
  );
  const { data: usuarios } = useGetMany<Sale>(
    "sales",
    { ids: idsDeUsuarios },
    { enabled: idsDeUsuarios.length > 0 },
  );

  const nombre = (id?: string | number | null) => {
    if (id == null || id === "")
      return translate("resources.tickets.unassigned");
    const u = usuarios?.find((s) => String(s.id) === String(id));
    return u ? `${u.first_name} ${u.last_name}` : `#${id}`;
  };
  const etiqueta = (
    lista: { value: string; label: string }[],
    valor?: string | null,
  ) => lista.find((i) => i.value === valor)?.label ?? valor ?? "—";

  const describir = (e: TicketEvent): string => {
    switch (e.field) {
      case "created":
        return translate("resources.tickets.history.created");
      case "status":
        return translate("resources.tickets.history.status", {
          from: etiqueta(ticketStatuses, e.old_value),
          to: etiqueta(ticketStatuses, e.new_value),
        });
      case "priority":
        return translate("resources.tickets.history.priority", {
          from: etiqueta(ticketPriorities, e.old_value),
          to: etiqueta(ticketPriorities, e.new_value),
        });
      case "category":
        return translate("resources.tickets.history.category", {
          from: etiqueta(ticketCategories, e.old_value),
          to: etiqueta(ticketCategories, e.new_value),
        });
      case "sales_id":
        return translate("resources.tickets.history.sales_id", {
          to: nombre(e.new_value),
        });
      default:
        return e.field;
    }
  };

  /** Quién lo hizo, o «Sistema» cuando vino de un formulario, la API o una regla. */
  const autor = (e: TicketEvent): string =>
    e.sales_id != null
      ? nombre(e.sales_id)
      : translate("resources.tickets.history.system");

  return { describir, autor };
};

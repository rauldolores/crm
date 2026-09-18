import { useGetList, useGetMany, useTranslate } from "ra-core";

import { formatRelativeDate } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale, TicketEvent } from "../types";

/**
 * Quién cambió qué y cuándo (crm.ticket_events). Se lee del historial que
 * escribe la base, no de la interfaz: así también cuenta lo que cambian el
 * agente de voz, los formularios o la API.
 */
export const HistorialDeTicket = ({
  ticketId,
}: {
  ticketId: number | string;
}) => {
  const translate = useTranslate();
  const { ticketStatuses, ticketPriorities, ticketCategories } =
    useConfigurationContext();
  const { data: eventos, isPending } = useGetList<TicketEvent>(
    "ticket_events",
    {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "created_at", order: "DESC" },
      filter: { ticket_id: ticketId },
    },
  );
  const idsDeUsuarios = Array.from(
    new Set(
      (eventos ?? [])
        .flatMap((e) => [
          e.sales_id,
          e.field === "sales_id" ? Number(e.new_value) : null,
          e.field === "sales_id" ? Number(e.old_value) : null,
        ])
        .filter((id): id is number => id != null && Number.isFinite(id)),
    ),
  );
  const { data: usuarios } = useGetMany<Sale>(
    "sales",
    { ids: idsDeUsuarios },
    { enabled: idsDeUsuarios.length > 0 },
  );

  if (isPending || !eventos?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("resources.tickets.history.empty")}
      </p>
    );
  }

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

  return (
    <ol className="flex flex-col gap-2 text-sm">
      {eventos.map((e) => (
        <li key={e.id} className="flex flex-col">
          <span>{describir(e)}</span>
          <span className="text-xs text-muted-foreground">
            {e.sales_id != null
              ? nombre(e.sales_id)
              : translate("resources.tickets.history.system")}
            {" · "}
            {formatRelativeDate(e.created_at)}
          </span>
        </li>
      ))}
    </ol>
  );
};

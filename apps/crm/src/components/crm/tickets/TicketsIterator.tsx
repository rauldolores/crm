import { useListContext } from "ra-core";
import { Link } from "react-router";
import { ReferenceField } from "@/components/admin/reference-field";

import { formatRelativeDate } from "../misc/RelativeDate";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Ticket } from "../types";
import { parseTicketSubject } from "./parseTicketSubject";
import { SlaDeTicket } from "./SlaDeTicket";
import { PrioridadDeTicket } from "./TicketBadges";
import { useIndiceDePrioridad } from "./useIndiceDePrioridad";

/**
 * Filas compactas de tickets, para el panorama de un contacto, una empresa,
 * o los "otros tickets" de la ficha de un ticket. Espera vivir dentro de un
 * ListContext (ReferenceManyField / InfiniteListBase).
 */
export const TicketsIterator = ({
  showContact,
}: {
  /** Muestra el contacto que reportó cada ticket (útil en la ficha de empresa). */
  showContact?: boolean;
}) => {
  const { data, isPending, error } = useListContext<Ticket>();
  const { ticketStatuses } = useConfigurationContext();
  const indiceDePrioridad = useIndiceDePrioridad();

  if (isPending || error || !data?.length) return null;

  return (
    <div className="flex flex-col gap-1">
      {data.map((ticket) => {
        const { title } = parseTicketSubject(ticket.subject);
        return (
          <Link
            key={ticket.id}
            to={`/tickets/${ticket.id}/show`}
            className="flex items-start gap-2 rounded px-1 py-1.5 -mx-1 text-foreground no-underline transition-colors hover:bg-muted"
          >
            <Status
              status={ticket.status}
              statuses={ticketStatuses}
              className="mt-1.5"
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm">
                <span className="truncate">{title}</span>
                {/* Solo las prioridades por encima de la normal: en una
                    lista corta, marcar «normal» en todas es ruido. */}
                {indiceDePrioridad(ticket.priority) >= 2 && (
                  <PrioridadDeTicket
                    value={ticket.priority}
                    className="shrink-0"
                  />
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {showContact && (
                  <ReferenceField
                    source="contact_id"
                    reference="contacts"
                    record={ticket}
                    link={false}
                  />
                )}
                {showContact && ticket.created_at ? " · " : ""}
                {ticket.created_at ? formatRelativeDate(ticket.created_at) : ""}
              </p>
              {/* Solo mientras está abierto: en una lista corta, «vencido
                  hace 2 días» es lo que decide a cuál entrar primero. */}
              {ticket.status !== "closed" && (
                <SlaDeTicket ticket={ticket} compacto />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

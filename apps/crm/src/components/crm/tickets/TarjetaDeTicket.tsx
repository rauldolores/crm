import { Draggable } from "@hello-pangea/dnd";
import type React from "react";
import { RecordContextProvider, useRedirect } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";

import type { Ticket } from "../types";
import { parseTicketSubject } from "./parseTicketSubject";
import { SlaDeTicket } from "./SlaDeTicket";
import { CategoriaDeTicket, PrioridadDeTicket } from "./TicketBadges";
import { useIndiceDePrioridad } from "./useIndiceDePrioridad";

/**
 * Tarjeta del tablero: número y asunto, contacto atenuado, y al pie lo que
 * decide a quién atender primero: prioridad (si es más que normal),
 * categoría y el plazo del SLA.
 */
export const TarjetaDeTicket = ({
  ticket,
  index,
}: {
  ticket: Ticket;
  index: number;
}) => {
  const redirect = useRedirect();
  const indiceDePrioridad = useIndiceDePrioridad();
  const { title } = parseTicketSubject(ticket.subject);

  return (
    <Draggable draggableId={String(ticket.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className="cursor-pointer"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          // El estilo de arrastre de la librería no conoce las variables
          // CSS de Radix que este proyecto añade al tipo CSSProperties.
          style={provided.draggableProps.style as React.CSSProperties}
          ref={provided.innerRef}
          onClick={() =>
            redirect(
              `/tickets/${ticket.id}/show`,
              undefined,
              undefined,
              undefined,
              { _scrollToTop: false },
            )
          }
        >
          <RecordContextProvider value={ticket}>
            <Card
              className={`py-3 transition-all duration-200 ${
                snapshot.isDragging
                  ? "rotate-1 transform opacity-90 shadow-lg"
                  : "hover:border-primary/40"
              }`}
            >
              <CardContent className="flex flex-col gap-1.5 px-3">
                <p className="line-clamp-2 text-sm leading-snug font-medium">
                  <span className="mr-1 text-muted-foreground tabular-nums">
                    #{ticket.id}
                  </span>
                  {title}
                </p>
                <ReferenceField
                  source="contact_id"
                  reference="contacts"
                  link={false}
                >
                  <TextField
                    source="first_name"
                    className="text-xs text-muted-foreground"
                  />{" "}
                  <TextField
                    source="last_name"
                    className="text-xs text-muted-foreground"
                  />
                </ReferenceField>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                  {indiceDePrioridad(ticket.priority) >= 2 && (
                    <PrioridadDeTicket value={ticket.priority} />
                  )}
                  <CategoriaDeTicket value={ticket.category} />
                </div>
                <SlaDeTicket ticket={ticket} compacto />
              </CardContent>
            </Card>
          </RecordContextProvider>
        </div>
      )}
    </Draggable>
  );
};

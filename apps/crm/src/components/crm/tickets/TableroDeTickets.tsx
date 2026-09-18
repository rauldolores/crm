import {
  DragDropContext,
  Droppable,
  type OnDragEndResponder,
} from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import {
  useCreate,
  useListContext,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { NoteStatus, Ticket } from "../types";
import { CerrarTicketDialog } from "./CerrarTicketDialog";
import { TarjetaDeTicket } from "./TarjetaDeTicket";

/**
 * Tablero de tickets por estado. Arrastrar una tarjeta a otra columna
 * cambia su estado; soltarla en «cerrado» pide el motivo, igual que el
 * selector de la lista. Espera vivir dentro del ListContext de /tickets:
 * respeta los mismos filtros y accesos rápidos que la tabla.
 *
 * El orden dentro de una columna es el de la lista (última actividad); no
 * se guarda una posición manual, que en soporte no significa nada.
 */
const TARJETAS_POR_TRAMO = 25;

type PorEstado = Record<string, Ticket[]>;

const agrupar = (tickets: Ticket[], estados: NoteStatus[]): PorEstado => {
  const porEstado: PorEstado = Object.fromEntries(
    estados.map((e) => [e.value, [] as Ticket[]]),
  );
  for (const ticket of tickets) {
    (porEstado[ticket.status] ??= []).push(ticket);
  }
  return porEstado;
};

export const TableroDeTickets = () => {
  const notify = useNotify();
  const { ticketStatuses } = useConfigurationContext();
  const { data, isPending, refetch } = useListContext<Ticket>();
  const [update] = useUpdate();
  const [create] = useCreate();
  const [porEstado, setPorEstado] = useState<PorEstado>(
    agrupar([], ticketStatuses),
  );
  const [cierrePendiente, setCierrePendiente] = useState<{
    ticket: Ticket;
    aplicar: (extra: Partial<Ticket>) => void;
  } | null>(null);

  useEffect(() => {
    if (!data) return;
    const nuevo = agrupar(data, ticketStatuses);
    if (!isEqual(nuevo, porEstado)) setPorEstado(nuevo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ticketStatuses]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = ({ source, destination }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    const ticket = porEstado[source.droppableId][source.index];
    if (!ticket) return;
    const estado = destination.droppableId;

    const aplicar = (extra: Partial<Ticket> = {}) => {
      // Primero en pantalla; si el guardado falla, la recarga la devuelve.
      setPorEstado((actual) => {
        const origen = actual[source.droppableId].filter(
          (t) => t.id !== ticket.id,
        );
        const destino = [...(actual[estado] ?? [])];
        destino.splice(destination.index, 0, { ...ticket, status: estado });
        return { ...actual, [source.droppableId]: origen, [estado]: destino };
      });
      update(
        "tickets",
        {
          id: ticket.id,
          data: { status: estado, ...extra },
          previousData: ticket,
        },
        {
          onSettled: () => refetch(),
          onError: () =>
            notify("resources.tickets.notifications.update_error", {
              type: "error",
            }),
        },
      );
    };

    if (estado === "closed") {
      setCierrePendiente({ ticket, aplicar });
      return;
    }
    aplicar();
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {ticketStatuses.map((estado) => (
          <Columna
            key={estado.value}
            estado={estado}
            tickets={porEstado[estado.value] ?? []}
          />
        ))}
      </div>
      <CerrarTicketDialog
        key={cierrePendiente?.ticket.id ?? "ninguno"}
        open={cierrePendiente != null}
        onOpenChange={(abierto) => {
          if (!abierto) setCierrePendiente(null);
        }}
        onConfirm={async (resolution, nota) => {
          if (!cierrePendiente) return;
          const { ticket, aplicar } = cierrePendiente;
          setCierrePendiente(null);
          aplicar({ resolution });
          if (nota) {
            await create("ticket_notes", {
              data: { ticket_id: ticket.id, text: nota, type: "note" },
            });
          }
        }}
      />
    </DragDropContext>
  );
};

const Columna = ({
  estado,
  tickets,
}: {
  estado: NoteStatus;
  tickets: Ticket[];
}) => {
  const translate = useTranslate();
  const [visibles, setVisibles] = useState(TARJETAS_POR_TRAMO);
  const tarjetas = tickets.slice(0, visibles);
  const ocultas = tickets.length - tarjetas.length;

  return (
    <div className="w-72 shrink-0 pb-8">
      <h3 className="flex items-center justify-center gap-1.5 text-sm font-medium">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: estado.color }}
        />
        {estado.label}
        <span className="rounded-full bg-muted px-1.5 text-xs font-normal text-muted-foreground tabular-nums">
          {tickets.length}
        </span>
      </h3>
      <Droppable droppableId={estado.value}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`mt-3 flex min-h-24 flex-col gap-2 rounded-xl p-1 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-accent"
                : tickets.length === 0
                  ? "border border-dashed"
                  : ""
            }`}
          >
            {tarjetas.map((ticket, index) => (
              <TarjetaDeTicket key={ticket.id} ticket={ticket} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {ocultas > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 w-full text-muted-foreground"
          onClick={() => setVisibles((n) => n + TARJETAS_POR_TRAMO)}
        >
          {translate("resources.tickets.board.show_more", {
            count: Math.min(ocultas, TARJETAS_POR_TRAMO),
          })}
        </Button>
      )}
    </div>
  );
};

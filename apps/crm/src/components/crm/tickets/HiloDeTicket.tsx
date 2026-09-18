import { History } from "lucide-react";
import { useGetList, useListContext } from "ra-core";
import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";

import { InfinitePagination } from "../misc/InfinitePagination";
import { formatRelativeDate } from "../misc/RelativeDate";
import { Note } from "../notes/Note";
import { NoteCreate } from "../notes/NoteCreate";
import type { TicketEvent, TicketNote } from "../types";
import { useDescripcionDeEventos } from "./useDescripcionDeEventos";

type Entrada =
  | { tipo: "nota"; fecha: string; nota: TicketNote }
  | { tipo: "evento"; fecha: string; evento: TicketEvent };

/**
 * El hilo del ticket en una sola línea de tiempo: notas del equipo,
 * correos enviados al cliente y los cambios de estado, prioridad, categoría
 * o responsable, en orden. Antes las notas iban en el centro y los cambios
 * en un lateral, y había que cruzarlos con la vista: «¿cerró antes o después
 * de esa nota?».
 *
 * Las notas llegan paginadas (ListContext infinito); los cambios se traen
 * enteros. Un cambio más antiguo que la nota más antigua cargada se guarda
 * hasta que estén todas las notas, para no pintarlo fuera de sitio.
 */
export const HiloDeTicket = ({ ticketId }: { ticketId: number | string }) => {
  const {
    data: notas = [],
    total,
    isPending,
    error,
  } = useListContext<TicketNote>();
  const { data: eventos = [] } = useGetList<TicketEvent>("ticket_events", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "created_at", order: "DESC" },
    filter: { ticket_id: ticketId },
  });
  const { describir, autor } = useDescripcionDeEventos(eventos);

  if (isPending || error) return null;

  const todasLasNotas = total == null || notas.length >= total;
  const masAntigua = notas[notas.length - 1]?.date;
  const entradas: Entrada[] = [
    ...notas.map((nota) => ({ tipo: "nota" as const, fecha: nota.date, nota })),
    ...eventos
      .filter((e) => todasLasNotas || !masAntigua || e.created_at >= masAntigua)
      .map((evento) => ({
        tipo: "evento" as const,
        fecha: evento.created_at,
        evento,
      })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

  return (
    <div className="mt-4">
      <NoteCreate reference="tickets" />
      {entradas.length > 0 && (
        <div className="mt-4 space-y-4">
          {entradas.map((entrada, index) => (
            <Fragment
              key={
                entrada.tipo === "nota"
                  ? `n-${entrada.nota.id}`
                  : `e-${entrada.evento.id}`
              }
            >
              {entrada.tipo === "nota" ? (
                <Note
                  note={entrada.nota}
                  isLast={index === entradas.length - 1}
                />
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <History className="size-3.5 shrink-0" />
                  <span className="text-foreground">
                    {describir(entrada.evento)}
                  </span>
                  <span>
                    · {autor(entrada.evento)} ·{" "}
                    {formatRelativeDate(entrada.evento.created_at)}
                  </span>
                </div>
              )}
              {index < entradas.length - 1 && <Separator />}
            </Fragment>
          ))}
        </div>
      )}
      <InfinitePagination />
    </div>
  );
};

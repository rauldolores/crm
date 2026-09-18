import { AlertTriangle } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { useFormContext, useWatch } from "react-hook-form";
import { Link } from "react-router";

import type { Ticket } from "../types";
import { parseTicketSubject } from "./parseTicketSubject";

/**
 * Al crear un ticket, avisa si el mismo contacto ya tiene otro abierto: el
 * agente de voz y los formularios repiten tickets cuando el cliente insiste,
 * y una cola con el mismo problema dos veces se atiende dos veces. Solo
 * avisa; decidir es de la persona.
 */
export const AvisoDeDuplicados = () => {
  const translate = useTranslate();
  const { control } = useFormContext<Ticket>();
  const contactId = useWatch({ control, name: "contact_id" });

  const { data: abiertos } = useGetList<Ticket>(
    "tickets",
    {
      pagination: { page: 1, perPage: 5 },
      sort: { field: "last_activity_at", order: "DESC" },
      filter: { contact_id: contactId, "status@neq": "closed" },
    },
    { enabled: contactId != null },
  );

  if (!contactId || !abiertos?.length) return null;

  return (
    <div className="flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">
          {translate("resources.tickets.duplicates.title", {
            smart_count: abiertos.length,
          })}
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {abiertos.map((ticket) => (
            <li key={ticket.id} className="truncate">
              <Link
                to={`/tickets/${ticket.id}/show`}
                className="underline-offset-2 hover:underline"
              >
                #{ticket.id} · {parseTicketSubject(ticket.subject).title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

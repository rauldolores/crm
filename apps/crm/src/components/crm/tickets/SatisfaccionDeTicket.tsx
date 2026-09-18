import { Star } from "lucide-react";
import { useTranslate } from "ra-core";
import { cn } from "@/lib/utils";

import { formatRelativeDate } from "../misc/RelativeDate";
import type { Ticket } from "../types";

/** Cinco estrellas, las primeras `valor` llenas. */
export const Estrellas = ({
  valor,
  className,
}: {
  valor: number;
  className?: string;
}) => (
  <span
    className={cn("inline-flex items-center gap-0.5", className)}
    aria-label={`${valor}/5`}
  >
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={cn(
          "size-3.5",
          n <= valor
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground/40",
        )}
      />
    ))}
  </span>
);

/**
 * La respuesta del cliente a la encuesta, si la hay. Se muestra en la ficha
 * del ticket; el promedio vive en Informes → Soporte.
 */
export const SatisfaccionDeTicket = ({ ticket }: { ticket: Ticket }) => {
  const translate = useTranslate();
  if (!ticket.satisfaction_rating) return null;
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">
          {translate("resources.tickets.survey.title")}
        </span>
        <Estrellas valor={ticket.satisfaction_rating} />
        <span className="text-xs text-muted-foreground">
          {translate(
            `resources.tickets.survey.rating_${ticket.satisfaction_rating}`,
          )}
          {ticket.satisfaction_at &&
            ` · ${formatRelativeDate(ticket.satisfaction_at)}`}
        </span>
      </div>
      {ticket.satisfaction_comment && (
        <p className="mt-1 text-muted-foreground">
          «{ticket.satisfaction_comment}»
        </p>
      )}
    </div>
  );
};

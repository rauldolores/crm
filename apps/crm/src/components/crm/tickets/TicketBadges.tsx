import { useTranslate } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { ticketResolutions } from "../root/defaultConfiguration";

/** Prioridad como pastilla con el color configurado en Ajustes. */
export const PrioridadDeTicket = ({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) => {
  const { ticketPriorities } = useConfigurationContext();
  const prioridad = ticketPriorities.find((p) => p.value === value);
  if (!prioridad) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        className,
      )}
    >
      <span
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ backgroundColor: prioridad.color }}
      />
      {prioridad.label}
    </span>
  );
};

/** Categoría como pastilla neutra; nada si el ticket no está clasificado. */
export const CategoriaDeTicket = ({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) => {
  const { ticketCategories } = useConfigurationContext();
  if (!value) return null;
  const categoria = ticketCategories.find((c) => c.value === value);
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-full font-normal", className)}
    >
      {categoria?.label ?? value}
    </Badge>
  );
};

/** Origen del ticket (formulario web, agente, API…), en texto atenuado. */
export const OrigenDeTicket = ({ value }: { value?: string | null }) => {
  const translate = useTranslate();
  if (!value || value === "manual") return null;
  return (
    <span className="text-xs text-muted-foreground">
      {translate(`resources.tickets.sources.${value}`, { _: value })}
    </span>
  );
};

/** Motivo de cierre legible. */
export const ResolucionDeTicket = ({ value }: { value?: string | null }) => {
  if (!value) return null;
  const motivo = ticketResolutions.find((r) => r.value === value);
  return <>{motivo?.label ?? value}</>;
};

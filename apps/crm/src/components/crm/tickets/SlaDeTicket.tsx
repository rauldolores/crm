import { useTranslate } from "ra-core";
import { cn } from "@/lib/utils";

import type { Ticket } from "../types";
import {
  plazosDeTicket,
  type EstadoDePlazo,
  type Plazo,
} from "./plazosDeTicket";

const COLOR: Record<EstadoDePlazo, string> = {
  none: "text-muted-foreground",
  pending: "",
  overdue: "text-destructive font-medium",
  met: "text-muted-foreground",
  late: "text-destructive",
};

const Linea = ({ clave, plazo }: { clave: string; plazo: Plazo }) => {
  const translate = useTranslate();
  if (plazo.estado === "none") return null;
  return (
    <span className={cn("text-xs", COLOR[plazo.estado])}>
      {translate(`resources.tickets.sla.${clave}_${plazo.estado}`, {
        time: plazo.distancia,
      })}
    </span>
  );
};

/**
 * Estado del SLA en una o dos líneas. En la lista se muestra solo lo que
 * pide acción (pendiente o vencido); en la ficha, también lo cumplido.
 */
export const SlaDeTicket = ({
  ticket,
  compacto = false,
  className,
}: {
  ticket: Ticket;
  compacto?: boolean;
  className?: string;
}) => {
  const { respuesta, resolucion } = plazosDeTicket(ticket);
  if (compacto) {
    // Una sola línea: lo más urgente. Un vencido pesa más que un pendiente,
    // y la primera respuesta va antes que la resolución.
    const urge = (p: Plazo) => p.estado === "pending" || p.estado === "overdue";
    const elegido =
      resolucion.estado === "overdue" && respuesta.estado !== "overdue"
        ? { clave: "due", plazo: resolucion }
        : urge(respuesta)
          ? { clave: "response", plazo: respuesta }
          : urge(resolucion)
            ? { clave: "due", plazo: resolucion }
            : null;
    if (!elegido) return null;
    return (
      <div className={cn("flex flex-col", className)}>
        <Linea clave={elegido.clave} plazo={elegido.plazo} />
      </div>
    );
  }
  if (respuesta.estado === "none" && resolucion.estado === "none") return null;
  return (
    <div className={cn("flex flex-col", className)}>
      <Linea clave="response" plazo={respuesta} />
      <Linea clave="due" plazo={resolucion} />
    </div>
  );
};

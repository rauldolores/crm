import { AlertTriangle } from "lucide-react";
import { useTranslate } from "ra-core";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

import type { CustomerSummary } from "../types";

/**
 * Señal de riesgo por soporte: 3 o más tickets abiertos, o alguno vencido
 * (lo calcula la vista customer_summary). Un cliente con contrato y soporte
 * atascado es el primero que se va; se ve en la lista y en la ficha, con
 * el enlace a sus tickets.
 */
export const RiesgoDeCliente = ({
  resumen,
  compacto = false,
  className,
}: {
  resumen: CustomerSummary;
  compacto?: boolean;
  className?: string;
}) => {
  const translate = useTranslate();
  const abiertos = Number(resumen.open_tickets ?? 0);
  const vencidos = Number(resumen.overdue_tickets ?? 0);
  const enlace = `/tickets?filter=${encodeURIComponent(
    JSON.stringify({ company_id: resumen.id, "status@neq": "closed" }),
  )}`;

  if (abiertos === 0) {
    return compacto ? (
      <span className={cn("text-muted-foreground", className)}>—</span>
    ) : null;
  }

  const detalle = vencidos
    ? translate("crm.customers.risk.overdue", { smart_count: vencidos })
    : translate("crm.customers.risk.open", { smart_count: abiertos });

  if (compacto) {
    return (
      <Link
        to={enlace}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center gap-1 text-sm",
          resumen.at_risk ? "font-medium text-destructive" : "",
          className,
        )}
      >
        {resumen.at_risk && <AlertTriangle className="size-3.5" />}
        {detalle}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm",
        resumen.at_risk
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "text-muted-foreground",
        className,
      )}
    >
      {resumen.at_risk && <AlertTriangle className="size-4 shrink-0" />}
      <span className="font-medium">
        {resumen.at_risk
          ? translate("crm.customers.risk.at_risk")
          : translate("crm.customers.risk.support")}
      </span>
      <span>· {detalle}</span>
      <Link to={enlace} className="ml-auto underline underline-offset-2">
        {translate("crm.customers.risk.see_tickets")}
      </Link>
    </div>
  );
};

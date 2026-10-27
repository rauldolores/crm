import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";

import { ReferenceField } from "@/components/admin/reference-field";
import { Button } from "@/components/ui/button";

import type { Automation, AutomationLog } from "../types";
import { RelativeDate } from "./RelativeDate";

/** Cuántas ejecuciones recientes se leen por regla. */
const LINEAS_POR_REGLA = 20;

/**
 * Lo que hizo una regla últimamente: cuándo se disparó por última vez, si
 * falló, y —al desplegarlo— sobre qué registros actuó y con qué resultado.
 *
 * Los motores de reglas se tragan los errores para no tumbar el cambio que
 * las disparó, así que esto es la única forma de ver que una regla está rota
 * sin abrir la base de datos.
 */
export const HistorialDeRegla = ({ regla }: { regla: Automation }) => {
  const translate = useTranslate();
  const [abierto, setAbierto] = useState(false);
  const { data: lineas, total } = useGetList<AutomationLog>("automation_log", {
    filter: { automation_id: regla.id },
    pagination: { page: 1, perPage: LINEAS_POR_REGLA },
    sort: { field: "created_at", order: "DESC" },
  });

  if (!lineas) return null;

  if (lineas.length === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {translate("crm.automations.history.never")}
      </p>
    );
  }

  const fallos = lineas.filter((linea) => linea.result === "error").length;

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span>
          {translate("crm.automations.history.last")}{" "}
          <RelativeDate date={lineas[0].created_at} />
        </span>
        <span aria-hidden>·</span>
        <span>
          {translate("crm.automations.history.runs", {
            smart_count: total ?? lineas.length,
          })}
        </span>
        {fallos > 0 && (
          <span className="flex items-center gap-1 text-destructive font-medium">
            <AlertTriangle className="h-3 w-3" />
            {translate("crm.automations.history.recent_errors", {
              smart_count: fallos,
            })}
          </span>
        )}
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          aria-expanded={abierto}
          onClick={() => setAbierto((anterior) => !anterior)}
        >
          {translate(
            abierto
              ? "crm.automations.history.hide"
              : "crm.automations.history.show",
          )}
        </Button>
      </div>
      {abierto && (
        <ul className="mt-2 space-y-1.5 border-l pl-3">
          {lineas.map((linea) => (
            <LineaDelHistorial
              key={linea.id}
              linea={linea}
              accion={regla.action_type}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const LineaDelHistorial = ({
  linea,
  accion,
}: {
  linea: AutomationLog;
  accion: Automation["action_type"];
}) => {
  const translate = useTranslate();
  const Icono =
    linea.result === "ok"
      ? CheckCircle2
      : linea.result === "error"
        ? AlertTriangle
        : MinusCircle;
  const color =
    linea.result === "ok"
      ? "text-emerald-600"
      : linea.result === "error"
        ? "text-destructive"
        : "text-muted-foreground";

  // Con éxito, lo que pasó depende de la acción de la regla; sin efecto o con
  // error, lo explica el motor en `detail`.
  const queHizo =
    linea.result === "ok"
      ? translate(`crm.automations.history.done.${accion}`)
      : translate(`crm.automations.history.${linea.result}`, {
          detail: linea.detail ?? "—",
        });

  return (
    <li className="flex items-start gap-2 text-xs">
      <Icono className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
      <div className="min-w-0">
        <span className="font-medium">
          <RegistroAfectado linea={linea} />
        </span>{" "}
        <span className={linea.result === "error" ? "text-destructive" : ""}>
          {queHizo}
        </span>{" "}
        <span className="text-muted-foreground">
          <RelativeDate date={linea.created_at} />
        </span>
      </div>
    </li>
  );
};

/** El registro sobre el que actuó la regla, enlazado cuando hay ficha. */
const RegistroAfectado = ({ linea }: { linea: AutomationLog }) => {
  const translate = useTranslate();

  if (linea.deal_id != null) {
    return (
      <ReferenceField
        source="deal_id"
        reference="deals"
        record={linea}
        link="show"
      />
    );
  }
  if (linea.ticket_id != null) {
    return (
      <Link to={`/tickets/${linea.ticket_id}/show`} className="underline">
        {translate("crm.automations.history.ticket", { id: linea.ticket_id })}
      </Link>
    );
  }
  if (linea.contact_id != null) {
    return (
      <ReferenceField
        source="contact_id"
        reference="contacts"
        record={linea}
        link="show"
      />
    );
  }
  if (linea.quote_id != null) {
    return translate("crm.automations.history.quote", { id: linea.quote_id });
  }
  if (linea.contract_id != null) {
    return translate("crm.automations.history.contract", {
      id: linea.contract_id,
    });
  }
  return null;
};

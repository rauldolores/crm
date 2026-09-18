import { useGetList, useGetMany, useTranslate } from "ra-core";
import type { Identifier, RaRecord } from "ra-core";

import { formatRelativeDate, LOCALE } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale } from "../types";

/** Una fila de crm.deal_events. */
type DealEvent = {
  deal_id: Identifier;
  sales_id?: Identifier | null;
  /** created | stage | amount | sales_id | archived | unarchived */
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
} & Pick<RaRecord, "id">;

/**
 * Quién cambió qué y cuándo en una oportunidad (crm.deal_events). Lo escribe
 * la base con un disparador, así que cuenta también lo que mueve el kanban,
 * la API o el asistente — no solo lo que se edita en este formulario.
 */
export const HistorialDeOportunidad = ({ dealId }: { dealId: Identifier }) => {
  const translate = useTranslate();
  const { dealStages, currency } = useConfigurationContext();
  const { data: eventos, isPending } = useGetList<DealEvent>("deal_events", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "DESC" },
    filter: { deal_id: dealId },
  });
  const idsDeUsuarios = Array.from(
    new Set(
      (eventos ?? [])
        .flatMap((e) => [
          e.sales_id,
          e.field === "sales_id" ? Number(e.new_value) : null,
        ])
        .filter((id): id is number => id != null && Number.isFinite(id)),
    ),
  );
  const { data: usuarios } = useGetMany<Sale>(
    "sales",
    { ids: idsDeUsuarios },
    { enabled: idsDeUsuarios.length > 0 },
  );

  if (isPending || !eventos?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("resources.deals.history.empty")}
      </p>
    );
  }

  const nombre = (id?: string | number | null) => {
    if (id == null || id === "")
      return translate("resources.deals.history.unassigned");
    const u = usuarios?.find((s) => String(s.id) === String(id));
    return u ? `${u.first_name} ${u.last_name}` : `#${id}`;
  };
  const etapa = (valor?: string | null) =>
    dealStages.find((s) => s.value === valor)?.label ?? valor ?? "—";
  const importe = (valor?: string | null) =>
    valor == null || valor === ""
      ? "—"
      : Number(valor).toLocaleString(LOCALE, {
          style: "currency",
          currency,
          currencyDisplay: "narrowSymbol",
          maximumFractionDigits: 0,
        });

  const describir = (e: DealEvent): string => {
    switch (e.field) {
      case "created":
        return translate("resources.deals.history.created", {
          stage: etapa(e.new_value),
        });
      case "stage":
        return translate("resources.deals.history.stage", {
          from: etapa(e.old_value),
          to: etapa(e.new_value),
        });
      case "amount":
        return translate("resources.deals.history.amount", {
          from: importe(e.old_value),
          to: importe(e.new_value),
        });
      case "sales_id":
        return translate("resources.deals.history.sales_id", {
          to: nombre(e.new_value),
        });
      case "archived":
        return translate(
          e.new_value === "won"
            ? "resources.deals.history.won"
            : "resources.deals.history.archived",
          { stage: etapa(e.new_value) },
        );
      case "unarchived":
        return translate("resources.deals.history.unarchived");
      default:
        return e.field;
    }
  };

  return (
    <ol className="flex flex-col gap-2 text-sm">
      {eventos.map((e) => (
        <li key={e.id} className="flex flex-col">
          <span>{describir(e)}</span>
          <span className="text-xs text-muted-foreground">
            {e.sales_id != null
              ? nombre(e.sales_id)
              : translate("resources.deals.history.system")}
            {" · "}
            {formatRelativeDate(e.created_at)}
          </span>
        </li>
      ))}
    </ol>
  );
};

import { Archive } from "lucide-react";
import { useListContext, useTranslate } from "ra-core";
import { Link } from "react-router";

import { LOCALE } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

/**
 * Filas compactas de oportunidades para el panorama de un contacto: nombre,
 * etapa e importe, con enlace a la ficha. Espera vivir dentro de un
 * ListContext (ListBase / ReferenceManyField).
 */
export const DealsIterator = () => {
  const translate = useTranslate();
  const { data, isPending, error } = useListContext<Deal>();
  const { dealStages, currency } = useConfigurationContext();

  if (isPending || error) return null;
  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("resources.deals.empty.title")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {data.map((deal) => {
        const etapa =
          dealStages.find((s) => s.value === deal.stage)?.label ?? deal.stage;
        return (
          <Link
            key={deal.id}
            to={`/deals/${deal.id}/show`}
            className="flex items-start gap-2 rounded px-1 py-1.5 -mx-1 text-foreground no-underline transition-colors hover:bg-muted"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm">
                <span className="truncate">{deal.name}</span>
                {deal.archived_at && (
                  <Archive
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-label={translate("resources.deals.archived.title")}
                  />
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {etapa}
                {deal.amount
                  ? ` · ${deal.amount.toLocaleString(LOCALE, {
                      style: "currency",
                      currency,
                      currencyDisplay: "narrowSymbol",
                      maximumFractionDigits: 0,
                    })}`
                  : ""}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

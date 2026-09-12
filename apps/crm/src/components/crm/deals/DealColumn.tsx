import { LOCALE } from "../misc/RelativeDate";
import { Droppable } from "@hello-pangea/dnd";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { findDealLabel } from "./dealUtils";
import { DealCard } from "./DealCard";

export const DealColumn = ({
  stage,
  deals,
}: {
  stage: string;
  deals: Deal[];
}) => {
  const totalAmount = deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);
  const { dealStages, currency } = useConfigurationContext();
  return (
    <div className="flex-1 pb-8">
      <div className="flex flex-col items-center gap-0.5">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          {findDealLabel(dealStages, stage)}
          <span className="rounded-full bg-muted px-1.5 text-xs font-normal text-muted-foreground tabular-nums">
            {deals.length}
          </span>
        </h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          {totalAmount.toLocaleString(LOCALE, {
            notation: "compact",
            style: "currency",
            currency,
            currencyDisplay: "narrowSymbol",
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
      <Droppable droppableId={stage}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`mt-3 flex min-h-24 flex-col gap-2 rounded-xl p-1 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-accent"
                : deals.length === 0
                  ? "border border-dashed"
                  : ""
            }`}
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

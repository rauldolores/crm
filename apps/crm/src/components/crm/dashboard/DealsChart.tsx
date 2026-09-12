import { LOCALE } from "../misc/RelativeDate";
import { ResponsiveBar } from "@nivo/bar";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { memo, useMemo } from "react";

import { findDealLabel } from "../deals/dealUtils";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

const multiplier = {
  opportunity: 0.2,
  "proposal-sent": 0.5,
  "in-negociation": 0.8,
  delayed: 0.3,
};

const threeMonthsAgo = new Date(
  new Date().setMonth(new Date().getMonth() - 6),
).toISOString();

export const DealsChart = memo(() => {
  const translate = useTranslate();
  const { dealStages, currency } = useConfigurationContext();
  const wonLabel = findDealLabel(dealStages, "won") ?? "Ganadas";
  const lostLabel = findDealLabel(dealStages, "lost") ?? "Perdidas";

  const { data, isPending } = useGetList<Deal>("deals", {
    pagination: { perPage: 100, page: 1 },
    sort: {
      field: "created_at",
      order: "ASC",
    },
    filter: {
      "created_at@gte": threeMonthsAgo,
    },
  });
  const months = useMemo(() => {
    if (!data) return [];
    const dealsByMonth = data.reduce((acc, deal) => {
      const month = startOfMonth(deal.created_at ?? new Date()).toISOString();
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(deal);
      return acc;
    }, {} as any);

    const amountByMonth = Object.keys(dealsByMonth).map((month) => {
      return {
        date: format(month, "MMM", { locale: es }),
        won: dealsByMonth[month]
          .filter((deal: Deal) => deal.stage === "won")
          .reduce((acc: number, deal: Deal) => {
            acc += deal.amount ?? 0;
            return acc;
          }, 0),
        pending: dealsByMonth[month]
          .filter((deal: Deal) => !["won", "lost"].includes(deal.stage))
          .reduce((acc: number, deal: Deal) => {
            // @ts-expect-error - multiplier type issue
            acc += (deal.amount ?? 0) * multiplier[deal.stage];
            return acc;
          }, 0),
        lost: dealsByMonth[month]
          .filter((deal: Deal) => deal.stage === "lost")
          .reduce((acc: number, deal: Deal) => {
            acc -= deal.amount ?? 0;
            return acc;
          }, 0),
      };
    });

    return amountByMonth;
  }, [data]);

  if (isPending) return null; // FIXME return skeleton instead
  const range = months.reduce(
    (acc, month) => {
      acc.min = Math.min(acc.min, month.lost);
      acc.max = Math.max(acc.max, month.won + month.pending);
      return acc;
    },
    { min: 0, max: 0 },
  );
  // Sin importes no hay nada que dibujar: mejor decirlo que pintar dos ejes
  // en blanco alrededor de una línea en cero.
  const sinDatos = range.min === 0 && range.max === 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {translate("crm.dashboard.deals_chart")}
        </h2>
      </div>
      {sinDatos ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p className="max-w-sm">
            {translate("crm.dashboard.deals_chart_empty")}
          </p>
        </div>
      ) : (
        <div className="h-[400px]">
          <ResponsiveBar
            data={months}
            indexBy="date"
            keys={["won", "pending", "lost"]}
            colors={["#2f9e8f", "#9fd8cd", "#d9573f"]}
            margin={{ top: 30, right: 50, bottom: 30, left: 0 }}
            padding={0.3}
            valueScale={{
              type: "linear",
              min: range.min * 1.2,
              max: range.max * 1.2,
            }}
            indexScale={{ type: "band", round: true }}
            enableGridX={true}
            enableGridY={false}
            enableLabel={false}
            tooltip={({ value, indexValue }) => (
              <div className="p-2 bg-secondary rounded shadow inline-flex items-center gap-1 text-secondary-foreground">
                <strong>{indexValue}: </strong>&nbsp;{value > 0 ? "+" : ""}
                {value.toLocaleString(LOCALE, {
                  style: "currency",
                  currency,
                })}
              </div>
            )}
            axisTop={{
              tickSize: 0,
              tickPadding: 12,
              style: {
                ticks: {
                  text: {
                    fill: "var(--color-muted-foreground)",
                  },
                },
                legend: {
                  text: {
                    fill: "var(--color-muted-foreground)",
                  },
                },
              },
            }}
            axisBottom={{
              legendPosition: "middle",
              legendOffset: 50,
              tickSize: 0,
              tickPadding: 12,
              style: {
                ticks: {
                  text: {
                    fill: "var(--color-muted-foreground)",
                  },
                },
                legend: {
                  text: {
                    fill: "var(--color-muted-foreground)",
                  },
                },
              },
            }}
            axisLeft={null}
            axisRight={{
              format: (v: any) => `${Math.abs(v / 1000)}k`,
              tickValues: 8,
              style: {
                ticks: {
                  text: {
                    fill: "var(--color-muted-foreground)",
                  },
                },
                legend: {
                  text: {
                    fill: "var(--color-muted-foreground)",
                  },
                },
              },
            }}
            markers={
              [
                {
                  axis: "y",
                  value: 0,
                  lineStyle: { strokeOpacity: 0 },
                  textStyle: { fill: "#2f9e8f" },
                  legend: wonLabel,
                  legendPosition: "top-left",
                  legendOrientation: "vertical",
                },
                {
                  axis: "y",
                  value: 0,
                  lineStyle: {
                    stroke: "#d9573f",
                    strokeWidth: 1,
                  },
                  textStyle: { fill: "#d9573f" },
                  legend: lostLabel,
                  legendPosition: "bottom-left",
                  legendOrientation: "vertical",
                },
              ] as any
            }
          />
        </div>
      )}
    </div>
  );
});

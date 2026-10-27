import { Droppable } from "@hello-pangea/dnd";
import { useTranslate } from "ra-core";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { LOCALE } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, DealPipeline } from "../types";
import { findDealLabel } from "./dealUtils";
import { DealCard } from "./DealCard";
import { probabilidadDeEtapa } from "./probabilidad";

/**
 * Tarjetas que se pintan de entrada por columna. Un embudo viejo acumula
 * cientos de oportunidades abiertas en una etapa; pintarlas todas de golpe
 * hace lento el tablero y no aporta: se ven por tramos con «Ver más». La
 * cuenta de la cabecera es de la etapa entera; las tarjetas y el importe,
 * de las cargadas (ver OPORTUNIDADES_POR_ETAPA).
 */
export const TARJETAS_POR_TRAMO = 30;

export const DealColumn = ({
  stage,
  // Con valor por defecto aunque el tipo diga que siempre llega: el tablero
  // lo saca de un objeto indexado por etapa, y una firma de índice miente
  // —TypeScript da por hecho que hay valor para cualquier clave—, así que un
  // undefined no lo detecta el typecheck y aquí reventaba el reduce.
  deals = [],
  total = deals.length,
  embudo,
}: {
  stage: string;
  deals?: Deal[];
  /** Abiertas de la etapa con los filtros aplicados, cargadas o no. */
  total?: number;
  embudo: DealPipeline;
}) => {
  const translate = useTranslate();
  const totalAmount = deals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);
  const { dealStages, currency } = useConfigurationContext();
  const probabilidad = probabilidadDeEtapa(embudo, stage);
  const importe = (valor: number) =>
    valor.toLocaleString(LOCALE, {
      notation: "compact",
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
  // Cambiar de embudo monta columnas nuevas (van por etapa), así que el
  // tramo visible vuelve solo al primero.
  const [visibles, setVisibles] = useState(TARJETAS_POR_TRAMO);

  const tarjetas = deals.slice(0, visibles);
  const ocultas = deals.length - tarjetas.length;
  // Lo que no se cargó: solo pasa en etapas muy llenas.
  const sinCargar = Math.max(total - deals.length, 0);

  return (
    <div className="w-72 shrink-0 pb-8">
      <div className="flex flex-col items-center gap-0.5">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          {findDealLabel(dealStages, stage)}
          <span className="rounded-full bg-muted px-1.5 text-xs font-normal text-muted-foreground tabular-nums">
            {total.toLocaleString(LOCALE)}
          </span>
        </h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          {/* Con la etapa sin cargar entera, el importe es solo de las
              cargadas: se dice que es un mínimo y no se pondera. */}
          {sinCargar > 0 && "≥ "}
          {importe(totalAmount)}
          {sinCargar === 0 &&
            totalAmount > 0 &&
            probabilidad > 0 &&
            probabilidad < 100 && (
              <span
                title={translate("resources.deals.weighted_help", {
                  probability: probabilidad,
                })}
              >
                {" · "}
                {translate("resources.deals.weighted", {
                  amount: importe((totalAmount * probabilidad) / 100),
                  probability: probabilidad,
                })}
              </span>
            )}
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
            {tarjetas.map((deal, index) => (
              <DealCard key={deal.id} deal={deal} index={index} />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
      {ocultas > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 w-full text-muted-foreground"
          onClick={() => setVisibles((n) => n + TARJETAS_POR_TRAMO)}
        >
          {translate("resources.deals.board.show_more_of", {
            count: Math.min(ocultas, TARJETAS_POR_TRAMO),
            total: deals.length,
          })}
        </Button>
      )}
      {sinCargar > 0 && (
        <p
          role="status"
          className="mt-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground"
        >
          {translate("resources.deals.board.column_truncated", {
            shown: deals.length.toLocaleString(LOCALE),
            total: total.toLocaleString(LOCALE),
          })}
        </p>
      )}
    </div>
  );
};

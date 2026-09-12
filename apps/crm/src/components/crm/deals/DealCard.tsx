import { Draggable } from "@hello-pangea/dnd";
import { useRedirect, RecordContextProvider, useTranslate } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { LOCALE } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";

export const DealCard = ({ deal, index }: { deal: Deal; index: number }) => {
  if (!deal) return null;

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <DealCardContent provided={provided} snapshot={snapshot} deal={deal} />
      )}
    </Draggable>
  );
};

/**
 * Tarjeta del kanban. Jerarquía en tres niveles: el nombre de la
 * oportunidad (lo que se busca con la vista), la empresa debajo en
 * atenuado, y al pie el importe en cifras tabulares con la categoría como
 * píldora. Antes iba todo en una sola línea «Empresa - Nombre» y el importe
 * desaparecía cuando era cero.
 */
export const DealCardContent = ({
  provided,
  snapshot,
  deal,
}: {
  provided?: any;
  snapshot?: any;
  deal: Deal;
}) => {
  const { dealCategories, currency } = useConfigurationContext();
  const translate = useTranslate();
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(`/deals/${deal.id}/show`, undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  const categoria = dealCategories.find((c) => c.value === deal.category);
  const importe = deal.amount
    ? deal.amount.toLocaleString(LOCALE, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
      })
    : null;

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <RecordContextProvider value={deal}>
        <Card
          className={`py-3 transition-all duration-200 ${
            snapshot?.isDragging
              ? "opacity-90 transform rotate-1 shadow-lg"
              : "hover:border-primary/40"
          }`}
        >
          <CardContent className="flex flex-col gap-1.5 px-3">
            <div className="flex items-start gap-2">
              <p className="line-clamp-2 flex-1 text-sm leading-snug font-medium">
                {deal.name}
              </p>
              <ReferenceField
                source="company_id"
                reference="companies"
                link={false}
              >
                <CompanyAvatar width={20} height={20} />
              </ReferenceField>
            </div>
            <ReferenceField
              source="company_id"
              reference="companies"
              link={false}
            >
              <TextField
                source="name"
                className="block truncate text-xs text-muted-foreground"
              />
            </ReferenceField>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span
                className={
                  importe
                    ? "text-sm font-medium tabular-nums"
                    : "text-xs text-muted-foreground"
                }
              >
                {importe ?? translate("resources.deals.no_amount")}
              </span>
              {categoria && (
                <Badge variant="secondary" className="rounded-full font-normal">
                  {categoria.label}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};

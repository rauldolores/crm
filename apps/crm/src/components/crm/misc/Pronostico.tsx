import { useTranslate } from "ra-core";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  estaAbierta,
  importePonderado,
  probabilidadDeEtapa,
  pronosticoPorMes,
} from "../deals/probabilidad";
import type { Deal, DealPipeline } from "../types";
import { Grafica, Indicador } from "./PiezasDeInforme";
import { LOCALE } from "./RelativeDate";

/**
 * Pronóstico del embudo: cuánto hay abierto, cuánto vale ponderado por la
 * probabilidad de cada etapa, en qué mes se espera cerrar y cómo se reparte
 * por etapa. No depende del periodo de arriba: mira hacia delante, no hacia
 * atrás.
 */
export const Pronostico = ({
  oportunidades,
  embudo,
  moneda,
}: {
  oportunidades: Deal[];
  embudo: DealPipeline;
  moneda: string;
}) => {
  const translate = useTranslate();
  const importe = (valor: number) =>
    valor.toLocaleString(LOCALE, {
      style: "currency",
      currency: moneda,
      maximumFractionDigits: 0,
    });

  const abiertas = oportunidades.filter(
    (oportunidad) =>
      (oportunidad.pipeline ?? "ventas") === embudo.value &&
      estaAbierta(oportunidad, embudo),
  );
  const abierto = abiertas.reduce((total, o) => total + (o.amount ?? 0), 0);
  const ponderado = abiertas.reduce(
    (total, o) => total + importePonderado(o, embudo),
    0,
  );
  const meses = pronosticoPorMes(abiertas, embudo, {
    locale: LOCALE,
    sinFecha: translate("crm.reports.forecast.no_date"),
  });
  const porEtapa = embudo.stages
    .filter(
      (etapa) =>
        !(embudo.pipelineStatuses ?? []).includes(etapa.value) &&
        !(embudo.lostStages ?? []).includes(etapa.value),
    )
    .map((etapa) => {
      const deEtapa = abiertas.filter((o) => o.stage === etapa.value);
      const total = deEtapa.reduce((suma, o) => suma + (o.amount ?? 0), 0);
      const probabilidad = probabilidadDeEtapa(embudo, etapa.value);
      return {
        etapa,
        cantidad: deEtapa.length,
        total,
        probabilidad,
        ponderado: (total * probabilidad) / 100,
      };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate("crm.reports.forecast.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {translate("crm.reports.forecast.intro")}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {abiertas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {translate("crm.reports.forecast.empty")}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Indicador
                etiqueta={translate("crm.reports.forecast.open_count")}
                valor={String(abiertas.length)}
              />
              <Indicador
                etiqueta={translate("crm.reports.forecast.open")}
                valor={importe(abierto)}
              />
              <Indicador
                etiqueta={translate("crm.reports.forecast.weighted")}
                valor={importe(ponderado)}
              />
            </div>

            <Grafica
              datos={meses.map((mes) => ({
                id: mes.etiqueta,
                valor: Math.round(mes.ponderado),
              }))}
              vacio={translate("crm.reports.forecast.empty")}
              color="#f1c40f"
              formato={importe}
            />

            <table className="w-full text-sm">
              <caption className="sr-only">
                {translate("crm.reports.forecast.by_stage")}
              </caption>
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 text-left font-medium">
                    {translate("crm.reports.forecast.stage")}
                  </th>
                  <th className="py-1 text-right font-medium">
                    {translate("crm.reports.forecast.count")}
                  </th>
                  <th className="py-1 text-right font-medium">
                    {translate("crm.reports.forecast.amount")}
                  </th>
                  <th className="py-1 text-right font-medium">
                    {translate("crm.reports.forecast.probability")}
                  </th>
                  <th className="py-1 text-right font-medium">
                    {translate("crm.reports.forecast.weighted_amount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {porEtapa.map((fila) => (
                  <tr key={fila.etapa.value} className="border-t">
                    <td className="py-1.5">{fila.etapa.label}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {fila.cantidad}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {importe(fila.total)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {fila.probabilidad} %
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-medium">
                      {importe(fila.ponderado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

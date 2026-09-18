import { useGetList, useTranslate } from "ra-core";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale, Ticket, TicketEvent } from "../types";
import { Grafica, Indicador } from "./PiezasDeInforme";
import { metricasDeSoporte } from "./metricasDeSoporte";

/**
 * Informe de soporte: cuántos tickets entran y salen, cuánto se tarda en
 * responder y en resolver, si se cumplen los plazos, qué dice el cliente
 * (CSAT), dónde se acumulan (categoría) y quién carga con ellos.
 *
 * Se calcula en el navegador como el resto de informes: para el volumen
 * de una pyme sobra, y así usa las prioridades y categorías que configuró
 * la organización. Solo aparece cuando hay tickets.
 */
export const InformeDeSoporte = ({ dias }: { dias: number | null }) => {
  const translate = useTranslate();
  const { ticketCategories } = useConfigurationContext();

  const { data: tickets } = useGetList<Ticket>("tickets", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "created_at", order: "DESC" },
  });
  // Reaperturas: cambios de estado que salen de «cerrado».
  const { data: reaperturas } = useGetList<TicketEvent>("ticket_events", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "created_at", order: "DESC" },
    filter: { field: "status", old_value: "closed" },
  });
  const { data: comerciales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "last_name", order: "ASC" },
  });

  const metricas = useMemo(
    () =>
      metricasDeSoporte(
        tickets ?? [],
        reaperturas ?? [],
        dias ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000) : null,
      ),
    [tickets, reaperturas, dias],
  );

  if (!tickets?.length) return null;

  const horas = (valor: number | null) =>
    valor == null
      ? "—"
      : valor < 48
        ? translate("crm.reports.support.hours", { count: Math.round(valor) })
        : translate("crm.reports.support.days", {
            count: Math.round((valor / 24) * 10) / 10,
          });
  const porcentaje = (valor: number | null) =>
    valor == null ? "—" : `${Math.round(valor)} %`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate("crm.reports.support.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Indicador
            etiqueta={translate("crm.reports.support.created")}
            valor={String(metricas.creados)}
          />
          <Indicador
            etiqueta={translate("crm.reports.support.closed")}
            valor={String(metricas.cerrados)}
          />
          <Indicador
            etiqueta={translate("crm.reports.support.open_now")}
            valor={String(metricas.abiertos)}
          />
          <Indicador
            etiqueta={translate("crm.reports.support.overdue_now")}
            valor={String(metricas.vencidos)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Indicador
            etiqueta={translate("crm.reports.support.first_response")}
            valor={horas(metricas.mediaPrimeraRespuestaHoras)}
          />
          <Indicador
            etiqueta={translate("crm.reports.support.resolution")}
            valor={horas(metricas.mediaResolucionHoras)}
          />
          <Indicador
            etiqueta={translate("crm.reports.support.sla")}
            valor={porcentaje(metricas.slaCumplidoPct)}
          />
          <Indicador
            etiqueta={translate("crm.reports.support.csat")}
            valor={
              metricas.csat == null ? "—" : `${metricas.csat.toFixed(1)} / 5`
            }
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {translate("crm.reports.support.footnote", {
            reopened: metricas.reaperturas,
            surveys: metricas.encuestas,
            sla_count: metricas.conPlazo,
          })}
        </p>

        <div>
          <p className="mb-2 text-sm font-medium">
            {translate("crm.reports.support.by_category")}
          </p>
          <Grafica
            datos={[
              ...ticketCategories.map((categoria) => ({
                id: categoria.label,
                valor: metricas.porCategoria[categoria.value] ?? 0,
              })),
              {
                id: translate("resources.tickets.no_category"),
                valor: metricas.porCategoria[""] ?? 0,
              },
            ].filter((fila) => fila.valor > 0)}
            vacio={translate("crm.reports.empty")}
            color="#f1a56a"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            {translate("crm.reports.support.by_owner")}
          </p>
          <Grafica
            datos={[
              ...(comerciales ?? []).map((comercial) => ({
                id: `${comercial.first_name} ${comercial.last_name}`,
                valor:
                  metricas.abiertosPorResponsable[String(comercial.id)] ?? 0,
              })),
              {
                id: translate("resources.tickets.unassigned"),
                valor: metricas.abiertosPorResponsable[""] ?? 0,
              },
            ].filter((fila) => fila.valor > 0)}
            vacio={translate("crm.reports.support.no_open")}
            color="#e8a0a0"
          />
        </div>
      </CardContent>
    </Card>
  );
};

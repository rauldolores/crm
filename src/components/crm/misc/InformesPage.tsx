import { ResponsiveBar } from "@nivo/bar";
import { useGetList, useTranslate } from "ra-core";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal, Sale } from "../types";
import { LOCALE } from "./RelativeDate";

/**
 * Los tres informes con los que se decide en una pyme: dónde se atoran las
 * oportunidades, quién vende, y por qué se pierde.
 *
 * Se calculan en el navegador sobre las oportunidades del periodo en vez de
 * en vistas de base de datos: para el volumen de una pyme sobra, y así los
 * informes siguen los mismos embudos y motivos que cada organización
 * configuró, sin duplicar esa lógica en SQL.
 */
export const InformesPage = () => {
  const translate = useTranslate();
  const { dealPipelines, currency } = useConfigurationContext();
  const [dias, setDias] = useState<number | null>(90);
  const [embudoActivo, setEmbudoActivo] = useState(dealPipelines[0]?.value);

  const { data: oportunidades, isPending } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "created_at", order: "DESC" },
  });
  const { data: comerciales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "last_name", order: "ASC" },
  });

  const embudo =
    dealPipelines.find((candidato) => candidato.value === embudoActivo) ??
    dealPipelines[0];

  const delPeriodo = useMemo(() => {
    const desde = dias
      ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
      : null;
    return (oportunidades ?? []).filter((oportunidad) => {
      if ((oportunidad.pipeline ?? "ventas") !== embudo?.value) return false;
      if (!desde) return true;
      return new Date(oportunidad.created_at) >= desde;
    });
  }, [oportunidades, dias, embudo?.value]);

  const ganadas = delPeriodo.filter((oportunidad) =>
    (embudo?.pipelineStatuses ?? []).includes(oportunidad.stage),
  );
  const perdidas = delPeriodo.filter((oportunidad) =>
    (embudo?.lostStages ?? []).includes(oportunidad.stage),
  );
  const cerradas = ganadas.length + perdidas.length;
  const conversion = cerradas > 0 ? (ganadas.length / cerradas) * 100 : null;

  const periodos = [
    { valor: 90, etiqueta: translate("crm.reports.periods.quarter") },
    { valor: 365, etiqueta: translate("crm.reports.periods.year") },
    { valor: null, etiqueta: translate("crm.reports.periods.all") },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.reports.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.reports.intro")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {periodos.map((periodo) => (
          <Button
            key={String(periodo.valor)}
            type="button"
            size="sm"
            variant={dias === periodo.valor ? "default" : "outline"}
            onClick={() => setDias(periodo.valor)}
          >
            {periodo.etiqueta}
          </Button>
        ))}
        {dealPipelines.length > 1 && (
          <div className="flex flex-wrap gap-2 ml-auto">
            {dealPipelines.map((candidato) => (
              <Button
                key={candidato.value}
                type="button"
                size="sm"
                variant={
                  candidato.value === embudo?.value ? "default" : "outline"
                }
                onClick={() => setEmbudoActivo(candidato.value)}
              >
                {candidato.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isPending ? null : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Indicador
              etiqueta={translate("crm.reports.total")}
              valor={String(delPeriodo.length)}
            />
            <Indicador
              etiqueta={translate("crm.reports.won")}
              valor={String(ganadas.length)}
            />
            <Indicador
              etiqueta={translate("crm.reports.lost")}
              valor={String(perdidas.length)}
            />
            <Indicador
              etiqueta={translate("crm.reports.conversion")}
              valor={conversion == null ? "—" : `${Math.round(conversion)} %`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{translate("crm.reports.by_stage")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Grafica
                datos={(embudo?.stages ?? []).map((etapa) => ({
                  id: etapa.label,
                  valor: delPeriodo.filter(
                    (oportunidad) => oportunidad.stage === etapa.value,
                  ).length,
                }))}
                vacio={translate("crm.reports.empty")}
                color="#61cdbb"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{translate("crm.reports.by_owner")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Grafica
                datos={(comerciales ?? [])
                  .map((comercial) => ({
                    id: `${comercial.first_name} ${comercial.last_name}`,
                    valor: ganadas
                      .filter(
                        (oportunidad) =>
                          String(oportunidad.sales_id) === String(comercial.id),
                      )
                      .reduce(
                        (total, oportunidad) =>
                          total + (oportunidad.amount ?? 0),
                        0,
                      ),
                  }))
                  .filter((fila) => fila.valor > 0)}
                vacio={translate("crm.reports.empty")}
                color="#97e3d5"
                formato={(valor) =>
                  valor.toLocaleString(LOCALE, {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  })
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{translate("crm.reports.by_loss_reason")}</CardTitle>
            </CardHeader>
            <CardContent>
              <MotivosDePerdida perdidas={perdidas} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

InformesPage.path = "/informes";

const Indicador = ({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) => (
  <div className="rounded-lg border p-3">
    <p className="text-xs text-muted-foreground">{etiqueta}</p>
    <p className="text-2xl font-semibold tabular-nums">{valor}</p>
  </div>
);

const Grafica = ({
  datos,
  vacio,
  color,
  formato,
}: {
  datos: { id: string; valor: number }[];
  vacio: string;
  color: string;
  formato?: (valor: number) => string;
}) => {
  if (datos.every((fila) => fila.valor === 0)) {
    return <p className="text-sm text-muted-foreground">{vacio}</p>;
  }

  return (
    <div className="h-[280px]">
      <ResponsiveBar
        data={datos}
        indexBy="id"
        keys={["valor"]}
        colors={[color]}
        margin={{ top: 10, right: 20, bottom: 60, left: 50 }}
        padding={0.3}
        enableGridX={false}
        enableLabel={false}
        axisBottom={{ tickRotation: -30 }}
        tooltip={({ value, indexValue }) => (
          <div className="p-2 bg-secondary rounded shadow inline-flex items-center gap-1 text-secondary-foreground text-sm">
            <strong>{indexValue}:</strong>{" "}
            {formato ? formato(value) : String(value)}
          </div>
        )}
      />
    </div>
  );
};

/**
 * Los motivos se listan en vez de graficarse: son pocos y lo que importa es
 * el porcentaje, que en una barra habría que ir a buscar al tooltip.
 */
const MotivosDePerdida = ({ perdidas }: { perdidas: Deal[] }) => {
  const translate = useTranslate();
  const { dealLossReasons } = useConfigurationContext();

  const filas = dealLossReasons
    .map((motivo) => ({
      etiqueta: motivo.label,
      cuenta: perdidas.filter(
        (oportunidad) => oportunidad.loss_reason === motivo.value,
      ).length,
    }))
    .filter((fila) => fila.cuenta > 0)
    .sort((a, b) => b.cuenta - a.cuenta);

  const sinMotivo = perdidas.filter(
    (oportunidad) => !oportunidad.loss_reason,
  ).length;

  if (perdidas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("crm.reports.no_losses")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {filas.map((fila) => (
        <div key={fila.etiqueta} className="flex items-center gap-3 text-sm">
          <span className="w-48 shrink-0 truncate">{fila.etiqueta}</span>
          <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-destructive"
              style={{ width: `${(fila.cuenta / perdidas.length) * 100}%` }}
            />
          </div>
          <span className="w-20 text-right tabular-nums text-muted-foreground">
            {fila.cuenta} ({Math.round((fila.cuenta / perdidas.length) * 100)}{" "}
            %)
          </span>
        </div>
      ))}
      {sinMotivo > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {translate("crm.reports.without_reason", { count: sinMotivo })}
        </p>
      )}
    </div>
  );
};

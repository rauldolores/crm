import {
  useGetList,
  useListContext,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { useMemo } from "react";

import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DataTable } from "@/components/admin/data-table";
import { DateInput } from "@/components/admin/date-input";
import { ExportButton } from "@/components/admin/export-button";
import { FilterButton } from "@/components/admin/filter-form";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { Badge } from "@/components/ui/badge";

import { TopToolbar } from "../layout/TopToolbar";
import { LOCALE, RelativeDate } from "../misc/RelativeDate";
import type { Quote, QuoteStatus } from "../types";
import { estadoVisible } from "./estado";

/**
 * Todas las cotizaciones de la organización en una sola lista, fuera de la
 * oportunidad: qué hay pendiente de respuesta, cuánto suma, y cuáles vencen.
 * Con veinte abiertas, ir oportunidad por oportunidad no escala.
 *
 * Las acciones (enviar, editar, marcar respondida) siguen viviendo en la
 * ficha de la oportunidad: la fila lleva ahí. Aquí solo se mira y se filtra.
 */

const ESTADOS: QuoteStatus[] = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
];

const VARIANTE_DE_ESTADO: Record<
  QuoteStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  draft: "outline",
  sent: "secondary",
  viewed: "secondary",
  accepted: "default",
  rejected: "destructive",
  expired: "outline",
};

const formatearImporte = (valor: number, moneda: string) =>
  Number(valor).toLocaleString(LOCALE, {
    style: "currency",
    currency: moneda || "MXN",
    maximumFractionDigits: 0,
  });

const formatearFecha = (fecha: string) =>
  new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" }).format(
    new Date(fecha.length === 10 ? `${fecha}T00:00:00` : fecha),
  );

const Acciones = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
  </TopToolbar>
);

const CampoDeEstado = () => {
  const record = useRecordContext<Quote>();
  const translate = useTranslate();
  if (!record) return null;
  const estado = estadoVisible(record);
  return (
    <Badge variant={VARIANTE_DE_ESTADO[estado]}>
      {translate(`crm.quotes.status.${estado}`)}
    </Badge>
  );
};

const CampoDeTotal = () => {
  const record = useRecordContext<Quote>();
  if (!record) return null;
  return (
    <span className="tabular-nums">
      {formatearImporte(record.total, record.currency)}
    </span>
  );
};

/** Cuándo salió y hasta cuándo vale, en una sola celda. */
const CampoDeVigencia = () => {
  const record = useRecordContext<Quote>();
  const translate = useTranslate();
  if (!record) return null;
  if (!record.sent_at && !record.valid_until) return null;
  return (
    <div className="flex flex-col text-xs">
      {record.sent_at ? (
        <span>
          {translate("resources.quotes.sent_on", {
            date: formatearFecha(record.sent_at),
          })}
        </span>
      ) : null}
      {record.valid_until ? (
        <span className="text-muted-foreground">
          {translate("crm.quotes.valid_until_short", {
            date: formatearFecha(record.valid_until),
          })}
        </span>
      ) : null}
    </div>
  );
};

const CampoDeFecha = () => {
  const record = useRecordContext<Quote>();
  if (!record?.created_at) return null;
  return <RelativeDate date={record.created_at} />;
};

/**
 * Lo que suma la lista tal y como está filtrada, no solo la página: cuánto
 * hay esperando respuesta y cuánto se cerró. Se pide aparte porque la lista
 * pagina, y un total de «los 25 de esta página» no le dice nada a nadie.
 */
const Resumen = () => {
  const translate = useTranslate();
  const { filterValues, filter } = useListContext();

  const { data } = useGetList<Quote>("quotes", {
    filter: { ...filter, ...filterValues },
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "created_at", order: "DESC" },
  });

  const resumen = useMemo(() => {
    const todas = data ?? [];
    const pendientes = todas.filter((cotizacion) => {
      const estado = estadoVisible(cotizacion);
      return estado === "sent" || estado === "viewed";
    });
    const aceptadas = todas.filter(
      (cotizacion) => cotizacion.status === "accepted",
    );
    const rechazadas = todas.filter(
      (cotizacion) => cotizacion.status === "rejected",
    );
    const sumar = (lista: Quote[]) =>
      lista.reduce((total, cotizacion) => total + Number(cotizacion.total), 0);
    const respondidas = aceptadas.length + rechazadas.length;
    return {
      moneda: todas[0]?.currency ?? "MXN",
      pendientes: { cuenta: pendientes.length, importe: sumar(pendientes) },
      aceptadas: { cuenta: aceptadas.length, importe: sumar(aceptadas) },
      aceptacion:
        respondidas > 0
          ? Math.round((aceptadas.length / respondidas) * 100)
          : null,
    };
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Indicador
        etiqueta={translate("crm.quotes.list.pending")}
        valor={formatearImporte(resumen.pendientes.importe, resumen.moneda)}
        detalle={translate("crm.quotes.list.count", {
          smart_count: resumen.pendientes.cuenta,
        })}
      />
      <Indicador
        etiqueta={translate("crm.quotes.list.accepted")}
        valor={formatearImporte(resumen.aceptadas.importe, resumen.moneda)}
        detalle={translate("crm.quotes.list.count", {
          smart_count: resumen.aceptadas.cuenta,
        })}
      />
      <Indicador
        etiqueta={translate("crm.quotes.list.acceptance_rate")}
        valor={resumen.aceptacion == null ? "—" : `${resumen.aceptacion} %`}
        detalle={translate("crm.quotes.list.acceptance_rate_help")}
      />
    </div>
  );
};

const Indicador = ({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
}) => (
  <div className="rounded-lg border p-3">
    <p className="text-xs text-muted-foreground">{etiqueta}</p>
    <p className="text-2xl font-semibold tabular-nums">{valor}</p>
    <p className="text-xs text-muted-foreground">{detalle}</p>
  </div>
);

export const ListaDeCotizaciones = () => {
  const translate = useTranslate();

  const filtros = [
    <SearchInput source="q" alwaysOn key="q" />,
    <SelectInput
      key="status"
      source="status"
      label="resources.quotes.fields.status"
      choices={ESTADOS.map((estado) => ({
        id: estado,
        name: translate(`crm.quotes.status.${estado}`),
      }))}
      emptyText="ra.action.clear_input_value"
    />,
    <ReferenceInput key="company_id" source="company_id" reference="companies">
      <AutocompleteInput
        label="resources.quotes.fields.company_id"
        placeholder={translate("resources.quotes.fields.company_id")}
      />
    </ReferenceInput>,
    <DateInput
      key="created_at@gte"
      source="created_at@gte"
      label="resources.quotes.filters.from"
    />,
    <DateInput
      key="created_at@lte"
      source="created_at@lte"
      label="resources.quotes.filters.to"
    />,
  ];

  return (
    <List
      perPage={25}
      filters={filtros}
      actions={<Acciones />}
      sort={{ field: "created_at", order: "DESC" }}
    >
      <Resumen />
      <DataTable
        // Nada de borrar en bloque: una cotización enviada es un documento
        // que el cliente tiene en su correo.
        bulkActionButtons={false}
        // Todo lo que se hace con una cotización está en su oportunidad.
        rowClick={(_id, _resource, record) =>
          record.deal_id ? `/deals/${record.deal_id}/show` : false
        }
      >
        <DataTable.Col source="number" label="resources.quotes.fields.number">
          <NumeroField />
        </DataTable.Col>
        <DataTable.Col source="title" label="resources.quotes.fields.title" />
        <DataTable.Col label="resources.quotes.fields.company_id">
          <ReferenceField
            source="company_id"
            reference="companies"
            link="show"
          />
        </DataTable.Col>
        <DataTable.Col label="resources.quotes.fields.deal_id">
          <ReferenceField source="deal_id" reference="deals" link="show" />
        </DataTable.Col>
        <DataTable.Col source="status" label="resources.quotes.fields.status">
          <CampoDeEstado />
        </DataTable.Col>
        <DataTable.Col
          source="total"
          label="resources.quotes.fields.total"
          className="text-right"
        >
          <CampoDeTotal />
        </DataTable.Col>
        <DataTable.Col source="sent_at" label="resources.quotes.fields.sent_at">
          <CampoDeVigencia />
        </DataTable.Col>
        <DataTable.Col
          source="created_at"
          label="resources.quotes.fields.created_at"
        >
          <CampoDeFecha />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

const NumeroField = () => {
  const record = useRecordContext<Quote>();
  if (!record) return null;
  return <span className="font-medium tabular-nums">{record.number}</span>;
};

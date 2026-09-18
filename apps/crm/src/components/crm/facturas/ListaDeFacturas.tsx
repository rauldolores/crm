import { Download, FileCode2 } from "lucide-react";
import { useNotify, useRecordContext, useTranslate } from "ra-core";
import { useState } from "react";

import { DataTable } from "@/components/admin/data-table";
import { DateInput } from "@/components/admin/date-input";
import { ExportButton } from "@/components/admin/export-button";
import { FilterButton } from "@/components/admin/filter-form";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { TopToolbar } from "../layout/TopToolbar";
import { LOCALE, RelativeDate } from "../misc/RelativeDate";
import type { Invoice, InvoiceStatus } from "../types";
import { abrirDescarga } from "./descargas";

/**
 * Las facturas emitidas por el proveedor conectado, con su UUID y sus
 * descargas. El CRM no las modifica: si hay que cancelar o corregir, se
 * hace en el proveedor.
 */

const ESTADOS: InvoiceStatus[] = ["stamped", "draft", "cancelled", "error"];

const VARIANTE: Record<
  InvoiceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  stamped: "default",
  draft: "secondary",
  cancelled: "outline",
  error: "destructive",
};

export const BotonesDeDescarga = ({
  factura,
  compactos = false,
}: {
  factura: Invoice;
  compactos?: boolean;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [abriendo, setAbriendo] = useState<"pdf" | "xml" | null>(null);
  if (factura.status !== "stamped") return null;

  const abrir = async (formato: "pdf" | "xml") => {
    setAbriendo(formato);
    try {
      await abrirDescarga(factura.id, formato);
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setAbriendo(null);
    }
  };

  return (
    <div className="flex gap-1" onClick={(evento) => evento.stopPropagation()}>
      <Button
        variant="outline"
        size={compactos ? "icon" : "sm"}
        onClick={() => abrir("pdf")}
        disabled={abriendo !== null}
        aria-label={translate("resources.invoices.download_pdf")}
      >
        <Download className="h-4 w-4" />
        {!compactos && "PDF"}
      </Button>
      <Button
        variant="outline"
        size={compactos ? "icon" : "sm"}
        onClick={() => abrir("xml")}
        disabled={abriendo !== null}
        aria-label={translate("resources.invoices.download_xml")}
      >
        <FileCode2 className="h-4 w-4" />
        {!compactos && "XML"}
      </Button>
    </div>
  );
};

const Acciones = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
  </TopToolbar>
);

const CampoDeFolio = () => {
  const record = useRecordContext<Invoice>();
  if (!record) return null;
  return (
    <div className="flex flex-col">
      <span className="font-medium tabular-nums">
        {[record.serie, record.folio].filter(Boolean).join("-") ||
          record.external_id}
      </span>
      {record.uuid && (
        <span className="text-xs text-muted-foreground">{record.uuid}</span>
      )}
    </div>
  );
};

const CampoDeEstado = () => {
  const record = useRecordContext<Invoice>();
  const translate = useTranslate();
  if (!record) return null;
  return (
    <div className="flex flex-col gap-1">
      <Badge variant={VARIANTE[record.status]}>
        {translate(`resources.invoices.status.${record.status}`)}
      </Badge>
      {record.error && record.status !== "stamped" && (
        <span className="max-w-64 truncate text-xs text-muted-foreground">
          {record.error}
        </span>
      )}
    </div>
  );
};

const CampoDeTotal = () => {
  const record = useRecordContext<Invoice>();
  if (!record) return null;
  return (
    <span className="tabular-nums">
      {Number(record.total).toLocaleString(LOCALE, {
        style: "currency",
        currency: record.currency || "MXN",
      })}
    </span>
  );
};

const CampoDeFecha = () => {
  const record = useRecordContext<Invoice>();
  const fecha = record?.issued_at ?? record?.created_at;
  if (!fecha) return null;
  return <RelativeDate date={fecha} />;
};

const CampoDeDescargas = () => {
  const record = useRecordContext<Invoice>();
  if (!record) return null;
  return <BotonesDeDescarga factura={record} compactos />;
};

export const ListaDeFacturas = () => {
  const translate = useTranslate();
  const filtros = [
    <SearchInput source="q" alwaysOn key="q" />,
    <SelectInput
      key="status"
      source="status"
      label="resources.invoices.fields.status"
      choices={ESTADOS.map((estado) => ({
        id: estado,
        name: translate(`resources.invoices.status.${estado}`),
      }))}
      emptyText="ra.action.clear_input_value"
    />,
    <DateInput
      key="created_at@gte"
      source="created_at@gte"
      label="resources.invoices.filters.from"
    />,
    <DateInput
      key="created_at@lte"
      source="created_at@lte"
      label="resources.invoices.filters.to"
    />,
  ];

  return (
    <List
      perPage={25}
      filters={filtros}
      actions={<Acciones />}
      sort={{ field: "created_at", order: "DESC" }}
    >
      {/* Sin ficha propia: lo que se hace con una factura se hace en el
          proveedor; aquí se consulta y se descarga. */}
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="folio" label="resources.invoices.fields.folio">
          <CampoDeFolio />
        </DataTable.Col>
        <DataTable.Col label="resources.invoices.fields.company_id">
          <ReferenceField
            source="company_id"
            reference="companies"
            link="show"
          />
        </DataTable.Col>
        <DataTable.Col label="resources.invoices.fields.quote_id">
          <ReferenceField source="quote_id" reference="quotes" link={false} />
        </DataTable.Col>
        <DataTable.Col source="status" label="resources.invoices.fields.status">
          <CampoDeEstado />
        </DataTable.Col>
        <DataTable.Col source="total" label="resources.invoices.fields.total">
          <CampoDeTotal />
        </DataTable.Col>
        <DataTable.Col
          source="created_at"
          label="resources.invoices.fields.issued_at"
        >
          <CampoDeFecha />
        </DataTable.Col>
        <DataTable.Col label="resources.invoices.fields.downloads">
          <CampoDeDescargas />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

import { Loader2, RefreshCw, Settings } from "lucide-react";
import { useNotify, useRecordContext, useRefresh, useTranslate } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";

import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ConectoresPage } from "../conectores/ConectoresPage";
import { TopToolbar } from "../layout/TopToolbar";
import { llamarApi } from "../misc/llamarApi";
import { LOCALE, RelativeDate } from "../misc/RelativeDate";
import type { Product } from "../types";

/**
 * El catálogo tal como lo trajo el conector (Shopify…). Solo lectura: los
 * precios se cambian en el proveedor y se vuelven a traer con «Sincronizar».
 */

const Acciones = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const [sincronizando, setSincronizando] = useState(false);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const { total } = await llamarApi<{ total: number }>(
        "/api/conectores/productos/sincronizar",
        { method: "POST" },
      );
      notify(translate("crm.connectors.synced", { smart_count: total }), {
        type: "info",
      });
      refresh();
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <TopToolbar>
      <Button variant="outline" size="sm" asChild>
        <Link to={ConectoresPage.path}>
          <Settings className="h-4 w-4" />
          {translate("crm.connectors.title")}
        </Link>
      </Button>
      <Button size="sm" onClick={sincronizar} disabled={sincronizando}>
        {sincronizando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {translate("crm.connectors.sync_now")}
      </Button>
      <ExportButton />
    </TopToolbar>
  );
};

const CampoDePrecio = () => {
  const record = useRecordContext<Product>();
  if (!record) return null;
  return (
    <span className="tabular-nums">
      {Number(record.unit_price).toLocaleString(LOCALE, {
        style: "currency",
        currency: record.currency || "MXN",
      })}
    </span>
  );
};

const CampoDeEstado = () => {
  const record = useRecordContext<Product>();
  const translate = useTranslate();
  if (!record) return null;
  return (
    <Badge variant={record.active ? "default" : "outline"}>
      {translate(
        record.active
          ? "resources.products.active"
          : "resources.products.inactive",
      )}
    </Badge>
  );
};

const CampoDeSincronizacion = () => {
  const record = useRecordContext<Product>();
  if (!record?.synced_at) return null;
  return <RelativeDate date={record.synced_at} />;
};

export const ListaDeProductos = () => {
  const translate = useTranslate();
  const filtros = [
    <SearchInput source="q" alwaysOn key="q" />,
    <SelectInput
      key="active"
      source="active"
      label="resources.products.fields.active"
      choices={[
        { id: "true", name: translate("resources.products.active") },
        { id: "false", name: translate("resources.products.inactive") },
      ]}
      emptyText="ra.action.clear_input_value"
    />,
  ];

  return (
    <List
      perPage={50}
      filters={filtros}
      filterDefaultValues={{ active: "true" }}
      actions={<Acciones />}
      sort={{ field: "name", order: "ASC" }}
    >
      <DataTable bulkActionButtons={false} rowClick={false}>
        <DataTable.Col source="name" label="resources.products.fields.name" />
        <DataTable.Col source="sku" label="resources.products.fields.sku" />
        <DataTable.Col
          source="unit_price"
          label="resources.products.fields.unit_price"
        >
          <CampoDePrecio />
        </DataTable.Col>
        <DataTable.Col source="active" label="resources.products.fields.active">
          <CampoDeEstado />
        </DataTable.Col>
        <DataTable.Col
          source="synced_at"
          label="resources.products.fields.synced_at"
        >
          <CampoDeSincronizacion />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

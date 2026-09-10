import { useRecordContext, useTranslate } from "ra-core";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";

import { TopToolbar } from "../layout/TopToolbar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { CustomerSummary } from "../types";
import { EtapaDeCliente } from "./EtapaDeCliente";

/**
 * Clientes: cada empresa con lo que ha comprado y lo que tiene contratado.
 *
 * Sale de la vista `customer_summary`, que agrega compras y contratos por
 * empresa en la base. Es la respuesta a «¿cuánto vale cada cliente y a
 * quién le vence algo pronto?» sin abrir las fichas una por una.
 */

const Importe = ({ campo }: { campo: "total_spent" | "recurring_amount" }) => {
  const record = useRecordContext<CustomerSummary>();
  const { currency } = useConfigurationContext();
  if (!record) return null;
  const valor = Number(record[campo] ?? 0);
  return (
    <span className={valor === 0 ? "text-muted-foreground" : ""}>
      {valor.toLocaleString(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}
    </span>
  );
};

const Renovacion = () => {
  const record = useRecordContext<CustomerSummary>();
  const translate = useTranslate();
  if (!record?.next_renewal_on) {
    return <span className="text-muted-foreground">—</span>;
  }
  const fecha = new Date(`${record.next_renewal_on}T00:00:00`);
  const dias = Math.ceil((fecha.getTime() - Date.now()) / 86_400_000);
  // Lo que vence pronto se resalta: es lo que hay que atender esta semana.
  const urgente = dias <= 30;
  return (
    <span className={urgente ? "font-medium text-amber-600" : ""}>
      {fecha.toLocaleDateString()}
      {urgente && (
        <span className="ml-1 text-xs">
          ({translate("crm.customers.renews_in_days", { smart_count: dias })})
        </span>
      )}
    </span>
  );
};

const CustomerListActions = () => (
  <TopToolbar>
    <ExportButton />
  </TopToolbar>
);

export const CustomerList = () => {
  const { customerStages } = useConfigurationContext();
  return (
    <List
      actions={<CustomerListActions />}
      filters={[
        <SearchInput source="q" alwaysOn key="q" />,
        <SelectInput
          key="lifecycle_stage"
          source="lifecycle_stage"
          label="crm.customers.fields.lifecycle_stage"
          choices={customerStages}
          optionText="label"
          optionValue="value"
          helperText={false}
        />,
      ]}
      sort={{ field: "total_spent", order: "DESC" }}
      perPage={25}
    >
      <DataTable rowClick={(id) => `/companies/${id}/show/customer`}>
        <DataTable.Col source="name" label="resources.companies.fields.name" />
        <DataTable.Col label="crm.customers.fields.lifecycle_stage">
          <EtapaDeCliente compacto />
        </DataTable.Col>
        <DataTable.Col label="crm.customers.fields.total_spent">
          <Importe campo="total_spent" />
        </DataTable.Col>
        <DataTable.Col
          source="nb_purchases"
          label="crm.customers.fields.nb_purchases"
        />
        <DataTable.Col label="crm.customers.fields.recurring_amount">
          <Importe campo="recurring_amount" />
        </DataTable.Col>
        <DataTable.Col label="crm.customers.fields.next_renewal_on">
          <Renovacion />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

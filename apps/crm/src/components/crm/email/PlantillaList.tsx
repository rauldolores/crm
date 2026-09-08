import { useTranslate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { List } from "@/components/admin/list";
import { SearchInput } from "@/components/admin/search-input";
import { Badge } from "@/components/ui/badge";
import { useRecordContext } from "ra-core";

import { TopToolbar } from "../layout/TopToolbar";
import { RelativeDate } from "../misc/RelativeDate";
import type { EmailTemplate } from "../types";

const PlantillaListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <CreateButton label={translate("crm.email_templates.action.new")} />
    </TopToolbar>
  );
};

const EstadoField = () => {
  const translate = useTranslate();
  const registro = useRecordContext<EmailTemplate>();
  if (!registro) return null;
  return (
    <Badge variant={registro.active ? "default" : "secondary"}>
      {translate(
        registro.active
          ? "crm.email_templates.active"
          : "crm.email_templates.inactive",
      )}
    </Badge>
  );
};

const ActualizadaField = () => {
  const registro = useRecordContext<EmailTemplate>();
  if (!registro?.updated_at) return null;
  return <RelativeDate date={registro.updated_at} />;
};

export const PlantillaList = () => (
  <List
    actions={<PlantillaListActions />}
    filters={[<SearchInput source="q" alwaysOn key="q" />]}
    sort={{ field: "updated_at", order: "DESC" }}
    perPage={25}
  >
    <DataTable rowClick="edit">
      <DataTable.Col source="name" label="crm.email_templates.fields.name" />
      <DataTable.Col
        source="subject"
        label="crm.email_templates.fields.subject"
      />
      <DataTable.Col label="crm.email_templates.fields.active">
        <EstadoField />
      </DataTable.Col>
      <DataTable.Col label="crm.email_templates.fields.updated_at">
        <ActualizadaField />
      </DataTable.Col>
    </DataTable>
  </List>
);

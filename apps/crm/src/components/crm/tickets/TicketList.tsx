import { useRecordContext, useTranslate, useUpdate } from "ra-core";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TopToolbar } from "../layout/TopToolbar";
import { RelativeDate } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Ticket } from "../types";

const TicketListActions = () => {
  const translate = useTranslate();
  return (
    <TopToolbar>
      <ExportButton />
      <CreateButton
        label={translate("resources.tickets.action.new", {
          _: "New Ticket",
        })}
      />
    </TopToolbar>
  );
};

const StatusField = () => {
  const record = useRecordContext<Ticket>();
  const { ticketStatuses } = useConfigurationContext();
  const [update, { isPending }] = useUpdate();
  if (!record) return null;

  const handleValueChange = (value: string) => {
    if (value === record.status) return;
    update("tickets", {
      id: record.id,
      data: { status: value },
      previousData: record,
    });
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Select
        disabled={isPending}
        value={record.status}
        onValueChange={handleValueChange}
      >
        <SelectTrigger size="sm" className="border-none shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ticketStatuses.map((estado) => (
            <SelectItem key={estado.value} value={estado.value}>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: estado.color }}
                />
                {estado.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const TicketList = () => {
  const { ticketStatuses } = useConfigurationContext();
  const filters = [
    <SearchInput source="q" alwaysOn key="q" />,
    <SelectInput
      key="status"
      source="status"
      label="resources.tickets.fields.status"
      choices={ticketStatuses.map((estado) => ({
        id: estado.value,
        name: estado.label,
      }))}
      emptyText="ra.action.clear_input_value"
    />,
  ];

  return (
    <List
      perPage={25}
      filters={filters}
      actions={<TicketListActions />}
      sort={{ field: "created_at", order: "DESC" }}
    >
      <DataTable>
        <DataTable.Col
          source="subject"
          label="resources.tickets.fields.subject"
        />
        <DataTable.Col label="resources.tickets.fields.contact_id">
          <ReferenceField
            source="contact_id"
            reference="contacts"
            link="show"
          />
        </DataTable.Col>
        <DataTable.Col label="resources.tickets.fields.company_id">
          <ReferenceField
            source="company_id"
            reference="companies"
            link="show"
          />
        </DataTable.Col>
        <DataTable.Col label="resources.tickets.fields.status">
          <StatusField />
        </DataTable.Col>
        <DataTable.Col
          source="created_at"
          label="resources.tickets.fields.created_at"
        >
          <DateField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

const DateField = () => {
  const record = useRecordContext<Ticket>();
  if (!record?.created_at) return null;
  return <RelativeDate date={record.created_at} />;
};

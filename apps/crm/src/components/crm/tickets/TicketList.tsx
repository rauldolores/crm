import {
  useGetIdentity,
  useListContext,
  useNotify,
  useRecordContext,
  useTranslate,
  useUpdateMany,
} from "ra-core";
import { useState } from "react";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { BulkDeleteButton } from "@/components/admin/bulk-delete-button";
import { CreateButton } from "@/components/admin/create-button";
import { DataTable } from "@/components/admin/data-table";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";
import { ToggleFilterButton } from "@/components/admin/toggle-filter-button";
import { Button } from "@/components/ui/button";

import { TopToolbar } from "../layout/TopToolbar";
import { RelativeDate } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale, Ticket } from "../types";
import { CerrarTicketDialog } from "./CerrarTicketDialog";
import { parseTicketSubject } from "./parseTicketSubject";
import { CategoriaDeTicket, PrioridadDeTicket } from "./TicketBadges";
import {
  SelectorDeEstadoDeTicket,
  SelectorDeResponsableDeTicket,
} from "./SelectoresDeTicket";

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

const SubjectField = () => {
  const record = useRecordContext<Ticket>();
  if (!record) return null;
  // Los asuntos nuevos ya llegan sin prefijos (la base los convierte en
  // categoría); parseTicketSubject queda por si un origen antiguo los manda.
  const { title } = parseTicketSubject(record.subject);
  return (
    // La celda de tabla lleva whitespace-nowrap: sin este bloque con ancho
    // fijo y truncado, un asunto largo se salía de la columna y pisaba la de
    // Contacto. El texto completo queda en el title al pasar el ratón.
    <div className="flex w-[26rem] max-w-full min-w-0 flex-col gap-1 py-0.5 whitespace-normal">
      <span className="truncate font-medium" title={title}>
        <span className="mr-1.5 text-muted-foreground tabular-nums">
          #{record.id}
        </span>
        {title}
      </span>
      <CategoriaDeTicket value={record.category} className="w-fit" />
    </div>
  );
};

const PriorityField = () => {
  const record = useRecordContext<Ticket>();
  return <PrioridadDeTicket value={record?.priority} />;
};

const LastActivityField = () => {
  const record = useRecordContext<Ticket>();
  const fecha = record?.last_activity_at ?? record?.updated_at;
  if (!fecha) return null;
  return <RelativeDate date={fecha} />;
};

const CreatedField = () => {
  const record = useRecordContext<Ticket>();
  if (!record?.created_at) return null;
  return (
    <span className="text-muted-foreground">
      <RelativeDate date={record.created_at} />
    </span>
  );
};

/** Accesos rápidos a las dos vistas que más se usan al triar una cola. */
const FiltrosRapidos = () => {
  const { identity } = useGetIdentity();
  return (
    <div className="mb-2 flex flex-wrap gap-1">
      {identity?.id != null && (
        <ToggleFilterButton
          className="w-auto"
          label="resources.tickets.filters.mine"
          value={{ sales_id: identity.id }}
        />
      )}
      <ToggleFilterButton
        className="w-auto"
        label="resources.tickets.filters.unassigned"
        value={{ "sales_id@is": null }}
      />
      <ToggleFilterButton
        className="w-auto"
        label="resources.tickets.filters.open"
        value={{ "status@neq": "closed" }}
      />
    </div>
  );
};

/** Cerrar (con motivo) o asignarse varios tickets de golpe. */
const AccionesMasivas = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const { selectedIds, onUnselectItems } = useListContext();
  const [updateMany, { isPending }] = useUpdateMany();
  const [cerrando, setCerrando] = useState(false);

  const aplicar = (data: Partial<Ticket>, mensaje: string) =>
    updateMany(
      "tickets",
      { ids: selectedIds, data },
      {
        onSuccess: () => {
          notify(mensaje, {
            type: "success",
            messageArgs: { smart_count: selectedIds.length },
          });
          onUnselectItems();
        },
        onError: () =>
          notify("resources.tickets.notifications.update_error", {
            type: "error",
          }),
      },
    );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => setCerrando(true)}
      >
        {translate("resources.tickets.action.close_many")}
      </Button>
      {identity?.id != null && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            aplicar(
              { sales_id: identity.id },
              "resources.tickets.notifications.assigned_many",
            )
          }
        >
          {translate("resources.tickets.action.assign_me")}
        </Button>
      )}
      <BulkDeleteButton />
      <CerrarTicketDialog
        open={cerrando}
        onOpenChange={setCerrando}
        guardando={isPending}
        onConfirm={(resolution) => {
          setCerrando(false);
          aplicar(
            { status: "closed", resolution },
            "resources.tickets.notifications.closed_many",
          );
        }}
      />
    </>
  );
};

export const TicketList = () => {
  const { ticketStatuses, ticketPriorities, ticketCategories } =
    useConfigurationContext();
  const aOpciones = (lista: { value: string; label: string }[]) =>
    lista.map((item) => ({ id: item.value, name: item.label }));

  const filters = [
    <SearchInput source="q" alwaysOn key="q" />,
    <SelectInput
      key="status"
      source="status"
      label="resources.tickets.fields.status"
      choices={aOpciones(ticketStatuses)}
      emptyText="ra.action.clear_input_value"
    />,
    <SelectInput
      key="priority"
      source="priority"
      label="resources.tickets.fields.priority"
      choices={aOpciones(ticketPriorities)}
      emptyText="ra.action.clear_input_value"
    />,
    <SelectInput
      key="category"
      source="category"
      label="resources.tickets.fields.category"
      choices={aOpciones(ticketCategories)}
      emptyText="ra.action.clear_input_value"
    />,
    <ReferenceInput key="sales_id" source="sales_id" reference="sales">
      <AutocompleteInput
        label="resources.tickets.fields.sales_id"
        optionText={(sale: Sale) => `${sale.first_name} ${sale.last_name}`}
        helperText={false}
      />
    </ReferenceInput>,
  ];

  return (
    <List
      perPage={25}
      filters={filters}
      actions={<TicketListActions />}
      sort={{ field: "last_activity_at", order: "DESC" }}
    >
      <FiltrosRapidos />
      <DataTable
        bulkActionsToolbar={
          <BulkActionsToolbar>
            <AccionesMasivas />
          </BulkActionsToolbar>
        }
      >
        <DataTable.Col
          source="subject"
          label="resources.tickets.fields.subject"
        >
          <SubjectField />
        </DataTable.Col>
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
        <DataTable.Col
          source="priority"
          label="resources.tickets.fields.priority"
        >
          <PriorityField />
        </DataTable.Col>
        <DataTable.Col label="resources.tickets.fields.sales_id">
          <SelectorDeResponsableDeTicket conAsignarme={false} />
        </DataTable.Col>
        <DataTable.Col label="resources.tickets.fields.status">
          <SelectorDeEstadoDeTicket />
        </DataTable.Col>
        <DataTable.Col
          source="last_activity_at"
          label="resources.tickets.fields.last_activity_at"
        >
          <LastActivityField />
        </DataTable.Col>
        <DataTable.Col
          source="created_at"
          label="resources.tickets.fields.created_at"
        >
          <CreatedField />
        </DataTable.Col>
      </DataTable>
    </List>
  );
};

import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  InfiniteListBase,
  ShowBase,
  useListContext,
  useShowContext,
  useTranslate,
} from "ra-core";

import { AsideSection } from "../misc/AsideSection";
import { Markdown } from "../misc/Markdown";
import { NoteCreate } from "../notes/NoteCreate";
import { NotesIterator } from "../notes/NotesIterator";
import { formatLocalizedDate, formatRelativeDate } from "../misc/RelativeDate";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Ticket } from "../types";
import { parseTicketSubject } from "./parseTicketSubject";
import { FusionarTicketButton } from "./FusionarTicketDialog";
import { HistorialDeTicket } from "./HistorialDeTicket";
import { ResponderPorCorreoButton } from "./ResponderPorCorreoButton";
import { SlaDeTicket } from "./SlaDeTicket";
import {
  SelectorDeEstadoDeTicket,
  SelectorDeResponsableDeTicket,
} from "./SelectoresDeTicket";
import {
  CategoriaDeTicket,
  OrigenDeTicket,
  PrioridadDeTicket,
  ResolucionDeTicket,
} from "./TicketBadges";
import { TicketsIterator } from "./TicketsIterator";

export const TicketShow = () => (
  <ShowBase>
    <TicketShowContent />
  </ShowBase>
);

const TicketShowContent = () => {
  const translate = useTranslate();
  const { modules } = useConfigurationContext();
  const { record, isPending } = useShowContext<Ticket>();

  if (isPending || !record) return null;

  const { title } = parseTicketSubject(record.subject);

  return (
    <div className="mt-2 flex pb-2 gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground tabular-nums">
                  #{record.id}
                  {record.source && record.source !== "manual" && " · "}
                  <OrigenDeTicket value={record.source} />
                </p>
                <h5 className="font-display text-2xl font-semibold tracking-tight">
                  {title}
                </h5>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <PrioridadDeTicket value={record.priority} />
                  <CategoriaDeTicket value={record.category} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {translate("resources.tickets.dates.created", {
                    date: record.created_at
                      ? formatLocalizedDate(record.created_at)
                      : "",
                  })}
                  {record.last_activity_at && (
                    <>
                      {" · "}
                      {translate("crm.common.last_activity_with_date", {
                        date: formatRelativeDate(record.last_activity_at),
                      })}
                    </>
                  )}
                  {record.closed_at && (
                    <>
                      {" · "}
                      {translate("resources.tickets.dates.closed", {
                        date: formatLocalizedDate(record.closed_at),
                      })}
                    </>
                  )}
                </p>
                {record.status === "closed" && record.resolution && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">
                      {translate("resources.tickets.fields.resolution")}:{" "}
                    </span>
                    <ResolucionDeTicket value={record.resolution} />
                  </p>
                )}
                <SlaDeTicket ticket={record} className="mt-2 gap-0.5" />
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <ResponderPorCorreoButton ticket={record} />
                <FusionarTicketButton ticket={record} />
                <EditButton />
              </div>
            </div>

            {record.description && (
              <div className="mb-4">
                <Markdown>{record.description}</Markdown>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">
                  {translate("resources.tickets.fields.contact_id")}
                </p>
                <ReferenceField
                  source="contact_id"
                  reference="contacts"
                  link="show"
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">
                  {translate("resources.tickets.fields.company_id")}
                </p>
                <ReferenceField
                  source="company_id"
                  reference="companies"
                  link="show"
                />
              </div>
              {record.deal_id != null && (
                <div>
                  <p className="text-muted-foreground mb-1">
                    {translate("resources.tickets.fields.deal_id")}
                  </p>
                  <ReferenceField
                    source="deal_id"
                    reference="deals"
                    link="show"
                  />
                </div>
              )}
              {record.contract_id != null && modules.customers?.active && (
                <div>
                  <p className="text-muted-foreground mb-1">
                    {translate("resources.tickets.fields.contract_id")}
                  </p>
                  {/* Los contratos no tienen ficha propia: se ven en la del
                      cliente (módulo Clientes). */}
                  <ReferenceField
                    source="contract_id"
                    reference="contracts"
                    link={false}
                  />
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1">
                  {translate("resources.tickets.fields.status")}
                </p>
                <SelectorDeEstadoDeTicket className="-ml-3" />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">
                  {translate("resources.tickets.fields.sales_id")}
                </p>
                <SelectorDeResponsableDeTicket className="-ml-3" />
              </div>
            </div>

            <Separator className="my-4" />
            <InfiniteListBase
              resource="ticket_notes"
              filter={{ ticket_id: record.id }}
              sort={{ field: "date", order: "DESC" }}
              perPage={25}
              disableSyncWithLocation
              storeKey={false}
              empty={<NoteCreate reference="tickets" />}
            >
              <NotesIterator reference="tickets" />
            </InfiniteListBase>
          </CardContent>
        </Card>
      </div>

      <div className="hidden sm:block w-92 min-w-92">
        <AsideSection title={translate("resources.tickets.history.title")}>
          <HistorialDeTicket ticketId={record.id} />
        </AsideSection>
        <AsideSection title={translate("resources.tickets.other_from_contact")}>
          <InfiniteListBase
            resource="tickets"
            filter={{ contact_id: record.contact_id, "id@neq": record.id }}
            sort={{ field: "created_at", order: "DESC" }}
            perPage={10}
            disableSyncWithLocation
            storeKey={false}
            empty={
              <p className="text-sm text-muted-foreground">
                {translate("resources.tickets.no_other_from_contact")}
              </p>
            }
          >
            <OtherTicketsCount />
            <TicketsIterator />
          </InfiniteListBase>
        </AsideSection>
      </div>
    </div>
  );
};

/** Cuántos tickets más tiene el mismo contacto, antes de listarlos. */
const OtherTicketsCount = () => {
  const { total, isPending } = useListContext();
  const translate = useTranslate();
  if (isPending || !total) return null;
  return (
    <p className="mb-2 text-xs text-muted-foreground">
      {translate("resources.tickets.other_count", { smart_count: total })}
    </p>
  );
};

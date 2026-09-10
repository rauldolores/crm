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
import { formatRelativeDate } from "../misc/RelativeDate";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Ticket } from "../types";
import { parseTicketSubject } from "./parseTicketSubject";
import { TicketSubjectTags } from "./TicketSubjectTags";
import { TicketsIterator } from "./TicketsIterator";

export const TicketShow = () => (
  <ShowBase>
    <TicketShowContent />
  </ShowBase>
);

const TicketShowContent = () => {
  const translate = useTranslate();
  const { record, isPending } = useShowContext<Ticket>();
  const { ticketStatuses } = useConfigurationContext();

  if (isPending || !record) return null;

  const { title, tags } = parseTicketSubject(record.subject);

  return (
    <div className="mt-2 flex pb-2 gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Status status={record.status} statuses={ticketStatuses} />
                  <h5 className="text-xl">{title}</h5>
                </div>
                <TicketSubjectTags tags={tags} className="mb-1" />
                {record.created_at && (
                  <p className="text-sm text-muted-foreground">
                    {translate("crm.common.last_activity_with_date", {
                      date: formatRelativeDate(record.created_at),
                    })}
                  </p>
                )}
              </div>
              <EditButton />
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
              {record.sales_id != null && (
                <div>
                  <p className="text-muted-foreground mb-1">
                    {translate("resources.tickets.fields.sales_id")}
                  </p>
                  <ReferenceField
                    source="sales_id"
                    reference="sales"
                    link={false}
                  />
                </div>
              )}
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

import { EditButton } from "@/components/admin/edit-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { Card, CardContent } from "@/components/ui/card";
import { ShowBase, useShowContext, useTranslate } from "ra-core";

import { Markdown } from "../misc/Markdown";
import { formatRelativeDate } from "../misc/RelativeDate";
import { Status } from "../misc/Status";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Ticket } from "../types";

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

  return (
    <div className="mt-2 flex pb-2 gap-8">
      <div className="flex-1">
        <Card>
          <CardContent>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Status status={record.status} statuses={ticketStatuses} />
                  <h5 className="text-xl">{record.subject}</h5>
                </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

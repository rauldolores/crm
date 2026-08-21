import { CreateBase, Form, useGetIdentity, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";

import { TicketInputs } from "./TicketInputs";

export const TicketCreate = () => {
  const { identity } = useGetIdentity();
  const translate = useTranslate();
  return (
    <CreateBase redirect="show">
      <div className="mt-2 flex lg:mr-72">
        <div className="flex-1">
          <Form defaultValues={{ status: "open", sales_id: identity?.id }}>
            <Card>
              <CardContent>
                <TicketInputs />
                <div
                  role="toolbar"
                  className="sticky flex pt-4 pb-4 md:pb-0 bottom-0 bg-linear-to-b from-transparent to-card to-10% flex-row justify-end gap-2"
                >
                  <CancelButton />
                  <SaveButton
                    label={translate("resources.tickets.action.create", {
                      _: "Create Ticket",
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </CreateBase>
  );
};

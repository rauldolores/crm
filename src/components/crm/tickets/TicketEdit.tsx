import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { FormToolbar } from "../layout/FormToolbar";
import { TicketInputs } from "./TicketInputs";

export const TicketEdit = () => (
  <EditBase actions={false} redirect="show">
    <div className="mt-2 flex lg:mr-72">
      <Form className="flex flex-1 flex-col gap-4 pb-2">
        <Card>
          <CardContent>
            <TicketInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);

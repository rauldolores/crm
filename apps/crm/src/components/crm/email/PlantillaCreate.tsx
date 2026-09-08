import { CreateBase, Form, useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { SaveButton } from "@/components/admin/form";

import { PlantillaInputs } from "./PlantillaInputs";

export const PlantillaCreate = () => {
  const translate = useTranslate();
  return (
    <CreateBase redirect="list">
      <div className="mt-2 flex">
        <div className="flex-1">
          <Form defaultValues={{ active: true, body_html: "" }}>
            <Card>
              <CardContent>
                <PlantillaInputs />
                <div
                  role="toolbar"
                  className="sticky bottom-0 flex flex-row justify-end gap-2 bg-linear-to-b from-transparent to-card to-10% pt-4 pb-4 md:pb-0"
                >
                  <CancelButton />
                  <SaveButton
                    label={translate("crm.email_templates.action.create")}
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

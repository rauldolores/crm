import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton } from "@/components/admin/cancel-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { SaveButton } from "@/components/admin/form";

import { PlantillaInputs } from "./PlantillaInputs";

export const PlantillaEdit = () => (
  <EditBase redirect="list">
    <div className="mt-2 flex">
      <div className="flex-1">
        <Form>
          <Card>
            <CardContent>
              <PlantillaInputs />
              <div
                role="toolbar"
                className="sticky bottom-0 flex flex-row justify-between gap-2 bg-linear-to-b from-transparent to-card to-10% pt-4 pb-4 md:pb-0"
              >
                <DeleteButton />
                <div className="flex flex-row gap-2">
                  <CancelButton />
                  <SaveButton />
                </div>
              </div>
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  </EditBase>
);

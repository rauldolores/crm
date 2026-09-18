import { useQueryClient } from "@tanstack/react-query";
import { Form, useGetIdentity, useListContext, useRedirect } from "ra-core";
import { Create } from "@/components/admin/create";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { DealInputs } from "./DealInputs";

export const DealCreate = ({ open }: { open: boolean }) => {
  const redirect = useRedirect();
  const { filterValues } = useListContext<Deal>();
  const { dealPipelines } = useConfigurationContext();

  // La oportunidad nueva nace en el embudo que se esta viendo.
  const embudoInicial =
    dealPipelines.find((embudo) => embudo.value === filterValues?.pipeline)
      ?.value ?? dealPipelines[0]?.value;

  const handleClose = () => {
    redirect("/deals");
  };

  const queryClient = useQueryClient();

  // La nueva entra arriba de su etapa y las demás bajan una posición; eso lo
  // hace el proveedor (el disparador crm.place_new_deal con Supabase, un
  // callback en la demostración). Aquí solo hay que volver a pedir el
  // tablero para verlo.
  const onSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["deals", "getList"] });
    redirect("/deals");
  };

  const { identity } = useGetIdentity();

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-4xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        <Create resource="deals" mutationOptions={{ onSuccess }}>
          <Form
            defaultValues={{
              sales_id: identity?.id,
              contact_ids: [],
              index: 0,
              pipeline: embudoInicial,
            }}
          >
            <DealInputs />
            <FormToolbar>
              <SaveButton />
            </FormToolbar>
          </Form>
        </Create>
      </DialogContent>
    </Dialog>
  );
};

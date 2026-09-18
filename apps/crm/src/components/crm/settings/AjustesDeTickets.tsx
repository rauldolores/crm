import { useTranslate } from "ra-core";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ColorInput } from "./ColorInput";

/**
 * Bloque «Tickets» de Ajustes: prioridades (con color y en orden de
 * urgencia) y categorías. Los estados del ticket siguen fijos de fábrica
 * (abierto / en proceso / cerrado) porque el cierre tiene semántica propia
 * (sella closed_at y pide motivo); si algún día se hacen configurables, la
 * condición «status <> 'closed'» de las vistas tendrá que leerlos de aquí.
 */
export const AjustesDeTickets = () => {
  const translate = useTranslate();
  return (
    <Card id="tickets">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("resources.tickets.name", { smart_count: 2 })}
        </h2>

        <h3 className="text-lg font-medium text-muted-foreground">
          {translate("crm.settings.tickets.priorities")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translate("crm.settings.tickets.priorities_help")}
        </p>
        <ArrayInput source="ticketPriorities" label={false} helperText={false}>
          <SimpleFormIterator inline disableReordering disableClear>
            <TextInput source="label" label={false} className="flex-1" />
            <ColorInput source="color" />
          </SimpleFormIterator>
        </ArrayInput>

        <Separator />

        <h3 className="text-lg font-medium text-muted-foreground">
          {translate("crm.settings.tickets.categories")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translate("crm.settings.tickets.categories_help")}
        </p>
        <ArrayInput source="ticketCategories" label={false} helperText={false}>
          <SimpleFormIterator disableReordering disableClear>
            <TextInput source="label" label={false} />
          </SimpleFormIterator>
        </ArrayInput>
      </CardContent>
    </Card>
  );
};

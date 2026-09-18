import { useTranslate } from "ra-core";
import { useWatch } from "react-hook-form";
import { ArrayInput } from "@/components/admin/array-input";
import { NumberInput } from "@/components/admin/number-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toSlug } from "@/lib/toSlug";

import { ColorInput } from "./ColorInput";

/**
 * Una fila por prioridad del formulario (no de la configuración guardada,
 * para que una prioridad recién añadida ya pueda tener plazo). Horas
 * vacías = sin plazo para esa prioridad.
 */
const TablaDeSla = () => {
  const translate = useTranslate();
  const prioridades: { value?: string; label: string }[] =
    useWatch({ name: "ticketPriorities" }) ?? [];
  if (prioridades.length === 0) return null;
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1">
      <span />
      <span className="text-xs text-muted-foreground">
        {translate("crm.settings.tickets.sla_first_response")}
      </span>
      <span className="text-xs text-muted-foreground">
        {translate("crm.settings.tickets.sla_resolution")}
      </span>
      {prioridades.map((p) => {
        const clave = p.value || toSlug(p.label);
        if (!clave) return null;
        return (
          <div key={clave} className="contents">
            <span className="text-sm">{p.label}</span>
            <NumberInput
              source={`ticketSla.${clave}.firstResponseHours`}
              label={false}
              helperText={false}
              min={1}
              className="w-24"
              placeholder="—"
            />
            <NumberInput
              source={`ticketSla.${clave}.resolutionHours`}
              label={false}
              helperText={false}
              min={1}
              className="w-24"
              placeholder="—"
            />
          </div>
        );
      })}
    </div>
  );
};

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

        <Separator />

        <h3 className="text-lg font-medium text-muted-foreground">
          {translate("crm.settings.tickets.sla")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translate("crm.settings.tickets.sla_help")}
        </p>
        <TablaDeSla />
      </CardContent>
    </Card>
  );
};

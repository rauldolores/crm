import { useRecordContext, useRefresh, useTranslate, useUpdate } from "ra-core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Company } from "../types";

/**
 * Etapa del ciclo de vida de un cliente, editable en el sitio: prospecto,
 * cliente activo, en riesgo, perdido. Mismo patrón que el estado de un
 * ticket en su lista — un selector sobre el registro, sin abrir el
 * formulario de la empresa para cambiar una sola cosa.
 */
export const EtapaDeCliente = ({ compacto }: { compacto?: boolean }) => {
  const translate = useTranslate();
  const record = useRecordContext<Company>();
  const { customerStages } = useConfigurationContext();
  const [update, { isPending }] = useUpdate();
  const refresh = useRefresh();

  if (!record) return null;

  const actual = customerStages.find(
    (etapa) => etapa.value === record.lifecycle_stage,
  );

  const cambiar = (value: string) => {
    if (value === record.lifecycle_stage) return;
    // Se refresca al terminar: este selector se usa también sobre la vista
    // customer_summary, que no se entera sola de un cambio en companies.
    update(
      "companies",
      { id: record.id, data: { lifecycle_stage: value }, previousData: record },
      { onSuccess: () => refresh() },
    );
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Select
        disabled={isPending}
        value={record.lifecycle_stage ?? ""}
        onValueChange={cambiar}
      >
        <SelectTrigger
          className={compacto ? "h-7 w-40 text-xs" : "w-52"}
          aria-label={translate("crm.customers.fields.lifecycle_stage")}
        >
          <SelectValue placeholder={translate("crm.customers.stage_none")}>
            {actual && (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: actual.color }}
                />
                {actual.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {customerStages.map((etapa) => (
            <SelectItem key={etapa.value} value={etapa.value}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: etapa.color }}
                />
                {etapa.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

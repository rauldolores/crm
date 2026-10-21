import { useTranslate } from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { NumberInput } from "@/components/admin/number-input";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Ajustes de «clientes en riesgo» (config.risk). La revisión la hace la base
 * cada día (crm.revisar_clientes_en_riesgo); aquí solo se dice si se hace y
 * cuántos días sin que nadie entre cuentan. Días vacíos o fuera de 1 a 365
 * valen 14.
 */
export const AjustesDeRiesgo = () => {
  const translate = useTranslate();
  return (
    <Card id="risk">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.settings.risk.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {translate("crm.settings.risk.help")}
        </p>
        <BooleanInput
          source="risk.active"
          label="crm.settings.risk.active"
          helperText={false}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberInput
            source="risk.inactivityDays"
            label="crm.settings.risk.days"
            helperText={false}
            min={1}
            max={365}
          />
        </div>
      </CardContent>
    </Card>
  );
};

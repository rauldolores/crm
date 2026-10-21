import { useTranslate } from "ra-core";
import { BooleanInput } from "@/components/admin/boolean-input";
import { NumberInput } from "@/components/admin/number-input";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Ajustes de las oportunidades de renovación automáticas (config.renewals).
 * Las abre y las cierra la base cada hora
 * (crm.generar_oportunidades_de_renovacion); aquí solo se dice si se abren,
 * con cuántos días de anticipación y si entran los contratos con tarjeta.
 * Días vacíos o fuera de 0 a 366 valen los de fábrica.
 */
export const AjustesDeRenovaciones = () => {
  const translate = useTranslate();
  return (
    <Card id="renewals">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.settings.renewals.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {translate("crm.settings.renewals.help")}
        </p>
        <BooleanInput
          source="renewals.active"
          label="crm.settings.renewals.active"
          helperText={false}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberInput
            source="renewals.daysBeforeYearly"
            label="crm.settings.renewals.days_yearly"
            helperText={false}
            min={0}
            max={366}
          />
          <NumberInput
            source="renewals.daysBeforeQuarterly"
            label="crm.settings.renewals.days_quarterly"
            helperText={false}
            min={0}
            max={366}
          />
          <NumberInput
            source="renewals.daysBeforeMonthly"
            label="crm.settings.renewals.days_monthly"
            helperText={false}
            min={0}
            max={366}
          />
        </div>
        <BooleanInput
          source="renewals.includeCardContracts"
          label="crm.settings.renewals.include_card"
          helperText="crm.settings.renewals.include_card_help"
        />
      </CardContent>
    </Card>
  );
};

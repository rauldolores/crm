import { useDataProvider, useNotify, useTranslate } from "ra-core";
import { Form, required } from "ra-core";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectInput } from "@/components/admin/select-input";
import { NumberInput } from "@/components/admin/number-input";
import { TextInput } from "@/components/admin/text-input";
import { SaveButton } from "@/components/admin/form";

import {
  useConfigurationContext,
  useConfigurationUpdater,
} from "../root/ConfigurationContext";
import type { CrmDataProvider } from "../providers/types";
import type { DealPipeline } from "../types";

/**
 * Configuración del módulo Afiliados: qué embudo y qué etapas cuentan como
 * "afiliación completa" (ver crm.gestionar_modulo_afiliados en el esquema),
 * la comisión por defecto y la plantilla de la URL de referidos.
 *
 * Se guarda en config.modules.affiliates junto con `active` (que pone
 * CatalogoPage) — por eso el envío arma el objeto completo del módulo
 * en vez de reemplazarlo, para no pisar `active`.
 */
export const AffiliatesConfigPage = () => {
  const translate = useTranslate();
  const config = useConfigurationContext();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const updateConfiguration = useConfigurationUpdater();
  const notify = useNotify();

  const actual = config.modules.affiliates ?? { active: false };

  const defaultValues = {
    pipelineId: (actual.pipelineId as string) ?? config.dealPipelines[0]?.value,
    completionStages: (actual.completionStages as string[]) ?? [],
    defaultCommission: (actual.defaultCommission as number) ?? undefined,
    urlTemplate: (actual.urlTemplate as string) ?? "",
  };

  const guardar = async (data: Record<string, unknown>) => {
    const nuevaConfiguracion = {
      ...config,
      modules: {
        ...config.modules,
        affiliates: { ...actual, ...data },
      },
    };
    try {
      const guardada =
        await dataProvider.updateConfiguration(nuevaConfiguracion);
      updateConfiguration(guardada);
      notify("crm.affiliates.config.saved");
    } catch {
      notify("crm.affiliates.config.save_error", { type: "error" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.affiliates.config.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.affiliates.config.intro")}
        </p>
      </div>

      <Form defaultValues={defaultValues} onSubmit={guardar}>
        <Card>
          <CardHeader>
            <CardTitle>
              {translate("crm.affiliates.config.pipeline_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectInput
              source="pipelineId"
              label="crm.affiliates.config.pipeline"
              choices={config.dealPipelines}
              optionText="label"
              optionValue="value"
              helperText={false}
              validate={required()}
            />
            <p className="text-sm text-muted-foreground">
              {translate("crm.affiliates.config.completion_stages_help")}
            </p>
            <EtapasDeAfiliacion />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {translate("crm.affiliates.config.commercial_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberInput
              source="defaultCommission"
              label="crm.affiliates.config.default_commission"
              helperText="crm.affiliates.config.default_commission_help"
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {translate("crm.affiliates.config.url_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextInput
              source="urlTemplate"
              label="crm.affiliates.config.url_template"
              placeholder="https://tudominio.com?ref={id}"
              helperText="crm.affiliates.config.url_template_help"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <SaveButton label="ra.action.save" />
        </div>
      </Form>
    </div>
  );
};

AffiliatesConfigPage.path = "/affiliates/configuracion";

/** Botones de dos estados sobre las etapas del embudo elegido. */
const EtapasDeAfiliacion = () => {
  const config = useConfigurationContext();
  const { setValue, control } = useFormContext();
  const pipelineId = useWatch({ control, name: "pipelineId" });
  const seleccionadas: string[] =
    useWatch({
      control,
      name: "completionStages",
    }) ?? [];

  const embudo: DealPipeline | undefined = config.dealPipelines.find(
    (item) => item.value === pipelineId,
  );

  if (!embudo) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {(embudo.stages ?? []).map((etapa) => {
        const activa = seleccionadas.includes(etapa.value);
        return (
          <Button
            key={etapa.value}
            type="button"
            variant={activa ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setValue(
                "completionStages",
                activa
                  ? seleccionadas.filter((valor) => valor !== etapa.value)
                  : [...seleccionadas, etapa.value],
              )
            }
          >
            {etapa.label || etapa.value}
          </Button>
        );
      })}
    </div>
  );
};

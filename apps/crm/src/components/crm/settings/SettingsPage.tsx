/* eslint-disable react-refresh/only-export-components */
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import type { RaRecord } from "ra-core";
import {
  EditBase,
  Form,
  useGetList,
  useInput,
  useNotify,
  useTranslate,
} from "ra-core";
import { useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toSlug } from "@/lib/toSlug";
import { ArrayInput } from "@/components/admin/array-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { TextInput } from "@/components/admin/text-input";

import {
  useConfigurationContext,
  useConfigurationUpdater,
  type ConfigurationContextValue,
} from "../root/ConfigurationContext";
import { defaultConfiguration } from "../root/defaultConfiguration";
import type {
  CustomFieldDefinition,
  CustomFieldType,
  DealPipeline,
} from "../types";

const SECTIONS = [
  {
    id: "companies",
    label: "resources.companies.name",
    fallback: "Companies",
  },
  { id: "deals", label: "resources.deals.name", fallback: "Deals" },
  { id: "notes", label: "resources.notes.name", fallback: "Notes" },
  { id: "tasks", label: "resources.tasks.name", fallback: "Tasks" },
  {
    id: "custom-fields",
    label: "crm.settings.sections.custom_fields",
    fallback: "Custom fields",
  },
];

/**
 * Fila editable de un campo personalizado: las opciones de las listas se
 * editan como texto separado por comas, más cómodo que un sub-iterador.
 */
interface FilaDeCampoPersonalizado {
  value?: string;
  label: string;
  type?: CustomFieldType;
  optionsText?: string;
}

const aFilasEditables = (campos: CustomFieldDefinition[] | undefined) =>
  (campos ?? []).map((campo) => ({
    value: campo.value,
    label: campo.label,
    type: campo.type,
    optionsText: (campo.options ?? []).join(", "),
  }));

const aDefiniciones = (
  filas: FilaDeCampoPersonalizado[] | undefined,
): CustomFieldDefinition[] =>
  (filas ?? [])
    .filter((fila) => fila?.label)
    .map((fila) => ({
      // El value se conserva una vez generado: cambiarlo dejaría huérfanos
      // los valores ya guardados en las fichas.
      value: fila.value || toSlug(fila.label),
      label: fila.label,
      type: fila.type ?? "text",
      options:
        (fila.type ?? "text") === "list"
          ? String(fila.optionsText ?? "")
              .split(",")
              .map((opcion) => opcion.trim())
              .filter(Boolean)
          : undefined,
    }));

/** Ensure every item in a { value, label } array has a value (slug from label). */
const ensureValues = (items: { value?: string; label: string }[] | undefined) =>
  items?.map((item) => ({ ...item, value: item.value || toSlug(item.label) }));

type ValidateItemsInUseMessages = {
  duplicate?: (displayName: string, duplicates: string[]) => string;
  inUse?: (displayName: string, inUse: string[]) => string;
  validating?: string;
};

/**
 * Validate that no items were removed if they are still referenced by existing deals.
 * Also rejects duplicate slug values.
 * Returns undefined if valid, or an error message string.
 */
export const validateItemsInUse = (
  items: { value: string; label: string }[] | undefined,
  deals: RaRecord[] | undefined,
  fieldName: string,
  displayName: string,
  messages?: ValidateItemsInUseMessages,
) => {
  if (!items) return undefined;
  // Check for duplicate slugs
  const slugs = items.map((i) => i.value || toSlug(i.label));
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) duplicates.add(slug);
    seen.add(slug);
  }
  if (duplicates.size > 0) {
    const duplicatesList = [...duplicates];
    return (
      messages?.duplicate?.(displayName, duplicatesList) ??
      `Duplicate ${displayName}: ${duplicatesList.join(", ")}`
    );
  }
  // Check that no in-use value was removed (skip if deals haven't loaded)
  if (!deals) return messages?.validating ?? "Validating…";
  const values = new Set(slugs);
  const inUse = [
    ...new Set(
      deals
        .filter(
          (deal) => deal[fieldName] && !values.has(deal[fieldName] as string),
        )
        .map((deal) => deal[fieldName] as string),
    ),
  ];
  if (inUse.length > 0) {
    return (
      messages?.inUse?.(displayName, inUse) ??
      `Cannot remove ${displayName} that are still used by deals: ${inUse.join(", ")}`
    );
  }
  return undefined;
};

const getCurrencyChoices = () => {
  const displayNames = new Intl.DisplayNames(
    typeof navigator !== "undefined"
      ? (navigator.languages as string[])
      : ["en"],
    { type: "currency" },
  );
  return Intl.supportedValuesOf("currency").map((code) => ({
    id: code,
    name: `${code} – ${displayNames.of(code)}`,
  }));
};

/**
 * Deja los embudos listos para guardar: genera los value que falten y limpia
 * de pipelineStatuses las etapas que ya no existen en su embudo.
 */
const aEmbudosGuardables = (embudos: DealPipeline[] | undefined) =>
  (embudos ?? [])
    .filter((embudo) => embudo?.label)
    .map((embudo) => {
      const stages = (ensureValues(embudo.stages) ??
        []) as DealPipeline["stages"];
      const valores = new Set(stages.map((etapa) => etapa.value));
      return {
        value: embudo.value || toSlug(embudo.label),
        label: embudo.label,
        stages,
        pipelineStatuses: (embudo.pipelineStatuses ?? []).filter((valor) =>
          valores.has(valor),
        ),
        lostStages: (embudo.lostStages ?? []).filter((valor) =>
          valores.has(valor),
        ),
      };
    });

const transformFormValues = (data: Record<string, any>) => {
  const embudos = aEmbudosGuardables(data.dealPipelines);
  return {
    config: {
      currency: data.currency,
      companySectors: ensureValues(data.companySectors),
      dealCategories: ensureValues(data.dealCategories),
      taskTypes: ensureValues(data.taskTypes),
      dealPipelines: embudos,
      dealLossReasons: ensureValues(data.dealLossReasons),
      // Derivados del primer embudo, por compatibilidad con configuraciones
      // y lectores anteriores a los embudos múltiples.
      dealStages: embudos[0]?.stages ?? [],
      dealPipelineStatuses: embudos[0]?.pipelineStatuses ?? [],
      noteStatuses: ensureValues(data.noteStatuses),
      noteTypes: ensureValues(data.noteTypes),
      contactCustomFields: aDefiniciones(data.contactCustomFields),
      companyCustomFields: aDefiniciones(data.companyCustomFields),
      dealCustomFields: aDefiniciones(data.dealCustomFields),
    } as ConfigurationContextValue,
  };
};

export const SettingsPage = () => {
  const updateConfiguration = useConfigurationUpdater();
  const notify = useNotify();

  return (
    <EditBase
      resource="configuration"
      id={1}
      mutationMode="pessimistic"
      redirect={false}
      transform={transformFormValues}
      mutationOptions={{
        onSuccess: (data: any) => {
          updateConfiguration(data.config);
          notify("crm.settings.saved");
        },
        onError: () => {
          notify("crm.settings.save_error", {
            type: "error",
          });
        },
      }}
    >
      <SettingsForm />
    </EditBase>
  );
};

SettingsPage.path = "/settings";

const SettingsForm = () => {
  const config = useConfigurationContext();

  const defaultValues = useMemo(
    () => ({
      currency: config.currency,
      companySectors: config.companySectors,
      dealCategories: config.dealCategories,
      taskTypes: config.taskTypes,
      dealPipelines: config.dealPipelines,
      dealLossReasons: config.dealLossReasons,
      noteStatuses: config.noteStatuses,
      noteTypes: config.noteTypes,
      contactCustomFields: aFilasEditables(config.contactCustomFields),
      companyCustomFields: aFilasEditables(config.companyCustomFields),
      dealCustomFields: aFilasEditables(config.dealCustomFields),
    }),
    [config],
  );

  return (
    <Form defaultValues={defaultValues}>
      <SettingsFormFields />
    </Form>
  );
};

const SettingsFormFields = () => {
  const translate = useTranslate();
  const currencyChoices = useMemo(() => getCurrencyChoices(), []);
  const {
    reset,
    formState: { isSubmitting },
  } = useFormContext();

  const categoryDisplayName = translate(
    "crm.settings.validation.entities.categories",
  );

  const { data: deals } = useGetList("deals", {
    pagination: { page: 1, perPage: 1000 },
  });

  const validateDealCategories = useCallback(
    (categories: { value: string; label: string }[] | undefined) =>
      validateItemsInUse(categories, deals, "category", categoryDisplayName, {
        duplicate: (displayName, duplicates) =>
          translate("crm.settings.validation.duplicate", {
            display_name: displayName,
            items: duplicates.join(", "),
          }),
        inUse: (displayName, inUse) =>
          translate("crm.settings.validation.in_use", {
            display_name: displayName,
            items: inUse.join(", "),
          }),
        validating: translate("crm.settings.validation.validating"),
      }),
    [categoryDisplayName, deals, translate],
  );

  return (
    <div className="flex gap-8 mt-4 pb-20">
      {/* Left navigation */}
      <nav className="hidden md:block w-48 shrink-0">
        <div className="sticky top-4 space-y-1">
          <h1 className="text-2xl font-semibold px-3 mb-2">
            {translate("crm.settings.title")}
          </h1>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                document
                  .getElementById(section.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block w-full text-left px-3 py-1 text-sm rounded-md hover:text-foreground hover:bg-muted transition-colors"
            >
              {translate(section.label, { smart_count: 2 })}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-2xl space-y-6">
        {/* Companies */}
        <Card id="companies">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("resources.companies.name", {
                smart_count: 2,
              })}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.companies.sectors")}
            </h3>
            <ArrayInput
              source="companySectors"
              label={false}
              helperText={false}
            >
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Deals */}
        <Card id="deals">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("resources.deals.name", {
                smart_count: 2,
              })}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.deals.currency")}
            </h3>
            <AutocompleteInput
              source="currency"
              label={false}
              choices={currencyChoices}
              inputText={(choice) => choice?.id}
              modal
            />

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.deals.pipelines")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translate("crm.settings.deals.pipelines_help")}
            </p>
            <EditorDeEmbudos deals={deals} />

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.deals.categories")}
            </h3>
            <ArrayInput
              source="dealCategories"
              label={false}
              helperText={false}
              validate={validateDealCategories}
            >
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.deals.loss_reasons")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translate("crm.settings.deals.loss_reasons_help")}
            </p>
            <ArrayInput
              source="dealLossReasons"
              label={false}
              helperText={false}
            >
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card id="notes">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("resources.notes.name", {
                smart_count: 2,
              })}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.notes.statuses")}
            </h3>
            <ArrayInput source="noteStatuses" label={false} helperText={false}>
              <SimpleFormIterator inline disableReordering disableClear>
                <TextInput source="label" label={false} className="flex-1" />
                <ColorInput source="color" />
              </SimpleFormIterator>
            </ArrayInput>

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.notes.types")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translate("crm.settings.notes.types_help")}
            </p>
            <ArrayInput source="noteTypes" label={false} helperText={false}>
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card id="tasks">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("resources.tasks.name", {
                smart_count: 2,
              })}
            </h2>
            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("crm.settings.tasks.types")}
            </h3>
            <ArrayInput source="taskTypes" label={false} helperText={false}>
              <SimpleFormIterator disableReordering disableClear>
                <TextInput source="label" label={false} />
              </SimpleFormIterator>
            </ArrayInput>
          </CardContent>
        </Card>

        {/* Custom fields */}
        <Card id="custom-fields">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {translate("crm.settings.sections.custom_fields")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {translate("crm.settings.custom_fields.help")}
            </p>

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("resources.contacts.name", { smart_count: 2 })}
            </h3>
            <CustomFieldsEditor source="contactCustomFields" />

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("resources.companies.name", { smart_count: 2 })}
            </h3>
            <CustomFieldsEditor source="companyCustomFields" />

            <Separator />

            <h3 className="text-lg font-medium text-muted-foreground">
              {translate("resources.deals.name", { smart_count: 2 })}
            </h3>
            <CustomFieldsEditor source="dealCustomFields" />
          </CardContent>
        </Card>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <div className="max-w-screen-xl mx-auto flex gap-8 px-4">
          <div className="hidden md:block w-48 shrink-0" />
          <div className="flex-1 min-w-0 max-w-2xl flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset({ ...defaultConfiguration })}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {translate("crm.settings.reset_defaults")}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                {translate("ra.action.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-1" />
                {isSubmitting
                  ? translate("crm.settings.saving")
                  : translate("ra.action.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Editor de los campos personalizados de una entidad: etiqueta, tipo y —para
 * el tipo lista— las opciones separadas por comas.
 */
const CustomFieldsEditor = ({ source }: { source: string }) => {
  const translate = useTranslate();
  const tipos = [
    { id: "text", name: translate("crm.custom_fields.types.text") },
    { id: "number", name: translate("crm.custom_fields.types.number") },
    { id: "date", name: translate("crm.custom_fields.types.date") },
    { id: "list", name: translate("crm.custom_fields.types.list") },
    { id: "checkbox", name: translate("crm.custom_fields.types.checkbox") },
  ];

  return (
    <ArrayInput source={source} label={false} helperText={false}>
      <SimpleFormIterator inline disableReordering disableClear>
        <TextInput
          source="label"
          label={false}
          helperText={false}
          placeholder={translate("crm.custom_fields.field_label")}
          className="flex-1"
        />
        <SelectInput
          source="type"
          label={false}
          helperText={false}
          choices={tipos}
          translateChoice={false}
          defaultValue="text"
          className="w-44 min-w-44"
        />
        <TextInput
          source="optionsText"
          label={false}
          helperText={false}
          placeholder={translate("crm.custom_fields.options_hint")}
          className="flex-1"
        />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

/**
 * Editor de los embudos de oportunidades: cada uno con su nombre, sus etapas
 * y qué etapas cuentan como parte del pipeline. El nivel exterior se maneja a
 * mano (agregar/quitar embudos con setValue) porque los iteradores de
 * formulario no se pueden anidar; las etapas de cada embudo sí usan el
 * iterador normal con una ruta absoluta.
 */
const EditorDeEmbudos = ({ deals }: { deals?: RaRecord[] }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const { watch, setValue } = useFormContext();
  const embudos: DealPipeline[] = watch("dealPipelines") ?? [];
  const stageDisplayName = translate("crm.settings.validation.entities.stages");

  const validarEtapasDelEmbudo = useCallback(
    (valorDelEmbudo: string) =>
      (etapas: { value: string; label: string }[] | undefined) =>
        validateItemsInUse(
          etapas,
          deals?.filter(
            (deal) => (deal.pipeline ?? "ventas") === valorDelEmbudo,
          ),
          "stage",
          stageDisplayName,
          {
            duplicate: (displayName, duplicates) =>
              translate("crm.settings.validation.duplicate", {
                display_name: displayName,
                items: duplicates.join(", "),
              }),
            inUse: (displayName, inUse) =>
              translate("crm.settings.validation.in_use", {
                display_name: displayName,
                items: inUse.join(", "),
              }),
            validating: translate("crm.settings.validation.validating"),
          },
        ),
    [deals, stageDisplayName, translate],
  );

  const agregarEmbudo = () => {
    setValue("dealPipelines", [
      ...embudos,
      {
        value: "",
        label: "",
        stages: defaultConfiguration.dealStages,
        pipelineStatuses: defaultConfiguration.dealPipelineStatuses,
      },
    ]);
  };

  const quitarEmbudo = (indice: number) => {
    const embudo = embudos[indice];
    const enUso = deals?.some(
      (deal) => (deal.pipeline ?? "ventas") === embudo.value,
    );
    if (enUso) {
      notify("crm.settings.deals.pipeline_in_use", {
        type: "error",
        messageArgs: { name: embudo.label || embudo.value },
      });
      return;
    }
    setValue(
      "dealPipelines",
      embudos.filter((_, i) => i !== indice),
    );
  };

  return (
    <div className="space-y-4">
      {embudos.map((embudo, indice) => (
        <div key={indice} className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <TextInput
              source={`dealPipelines.${indice}.label`}
              label={false}
              helperText={false}
              placeholder={translate("crm.settings.deals.pipeline_name")}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={translate("crm.settings.deals.remove_pipeline")}
              disabled={embudos.length <= 1}
              onClick={() => quitarEmbudo(indice)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <h4 className="text-sm font-medium text-muted-foreground">
            {translate("crm.settings.deals.stages")}
          </h4>
          <ArrayInput
            source={`dealPipelines.${indice}.stages`}
            label={false}
            helperText={false}
            validate={validarEtapasDelEmbudo(embudo.value)}
          >
            <SimpleFormIterator disableClear>
              <TextInput source="label" label={false} />
            </SimpleFormIterator>
          </ArrayInput>

          <h4 className="text-sm font-medium text-muted-foreground">
            {translate("crm.settings.deals.pipeline_statuses")}
          </h4>
          <p className="text-sm text-muted-foreground">
            {translate("crm.settings.deals.pipeline_help")}
          </p>
          <SelectorDeEtapas
            embudo={embudo}
            indice={indice}
            campo="pipelineStatuses"
          />

          <h4 className="text-sm font-medium text-muted-foreground">
            {translate("crm.settings.deals.lost_stages")}
          </h4>
          <p className="text-sm text-muted-foreground">
            {translate("crm.settings.deals.lost_stages_help")}
          </p>
          <SelectorDeEtapas
            embudo={embudo}
            indice={indice}
            campo="lostStages"
          />
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={agregarEmbudo}>
        <Plus className="h-4 w-4 mr-1" />
        {translate("crm.settings.deals.add_pipeline")}
      </Button>
    </div>
  );
};

/**
 * Botones de dos estados sobre las etapas de un embudo, para marcar cuáles
 * cuentan como ganadas (`pipelineStatuses`) o como perdidas (`lostStages`).
 */
const SelectorDeEtapas = ({
  embudo,
  indice,
  campo,
}: {
  embudo: DealPipeline;
  indice: number;
  campo: "pipelineStatuses" | "lostStages";
}) => {
  const { setValue } = useFormContext();
  const seleccionadas = embudo[campo] ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      {(embudo.stages ?? []).map((etapa, idx) => {
        const valor = etapa.value || toSlug(etapa.label ?? "");
        const activa = seleccionadas.includes(valor);
        return (
          <Button
            key={idx}
            type="button"
            variant={activa ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setValue(
                `dealPipelines.${indice}.${campo}`,
                activa
                  ? seleccionadas.filter((estado) => estado !== valor)
                  : [...seleccionadas, valor],
              )
            }
          >
            {etapa.label || valor}
          </Button>
        );
      })}
    </div>
  );
};

/** A minimal color picker input compatible with ra-core's useInput. */
const ColorInput = ({ source }: { source: string }) => {
  const { field } = useInput({ source });
  return (
    <input
      type="color"
      {...field}
      value={field.value || "#000000"}
      className="w-9 h-9 shrink-0 cursor-pointer appearance-none rounded border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:cursor-pointer [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:cursor-pointer [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none"
    />
  );
};

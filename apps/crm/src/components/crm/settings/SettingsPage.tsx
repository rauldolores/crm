/* eslint-disable react-refresh/only-export-components */
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import type { RaRecord } from "ra-core";
import { EditBase, Form, useGetList, useNotify, useTranslate } from "ra-core";
import { useCallback, useMemo } from "react";
import { Navigate, useParams } from "react-router";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toSlug } from "@/lib/toSlug";
import { ArrayInput } from "@/components/admin/array-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { SelectInput } from "@/components/admin/select-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { NumberInput } from "@/components/admin/number-input";
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
  Project,
} from "../types";
import { AjustesDeTickets } from "./AjustesDeTickets";
import { AjustesDeProyectos } from "./AjustesDeProyectos";
import { limpiarProyectos } from "../proyectos/proyectos";
import { AjustesDeRenovaciones } from "./AjustesDeRenovaciones";
import { AjustesDeRiesgo } from "./AjustesDeRiesgo";
import { ajustesDeRiesgo } from "../customers/usoDelCliente";
import {
  ajustesDeRenovaciones,
  limpiarRenovaciones,
} from "../renovaciones/renovaciones";
import { limpiarSla } from "./limpiarSla";
import { ColorInput } from "./ColorInput";
import {
  APARTADO_INICIAL,
  rutaDeApartado,
  type ApartadoDeConfiguracion,
} from "./apartadosDeAjustes";

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
      const stages = (ensureValues(embudo.stages) ?? []).map((etapa) => {
        // La probabilidad es opcional: vacía o fuera de 0-100 no se guarda.
        const { probability, ...resto } =
          etapa as DealPipeline["stages"][number];
        const valor = Number(probability);
        return typeof probability === "number" && Number.isFinite(valor)
          ? { ...resto, probability: Math.max(0, Math.min(100, valor)) }
          : resto;
      }) as DealPipeline["stages"];
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
        // Sus oportunidades heredan este proyecto (lo aplica la base).
        project: embudo.project || null,
      };
    });

const transformFormValues = (data: Record<string, any>) => {
  const embudos = aEmbudosGuardables(data.dealPipelines);
  return {
    config: {
      // No hay ningún campo de formulario para `modules` en esta página —
      // se guarda tal cual llegó en defaultValues para no borrar qué
      // módulos están activos cada vez que se guardan Ajustes. Se activan y
      // desactivan solo desde Módulos > Catálogo.
      modules: data.modules,
      // Igual que `modules`: las cotizaciones se configuran en su propia
      // pantalla y aquí solo se conservan.
      quoteTaxRate: data.quoteTaxRate,
      quoteTemplates: data.quoteTemplates,
      quoteIssuer: data.quoteIssuer,
      // Oportunidades de renovación: valores limpios, y el embudo que agregó
      // el sistema se conserva (no cuenta contra el límite del plan).
      renewals: limpiarRenovaciones(data.renewals, data.renewals),
      // Clientes en riesgo: valores limpios (los de fábrica donde falten).
      risk: ajustesDeRiesgo(data.risk),
      currency: data.currency,
      ...limpiarProyectos(data.projects, data.defaultProject),
      companySectors: ensureValues(data.companySectors),
      dealCategories: ensureValues(data.dealCategories),
      taskTypes: ensureValues(data.taskTypes),
      dealPipelines: embudos,
      requireIncomeToWin: data.requireIncomeToWin ?? true,
      dealLossReasons: ensureValues(data.dealLossReasons),
      // Derivados del primer embudo, por compatibilidad con configuraciones
      // y lectores anteriores a los embudos múltiples.
      dealStages: embudos[0]?.stages ?? [],
      dealPipelineStatuses: embudos[0]?.pipelineStatuses ?? [],
      noteStatuses: ensureValues(data.noteStatuses),
      noteTypes: ensureValues(data.noteTypes),
      ticketPriorities: ensureValues(data.ticketPriorities),
      ticketCategories: ensureValues(data.ticketCategories),
      ticketSla: limpiarSla(data.ticketSla),
      contactCustomFields: aDefiniciones(data.contactCustomFields),
      companyCustomFields: aDefiniciones(data.companyCustomFields),
      dealCustomFields: aDefiniciones(data.dealCustomFields),
    } as ConfigurationContextValue,
  };
};

/** Lo que cada apartado guarda: lo único que toca «Restablecer» en él. */
const CLAVES_POR_APARTADO: Record<ApartadoDeConfiguracion, string[]> = {
  proyectos: ["projects", "defaultProject"],
  embudos: ["dealPipelines"],
  reglas: [
    "currency",
    "dealCategories",
    "requireIncomeToWin",
    "dealLossReasons",
  ],
  listas: ["companySectors", "noteStatuses", "noteTypes", "taskTypes"],
  campos: ["contactCustomFields", "companyCustomFields", "dealCustomFields"],
  tickets: ["ticketPriorities", "ticketCategories", "ticketSla"],
  renovaciones: ["renewals"],
  riesgo: ["risk"],
};

const esApartado = (
  valor: string | undefined,
): valor is ApartadoDeConfiguracion =>
  valor != null && Object.hasOwn(CLAVES_POR_APARTADO, valor);

/**
 * La configuración de la organización, un apartado por dirección
 * (/settings/embudos, /settings/listas…). El menú que los reúne con las demás
 * pantallas de administración lo pone MarcoDeAjustes.
 *
 * Todos los apartados comparten un único formulario: al pasar de uno a otro
 * no se pierde lo que se estaba editando, y «Guardar» guarda lo cambiado en
 * cualquiera de ellos.
 */
export const SettingsPage = () => {
  const { seccion } = useParams();
  if (!esApartado(seccion)) {
    return <Navigate to={rutaDeApartado(APARTADO_INICIAL)} replace />;
  }
  return <PaginaDeAjustes apartado={seccion} />;
};

const PaginaDeAjustes = ({
  apartado,
}: {
  apartado: ApartadoDeConfiguracion;
}) => {
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
      <SettingsForm apartado={apartado} />
    </EditBase>
  );
};

SettingsPage.path = "/settings";

const SettingsForm = ({ apartado }: { apartado: ApartadoDeConfiguracion }) => {
  const config = useConfigurationContext();

  const defaultValues = useMemo(
    () => ({
      modules: config.modules,
      quoteTaxRate: config.quoteTaxRate,
      quoteTemplates: config.quoteTemplates,
      quoteIssuer: config.quoteIssuer,
      renewals: ajustesDeRenovaciones(config.renewals),
      risk: ajustesDeRiesgo(config.risk),
      currency: config.currency,
      projects: config.projects,
      defaultProject: config.defaultProject,
      companySectors: config.companySectors,
      dealCategories: config.dealCategories,
      taskTypes: config.taskTypes,
      dealPipelines: config.dealPipelines,
      requireIncomeToWin: config.requireIncomeToWin,
      dealLossReasons: config.dealLossReasons,
      noteStatuses: config.noteStatuses,
      noteTypes: config.noteTypes,
      ticketPriorities: config.ticketPriorities,
      ticketCategories: config.ticketCategories,
      ticketSla: config.ticketSla,
      contactCustomFields: aFilasEditables(config.contactCustomFields),
      companyCustomFields: aFilasEditables(config.companyCustomFields),
      dealCustomFields: aFilasEditables(config.dealCustomFields),
    }),
    [config],
  );

  return (
    <Form defaultValues={defaultValues}>
      <SettingsFormFields apartado={apartado} />
    </Form>
  );
};

const SettingsFormFields = ({
  apartado,
}: {
  apartado: ApartadoDeConfiguracion;
}) => {
  const translate = useTranslate();
  const currencyChoices = useMemo(() => getCurrencyChoices(), []);
  const config = useConfigurationContext();
  const {
    reset,
    setValue,
    formState: { isSubmitting },
  } = useFormContext();

  // Los valores de fábrica, ya en la forma del formulario.
  const valoresDeFabrica: Record<string, unknown> = {
    ...defaultConfiguration,
    renewals: limpiarRenovaciones({}, config.renewals),
    risk: ajustesDeRiesgo({}),
    contactCustomFields: aFilasEditables(
      defaultConfiguration.contactCustomFields,
    ),
    companyCustomFields: aFilasEditables(
      defaultConfiguration.companyCustomFields,
    ),
    dealCustomFields: aFilasEditables(defaultConfiguration.dealCustomFields),
  };
  const restablecer = () =>
    CLAVES_POR_APARTADO[apartado].forEach((clave) =>
      setValue(clave, valoresDeFabrica[clave], { shouldDirty: true }),
    );

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
    <div className="space-y-6">
      {apartado === "proyectos" && <AjustesDeProyectos />}

      {apartado === "embudos" && (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">
              {translate("crm.settings.nav.pipelines")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {translate("crm.settings.deals.pipelines_help")}
            </p>
            <EditorDeEmbudos deals={deals} />
          </CardContent>
        </Card>
      )}

      {apartado === "reglas" && (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">
              {translate("crm.settings.nav.rules")}
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
              {translate("crm.settings.deals.win_rule")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translate("crm.settings.deals.win_rule_help")}
            </p>
            <BooleanInput
              source="requireIncomeToWin"
              label="crm.settings.deals.win_rule_label"
              helperText={false}
            />

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
      )}

      {apartado === "listas" && (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">
              {translate("crm.settings.nav.lists")}
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

            <Separator />

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

            <Separator />

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
      )}

      {apartado === "campos" && (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">
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
      )}

      {apartado === "tickets" && <AjustesDeTickets />}
      {apartado === "renovaciones" && <AjustesDeRenovaciones />}
      {apartado === "riesgo" && <AjustesDeRiesgo />}

      {/* Pegada al pie de la ventana mientras el apartado es largo. */}
      <div className="sticky bottom-0 flex justify-between border-t bg-background py-3">
        {apartado !== "proyectos" ? (
          <Button type="button" variant="ghost" onClick={restablecer}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {translate("crm.settings.reset_defaults")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => reset()}>
            {translate("crm.settings.discard")}
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
            <SelectorDeProyectoDelEmbudo indice={indice} />
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
              <TextInput source="label" label={false} className="flex-1" />
              <NumberInput
                source="probability"
                label={false}
                helperText={false}
                min={0}
                max={100}
                step={5}
                placeholder="%"
                className="w-24"
                aria-label={translate("crm.settings.deals.probability")}
              />
            </SimpleFormIterator>
          </ArrayInput>
          <p className="text-sm text-muted-foreground">
            {translate("crm.settings.deals.probability_help")}
          </p>

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

/** El proyecto que vende un embudo, elegido entre los del formulario. */
const SelectorDeProyectoDelEmbudo = ({ indice }: { indice: number }) => {
  const proyectos: Partial<Project>[] = useWatch({ name: "projects" }) ?? [];
  const opciones = proyectos
    .filter((p) => p?.label?.trim())
    .map((p) => ({ id: p.value || toSlug(p.label!), name: p.label! }));
  if (!opciones.length) return null;
  return (
    <SelectInput
      source={`dealPipelines.${indice}.project`}
      label={false}
      helperText={false}
      choices={opciones}
      emptyText="crm.projects.no_project"
      className="w-48"
    />
  );
};

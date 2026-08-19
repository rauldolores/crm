import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  required,
  useCreate,
  useDelete,
  useGetList,
  useNotify,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useState } from "react";
import { useWatch, type FieldValues } from "react-hook-form";

import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { NumberInput } from "@/components/admin/number-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Automation, Sale } from "../types";

/**
 * Automatizaciones: reglas «cuando pase X, haz Y», en lenguaje llano.
 *
 * Las reglas se aplican en la base de datos (ver public.run_automations), así
 * que valen igual si el cambio entra por la aplicación, por la API o por una
 * importación. Aquí solo se dan de alta, se activan y se borran: para cambiar
 * una regla se crea otra y se elimina la anterior, que con cuatro campos es
 * más simple que sostener un editor completo.
 */
export const AutomatizacionesPage = () => {
  const translate = useTranslate();

  const { data: reglas, refetch } = useGetList<Automation>("automations", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "ASC" },
  });

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {translate("crm.automations.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {translate("crm.automations.intro")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.automations.your_rules")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(reglas ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {translate("crm.automations.empty")}
            </p>
          ) : (
            (reglas ?? []).map((regla) => (
              <TarjetaDeRegla
                key={regla.id}
                regla={regla}
                alCambiar={refetch}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate("crm.automations.new_rule")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioDeRegla alCrear={refetch} />
        </CardContent>
      </Card>
    </div>
  );
};

AutomatizacionesPage.path = "/automatizaciones";

/** Una regla existente, como frase legible, con interruptor y borrado. */
const TarjetaDeRegla = ({
  regla,
  alCambiar,
}: {
  regla: Automation;
  alCambiar: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();
  const { dealStages } = useConfigurationContext();
  const { data: comerciales } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "last_name", order: "ASC" },
  });

  const etiquetaDeEtapa =
    dealStages.find((etapa) => etapa.value === regla.trigger_params?.stage)
      ?.label ?? regla.trigger_params?.stage;

  const cuando =
    regla.trigger_event === "stage_changed"
      ? translate("crm.automations.when.deal_stage_named", {
          stage: etiquetaDeEtapa ?? "",
        })
      : translate(
          regla.trigger_resource === "contacts"
            ? "crm.automations.when.contact_created"
            : "crm.automations.when.deal_created",
        );

  const entonces =
    regla.action_type === "assign_owner"
      ? translate("crm.automations.then.assign_named", {
          name: (() => {
            const comercial = (comerciales ?? []).find(
              (candidato) =>
                String(candidato.id) === String(regla.action_params?.salesId),
            );
            return comercial
              ? `${comercial.first_name} ${comercial.last_name}`
              : "—";
          })(),
        })
      : translate("crm.automations.then.task_named", {
          text: regla.action_params?.text ?? regla.name,
          days: regla.action_params?.dueInDays ?? 3,
        });

  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Switch
        checked={regla.active}
        aria-label={translate("crm.automations.toggle")}
        onCheckedChange={async () => {
          await update("automations", {
            id: regla.id,
            data: { active: !regla.active },
            previousData: regla,
          });
          alCambiar();
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{regla.name}</p>
        <p className="text-sm text-muted-foreground">
          {translate("crm.automations.sentence", {
            when: cuando,
            then: entonces,
          })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={translate("ra.action.delete")}
        className="text-muted-foreground hover:text-destructive"
        onClick={async () => {
          await deleteOne("automations", {
            id: regla.id,
            previousData: regla,
          });
          notify("crm.automations.deleted", { type: "info" });
          alCambiar();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

/** Alta de una regla nueva. */
const FormularioDeRegla = ({ alCrear }: { alCrear: () => void }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [create, { isPending }] = useCreate();
  // Remontar el formulario es la forma más simple de vaciarlo tras el alta.
  const [generacion, setGeneracion] = useState(0);

  const guardar = async (valores: FieldValues) => {
    const [trigger_resource, trigger_event] = String(valores.cuando).split(":");
    const esTarea = valores.accion === "create_task";

    try {
      await create(
        "automations",
        {
          data: {
            name: valores.name,
            active: true,
            trigger_resource,
            trigger_event,
            trigger_params:
              trigger_event === "stage_changed" && valores.stage
                ? { stage: valores.stage }
                : {},
            action_type: valores.accion,
            action_params: esTarea
              ? {
                  text: valores.text,
                  taskType: valores.taskType,
                  dueInDays: Number(valores.dueInDays ?? 3),
                }
              : { salesId: valores.salesId },
          },
        },
        { returnPromise: true },
      );
      notify("crm.automations.created", { type: "info" });
      setGeneracion((anterior) => anterior + 1);
      alCrear();
    } catch {
      notify("crm.automations.create_error", { type: "error" });
    }
  };

  return (
    <Form
      key={generacion}
      onSubmit={guardar}
      defaultValues={{
        cuando: "contacts:created",
        accion: "create_task",
        dueInDays: 3,
      }}
    >
      <div className="flex flex-col gap-4">
        <TextInput
          source="name"
          label="crm.automations.fields.name"
          helperText={false}
          validate={required()}
        />
        <CamposDeLaRegla />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            <Plus className="h-4 w-4 mr-1" />
            {translate("crm.automations.add")}
          </Button>
        </div>
      </div>
    </Form>
  );
};

/** Los campos que dependen del disparador y de la acción elegidos. */
const CamposDeLaRegla = () => {
  const { dealStages, taskTypes } = useConfigurationContext();
  const cuando = useWatch({ name: "cuando" });
  const accion = useWatch({ name: "accion" });

  const disparadores = [
    { id: "contacts:created", name: "crm.automations.when.contact_created" },
    { id: "deals:created", name: "crm.automations.when.deal_created" },
    { id: "deals:stage_changed", name: "crm.automations.when.deal_stage" },
  ];
  const acciones = [
    { id: "create_task", name: "crm.automations.then.task" },
    { id: "assign_owner", name: "crm.automations.then.assign" },
  ];

  return (
    <>
      <SelectInput
        source="cuando"
        label="crm.automations.fields.when"
        choices={disparadores}
        helperText={false}
        validate={required()}
      />
      {cuando === "deals:stage_changed" && (
        <SelectInput
          source="stage"
          label="crm.automations.fields.stage"
          choices={dealStages}
          optionText="label"
          optionValue="value"
          helperText={false}
          validate={required()}
        />
      )}

      <SelectInput
        source="accion"
        label="crm.automations.fields.then"
        choices={acciones}
        helperText={false}
        validate={required()}
      />
      {accion === "create_task" ? (
        <>
          <TextInput
            source="text"
            label="crm.automations.fields.task_text"
            helperText={false}
            validate={required()}
          />
          <SelectInput
            source="taskType"
            label="crm.automations.fields.task_type"
            choices={taskTypes}
            optionText="label"
            optionValue="value"
            helperText={false}
          />
          <NumberInput
            source="dueInDays"
            label="crm.automations.fields.due_in_days"
            helperText={false}
            min={0}
          />
        </>
      ) : (
        <ReferenceInput
          source="salesId"
          reference="sales"
          filter={{ "disabled@neq": true }}
        >
          <AutocompleteInput
            label="crm.automations.fields.owner"
            helperText={false}
            optionText={(comercial: Sale) =>
              `${comercial.first_name} ${comercial.last_name}`
            }
            validate={required()}
          />
        </ReferenceInput>
      )}
    </>
  );
};

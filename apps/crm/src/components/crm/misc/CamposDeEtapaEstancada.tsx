import { required } from "ra-core";
import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { etapasDeDestino } from "./disparadoresDeAutomatizacion";

/**
 * Los campos de «una oportunidad lleva N días en una etapa»: embudo, etapa
 * de ese embudo y días.
 *
 * Primero el embudo, y la etapa solo entre las suyas, porque los embudos
 * comparten los nombres internos de etapa: elegir «Oportunidad» en la lista
 * de todas no diría de cuál, y la regla saltaría en todos.
 */
export const CamposDeEtapaEstancada = () => {
  const { dealPipelines } = useConfigurationContext();
  const { getValues, setValue } = useFormContext();
  const embudoElegido = useWatch({ name: "pipeline" });

  const embudo = dealPipelines.find(
    (candidato) => candidato.value === embudoElegido,
  );

  // Al cambiar de embudo, una etapa que no exista en el nuevo deja de valer:
  // se vacía en vez de guardarse una regla que nunca se cumpliría.
  useEffect(() => {
    const etapa = getValues("stage");
    if (
      etapa &&
      !embudo?.stages.some((candidata) => candidata.value === etapa)
    ) {
      setValue("stage", undefined);
    }
  }, [embudo, getValues, setValue]);

  return (
    <>
      <SelectInput
        source="pipeline"
        label="crm.automations.fields.pipeline"
        choices={dealPipelines}
        optionText="label"
        optionValue="value"
        helperText={false}
        validate={required()}
      />
      <SelectInput
        source="stage"
        label="crm.automations.fields.stage"
        choices={embudo?.stages ?? []}
        optionText="label"
        optionValue="value"
        helperText={false}
        disabled={!embudo}
        validate={required()}
      />
      <NumberInput
        source="daysInStage"
        label="crm.automations.fields.days_in_stage"
        helperText="crm.automations.fields.days_in_stage_help"
        min={1}
        validate={required()}
      />
    </>
  );
};

/**
 * A qué etapa mover la oportunidad estancada: del mismo embudo que la regla,
 * sin la de origen ni las ganadas (ver `etapasDeDestino`). Si cambia el
 * embudo o la etapa de origen, un destino que ya no vale se vacía.
 */
export const CampoDeEtapaDestino = () => {
  const { dealPipelines } = useConfigurationContext();
  const { getValues, setValue } = useFormContext();
  const embudoElegido = useWatch({ name: "pipeline" });
  const etapaDeOrigen = useWatch({ name: "stage" });

  const destinos = useMemo(
    () =>
      etapasDeDestino(
        dealPipelines.find((candidato) => candidato.value === embudoElegido),
        etapaDeOrigen,
      ),
    [dealPipelines, embudoElegido, etapaDeOrigen],
  );

  useEffect(() => {
    const destino = getValues("targetStage");
    if (destino && !destinos.some((etapa) => etapa.value === destino)) {
      setValue("targetStage", undefined);
    }
  }, [destinos, getValues, setValue]);

  return (
    <SelectInput
      source="targetStage"
      label="crm.automations.fields.target_stage"
      helperText="crm.automations.fields.target_stage_help"
      choices={destinos}
      optionText="label"
      optionValue="value"
      disabled={destinos.length === 0}
      validate={required()}
    />
  );
};

import { useMemo } from "react";
import { useStore } from "ra-core";

import type {
  CustomFieldDefinition,
  DealPipeline,
  DealStage,
  LabeledValue,
  NoteStatus,
} from "../types";
import { defaultConfiguration } from "./defaultConfiguration";

export const CONFIGURATION_STORE_KEY = "app.configuration";

export interface ConfigurationContextValue {
  companySectors: LabeledValue[];
  currency: string;
  dealCategories: LabeledValue[];
  /**
   * DERIVADOS de dealPipelines al leer la configuración: dealStages es la
   * unión de las etapas de todos los embudos (para resolver etiquetas desde
   * cualquier pantalla) y dealPipelineStatuses la unión de sus estados. Se
   * conservan porque muchos consumidores (panel, fichas) solo necesitan eso.
   */
  dealPipelineStatuses: string[];
  dealStages: DealStage[];
  /** Los embudos de la organización, cada uno con sus etapas. */
  dealPipelines: DealPipeline[];
  /** Motivos por los que se puede perder una oportunidad. */
  dealLossReasons: LabeledValue[];
  noteStatuses: NoteStatus[];
  /** Tipos de actividad para notas: nota, llamada, reunión… */
  noteTypes: LabeledValue[];
  taskTypes: LabeledValue[];
  title: string;
  darkModeLogo: string;
  lightModeLogo: string;
  /** Campos personalizados por entidad, definidos por la organización. */
  contactCustomFields: CustomFieldDefinition[];
  companyCustomFields: CustomFieldDefinition[];
  dealCustomFields: CustomFieldDefinition[];
}

export const useConfigurationContext = () => {
  const [config] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
    defaultConfiguration,
  );
  // Se combina con los valores por defecto para que un ajuste nuevo no quede
  // vacio en instalaciones que guardaron la configuracion antes de que
  // existiera.
  //
  // Los logos se normalizan ademas a cadena: la configuracion viene del
  // almacenamiento del navegador o de la base de datos, asi que puede traer
  // valores antiguos. Al migrar a Next, importar una imagen paso a devolver un
  // objeto en lugar de una URL, y los guardados de entonces terminaban en el
  // atributo `src` como "[object Object]", pidiendo una ruta inexistente.
  return useMemo(() => {
    const combinada = { ...defaultConfiguration, ...config };
    const comoUrl = (valor: unknown): string =>
      typeof valor === "string"
        ? valor
        : ((valor as { src?: string })?.src ?? "");

    // Retrocompatibilidad: una configuración guardada antes de los embudos
    // múltiples trae dealStages/dealPipelineStatuses pero no dealPipelines.
    // Se sintetiza un embudo «Ventas» con esas etapas, que es también el
    // valor por defecto de la columna `pipeline` de las oportunidades.
    const embudosGuardados: DealPipeline[] =
      Array.isArray(combinada.dealPipelines) && combinada.dealPipelines.length
        ? combinada.dealPipelines
        : [
            {
              value: "ventas",
              label: "Ventas",
              stages: combinada.dealStages,
              pipelineStatuses: combinada.dealPipelineStatuses,
              lostStages: [],
            },
          ];

    // lostStages llegó después que los embudos: si falta, se deduce de la
    // etapa «lost» estándar para que el motivo de pérdida funcione sin que
    // nadie tenga que volver a Ajustes.
    const embudos: DealPipeline[] = embudosGuardados.map((embudo) => ({
      ...embudo,
      lostStages:
        embudo.lostStages ??
        (embudo.stages?.some((etapa) => etapa.value === "lost")
          ? ["lost"]
          : []),
    }));

    // Derivados para los consumidores que solo resuelven etiquetas o estados
    // sin importar el embudo: la unión de todas las etapas (la primera
    // aparición de un value gana) y de todos los estados.
    const etapasVistas = new Set<string>();
    const todasLasEtapas = embudos
      .flatMap((embudo) => embudo.stages)
      .filter((etapa) => {
        if (etapasVistas.has(etapa.value)) return false;
        etapasVistas.add(etapa.value);
        return true;
      });
    const todosLosEstados = [
      ...new Set(embudos.flatMap((embudo) => embudo.pipelineStatuses)),
    ];

    return {
      ...combinada,
      dealPipelines: embudos,
      dealStages: todasLasEtapas,
      dealPipelineStatuses: todosLosEstados,
      darkModeLogo: comoUrl(combinada.darkModeLogo),
      lightModeLogo: comoUrl(combinada.lightModeLogo),
    };
  }, [config]);
};

export const useConfigurationUpdater = () => {
  const [, setConfig] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
  );
  return setConfig;
};

import { useMemo } from "react";
import { useStore } from "ra-core";

import type { DealStage, LabeledValue, NoteStatus } from "../types";
import { defaultConfiguration } from "./defaultConfiguration";

export const CONFIGURATION_STORE_KEY = "app.configuration";

export interface ConfigurationContextValue {
  companySectors: LabeledValue[];
  currency: string;
  dealCategories: LabeledValue[];
  dealPipelineStatuses: string[];
  dealStages: DealStage[];
  noteStatuses: NoteStatus[];
  taskTypes: LabeledValue[];
  title: string;
  darkModeLogo: string;
  lightModeLogo: string;
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

    return {
      ...combinada,
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

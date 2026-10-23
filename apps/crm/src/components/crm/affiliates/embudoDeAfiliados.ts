import type { DealPipeline } from "../types";
import { useConfigurationContext } from "../root/ConfigurationContext";

/** Lo que el módulo Afiliados guarda en config.modules.affiliates. */
export interface ConfiguracionDeAfiliados {
  active?: boolean;
  pipelineId?: string;
  completionStages?: string[];
}

export interface EmbudoDeAfiliados {
  /** El módulo está encendido y tiene un embudo elegido. */
  activo: boolean;
  /** El embudo de afiliación, si existe en la configuración. */
  embudo?: DealPipeline;
  /** Etapas que convierten al candidato en afiliado. */
  etapasCompletas: string[];
  /**
   * Etapas en las que el candidato sigue en proceso: las del embudo menos
   * las de afiliación completa y las de pérdida (rechazados).
   */
  etapasEnProceso: string[];
}

/** El embudo de afiliación a partir de la configuración (función pura). */
export const embudoDeAfiliados = (
  modulo: ConfiguracionDeAfiliados | undefined,
  embudos: DealPipeline[],
): EmbudoDeAfiliados => {
  const embudo = modulo?.pipelineId
    ? embudos.find((candidato) => candidato.value === modulo.pipelineId)
    : undefined;
  const activo = !!modulo?.active && !!embudo;
  const etapasCompletas = modulo?.completionStages ?? [];
  const perdidas = embudo?.lostStages ?? [];
  const etapasEnProceso = (embudo?.stages ?? [])
    .map((etapa) => etapa.value)
    .filter(
      (etapa) => !etapasCompletas.includes(etapa) && !perdidas.includes(etapa),
    );
  return { activo, embudo, etapasCompletas, etapasEnProceso };
};

/**
 * Qué empresas ofrecer en una oportunidad de este embudo: en el de afiliados,
 * solo afiliados; en cualquier otro, solo clientes. Sin el módulo, todas.
 */
export const filtroDeEmpresasParaEmbudo = (
  afiliados: Pick<EmbudoDeAfiliados, "activo" | "embudo">,
  embudo: string | undefined,
): Record<string, boolean> => {
  if (!afiliados.activo) return {};
  return embudo && embudo === afiliados.embudo?.value
    ? { is_affiliate: true }
    : { is_client: true };
};

export const useEmbudoDeAfiliados = (): EmbudoDeAfiliados => {
  const { modules, dealPipelines } = useConfigurationContext();
  return embudoDeAfiliados(
    modules.affiliates as ConfiguracionDeAfiliados | undefined,
    dealPipelines,
  );
};

import type { UseQueryResult } from "@tanstack/react-query";
import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";
import type { GetListResult } from "ra-core";
import { useDataProvider } from "ra-core";

import type { Deal, DealStage } from "../types";

/**
 * Oportunidades abiertas que carga el tablero por etapa. Cada columna pide
 * las suyas: antes se pedían 1.000 del embudo entero ordenadas por índice, y
 * una etapa con miles (la prospección importada) se llevaba todo el cupo y
 * dejaba las demás columnas vacías. La columna se pinta por tramos de todos
 * modos; por encima de esto avisa y pide filtrar.
 */
export const OPORTUNIDADES_POR_ETAPA = 500;

export interface OportunidadesPorEtapa {
  deals: Deal[];
  /** Abiertas de cada etapa con los filtros aplicados, cargadas o no. */
  totales: Record<string, number>;
  isPending: boolean;
  refetch: () => Promise<unknown>;
}

/**
 * Una consulta por etapa con los filtros de la lista. La clave empieza por
 * `["deals", "getList"]`, como las de ra-core, para que crear, editar o
 * borrar una oportunidad las invalide igual que antes invalidaba la lista.
 */
export const useOportunidadesPorEtapa = (
  etapas: DealStage[],
  filtros: Record<string, unknown>,
): OportunidadesPorEtapa => {
  const dataProvider = useDataProvider();
  // Con `combine` estable (useCallback) se devuelve el mismo objeto mientras
  // no cambien los datos: el tablero copia las oportunidades a su estado en
  // un efecto, y un arreglo nuevo en cada render lo haría comparar cientos
  // de tarjetas sin motivo.
  const combinar = useCallback(
    (consultas: UseQueryResult<GetListResult<Deal>>[]) => ({
      deals: consultas.flatMap((consulta) => consulta.data?.data ?? []),
      totales: Object.fromEntries(
        etapas.map((etapa, i) => [
          etapa.value,
          consultas[i]?.data?.total ?? consultas[i]?.data?.data.length ?? 0,
        ]),
      ),
      isPending: consultas.some((consulta) => consulta.isPending),
      refetch: () =>
        Promise.all(consultas.map((consulta) => consulta.refetch())),
    }),
    [etapas],
  );
  return useQueries({
    queries: etapas.map((etapa) => {
      const params = {
        pagination: { page: 1, perPage: OPORTUNIDADES_POR_ETAPA },
        sort: { field: "index", order: "ASC" as const },
        filter: { ...filtros, "archived_at@is": null, stage: etapa.value },
      };
      return {
        queryKey: ["deals", "getList", params],
        queryFn: (): Promise<GetListResult<Deal>> =>
          dataProvider.getList<Deal>("deals", params),
      };
    }),
    combine: combinar,
  });
};

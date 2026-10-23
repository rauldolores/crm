import { useGetList } from "ra-core";

import type { Deal } from "../types";
import { useEmbudoDeAfiliados } from "./embudoDeAfiliados";

/**
 * El filtro de los candidatos que siguen en proceso: oportunidades sin
 * archivar del embudo de afiliados que todavía no llegan a la afiliación
 * completa. Las rechazadas o perdidas no salen.
 */
export const useFiltroEnProceso = () => {
  const { activo, embudo, etapasEnProceso } = useEmbudoDeAfiliados();
  const listo = activo && !!embudo && etapasEnProceso.length > 0;
  return {
    listo,
    embudo,
    filtro: {
      pipeline: embudo?.value,
      "archived_at@is": null,
      "stage@in": `(${etapasEnProceso.join(",")})`,
    },
  };
};

/** Cuántos candidatos hay en proceso, para el contador de la pestaña. */
export const useTotalEnProceso = () => {
  const { listo, filtro } = useFiltroEnProceso();
  const { total } = useGetList<Deal>(
    "deals",
    { filter: filtro, pagination: { page: 1, perPage: 1 } },
    { enabled: listo },
  );
  return listo ? (total ?? 0) : 0;
};

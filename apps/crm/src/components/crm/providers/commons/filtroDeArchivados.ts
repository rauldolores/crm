import type { GetListParams } from "ra-core";

/** Clave del filtro de la interfaz: «mostrar solo los archivados». */
export const FILTRO_ARCHIVADOS = "archivados";

/**
 * Los contactos archivados no salen en ninguna lista ni selector salvo que
 * se pidan: sin el filtro `archivados`, la lista trae solo los activos
 * (`archived_at` nulo); con `archivados: true`, solo los archivados. Una
 * lista que ya venga con su propio filtro sobre `archived_at` se respeta.
 * Se aplica en `beforeGetList` de contacts / contacts_summary, en los dos
 * proveedores, para que todo el que liste contactos (la lista, los
 * autocompletados de oportunidades y tareas, las sugerencias de fusión)
 * vea lo mismo sin tener que acordarse.
 */
export const aplicarFiltroDeArchivados = (
  params: GetListParams,
): GetListParams => {
  const { [FILTRO_ARCHIVADOS]: soloArchivados, ...filter } =
    params.filter ?? {};
  if ("archived_at@is" in filter || "archived_at@not.is" in filter) {
    return { ...params, filter };
  }
  return {
    ...params,
    filter: {
      ...filter,
      ...(soloArchivados
        ? { "archived_at@not.is": null }
        : { "archived_at@is": null }),
    },
  };
};

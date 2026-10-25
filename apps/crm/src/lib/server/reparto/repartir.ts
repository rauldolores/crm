/**
 * Cómo se reparte un lote de oportunidades entre varios comerciales.
 *
 * Por turnos y en el orden en que llegan (por id): la primera para el
 * primero, la segunda para el segundo… Así cada uno recibe la misma cantidad,
 * con una de diferencia como mucho, y repetir el mismo reparto da el mismo
 * resultado.
 *
 * Con cada oportunidad van su contacto y su empresa: si no, el comercial
 * tendría la tarjeta, pero al filtrar «solo míos» en contactos o tareas no
 * vería nada. Cuando un contacto o una empresa aparece en dos oportunidades
 * que caen en manos distintas, se queda con quien recibió la primera; sin una
 * regla fija dependería del orden de las escrituras.
 *
 * Está separado del acceso a datos para poder probarlo sin base de datos.
 */

export interface OportunidadParaRepartir {
  id: number;
  company_id: number | null;
  contact_ids: number[] | null;
}

export interface Asignacion {
  oportunidades: number[];
  contactos: number[];
  empresas: number[];
}

/**
 * @param oportunidades Las del lote, ya ordenadas.
 * @param responsables Ids de comercial entre quienes se reparte, sin repetir.
 * @returns Comercial -> lo que le toca. Todos los responsables aparecen,
 *   aunque les toque nada.
 */
export const repartir = (
  oportunidades: OportunidadParaRepartir[],
  responsables: number[],
): Map<number, Asignacion> => {
  const reparto = new Map<number, Asignacion>(
    responsables.map((id) => [
      id,
      { oportunidades: [], contactos: [], empresas: [] },
    ]),
  );
  if (responsables.length === 0) return reparto;

  const contactosAsignados = new Set<number>();
  const empresasAsignadas = new Set<number>();

  oportunidades.forEach((oportunidad, posicion) => {
    const asignacion = reparto.get(
      responsables[posicion % responsables.length],
    )!;
    asignacion.oportunidades.push(oportunidad.id);

    for (const contactoId of oportunidad.contact_ids ?? []) {
      if (contactosAsignados.has(contactoId)) continue;
      contactosAsignados.add(contactoId);
      asignacion.contactos.push(contactoId);
    }

    const empresaId = oportunidad.company_id;
    if (empresaId != null && !empresasAsignadas.has(empresaId)) {
      empresasAsignadas.add(empresaId);
      asignacion.empresas.push(empresaId);
    }
  });

  return reparto;
};

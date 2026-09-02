/**
 * Reescribe el cuerpo de un alta o modificación para imponer a quién
 * pertenece la fila, antes de reenviarla a PostgREST.
 *
 * Dos campos, por el mismo motivo: el puente consulta con la clave de
 * servicio, así que la base no puede deducir ninguno de los dos por su cuenta
 * y es aquí donde hay que ponerlos.
 *
 * - `organization_id` se impone siempre, tambien sobre lo que mande el
 *   cliente: si no, bastaria con enviar otro para crear o mover un registro a
 *   otra empresa.
 * - `sales_id` solo se rellena si viene vacío. Al crear una tarea para otra
 *   persona el formulario ya manda el suyo, y pisarlo cambiaria el
 *   responsable elegido.
 *
 * Un cuerpo que no sea JSON se devuelve tal cual: no toda peticion al puente
 * lleva filas.
 */
export function imponerDueno(
  texto: string,
  organizacionId: string,
  responsable: number | null,
): string {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return texto;
  }

  const conDueno = (fila: unknown) => {
    if (fila == null || typeof fila !== "object" || Array.isArray(fila)) {
      return fila;
    }
    const original = fila as Record<string, unknown>;
    return {
      ...original,
      organization_id: organizacionId,
      ...(responsable != null && original.sales_id == null
        ? { sales_id: responsable }
        : {}),
    };
  };

  return JSON.stringify(
    Array.isArray(datos) ? datos.map(conDueno) : conDueno(datos),
  );
}

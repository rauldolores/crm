/**
 * Reescribe el cuerpo de un alta o modificación para forzar `sales_id` al
 * del afiliado que hace la petición, sin importar lo que mande el cliente.
 *
 * A diferencia de `imponerDueno` (que solo rellena `sales_id` si viene
 * vacío, porque asignar una tarea a otra persona es una decisión legítima
 * de un usuario normal), aquí se sobrescribe siempre: un afiliado no debe
 * poder crear ni mover un registro fuera de lo que gestiona cambiando ese
 * campo en la petición.
 */
export function restringirAPropios(texto: string, salesId: number): string {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return texto;
  }

  const conPropietario = (fila: unknown) => {
    if (fila == null || typeof fila !== "object" || Array.isArray(fila)) {
      return fila;
    }
    return { ...(fila as Record<string, unknown>), sales_id: salesId };
  };

  return JSON.stringify(
    Array.isArray(datos) ? datos.map(conPropietario) : conPropietario(datos),
  );
}

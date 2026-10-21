/**
 * Campos de una tabla que el puente /api/datos no deja escribir aunque la
 * tabla sí sea editable. `contracts.billing_enabled` decide si a un cliente
 * se le timbran facturas solo: lo cambia un administrador por
 * /api/facturacion/contratos/:id, no cualquiera con sesión editando un
 * contrato.
 */
export const CAMPOS_PROTEGIDOS: Record<string, string[]> = {
  // in_grace y grace_until los escribe solo la integración con KontrolIA
  // Auth: a mano dirían que alguien tiene acceso que allá no tiene.
  contracts: ["billing_enabled", "in_grace", "grace_until"],
  // De qué contrato y qué fecha es una oportunidad de renovación: los pone
  // solo crm.generar_oportunidades_de_renovacion. A mano romperían el cierre
  // automático (ganada al pagarse, perdida al vencer).
  deals: ["contract_id", "renewal_for"],
};

/**
 * Quita los campos protegidos del cuerpo (objeto o lista de objetos). Si el
 * cuerpo no es JSON se devuelve tal cual: PostgREST lo rechazará.
 */
export const quitarCamposProtegidos = (
  recurso: string,
  cuerpo: string,
): string => {
  const campos = CAMPOS_PROTEGIDOS[recurso];
  if (!campos?.length || !cuerpo) return cuerpo;
  let datos: unknown;
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    return cuerpo;
  }
  const limpiar = (fila: unknown) => {
    if (fila && typeof fila === "object" && !Array.isArray(fila)) {
      for (const campo of campos) {
        delete (fila as Record<string, unknown>)[campo];
      }
    }
    return fila;
  };
  const limpio = Array.isArray(datos) ? datos.map(limpiar) : limpiar(datos);
  return JSON.stringify(limpio);
};

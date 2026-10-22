/**
 * A quién le toca el correo de una acción masiva, y por qué los demás se
 * quedan fuera.
 *
 * Está separado del acceso a datos a propósito: decidir a quién se le escribe
 * es la parte que importa y la que hay que poder probar sin una base de
 * datos. La ruta se encarga de leer las filas y de encolar.
 *
 * Lo valioso de un envío de miles no es el contador, es el desglose: saber
 * que 1.256 se quedaron fuera porque el correo publicado es el de un tercero
 * cambia lo que haces después; un «87 %» no.
 */

/** Por qué una oportunidad no recibe el correo. */
export type MotivoOmitido =
  /** La oportunidad no tiene ningún contacto ligado: no hay a quién escribir. */
  | "sin-contacto"
  /** El contacto no tiene correo. */
  | "sin-correo"
  /**
   * Ya hay un correo de esa plantilla para esa oportunidad, enviado o en
   * cola. Es lo que hace que repetir la acción no mande dos veces.
   */
  | "ya-encolado";

export interface OportunidadParaEnvio {
  id: number;
  contact_ids: number[] | null;
}

export interface Reparto {
  /** Lo que se va a encolar, en el orden en que se pidió. */
  aEncolar: { dealId: number; contactId: number }[];
  /** Motivo -> cuántas. Solo aparecen los motivos que ocurrieron. */
  omitidos: Partial<Record<MotivoOmitido, number>>;
}

/**
 * @param oportunidades Las que caen en el encargo.
 * @param contactosConCorreo Ids de contactos que tienen al menos un correo.
 * @param oportunidadesYaEncoladas Ids con un correo de esa misma plantilla,
 *   enviado o pendiente.
 */
export const repartirDestinatarios = (
  oportunidades: OportunidadParaEnvio[],
  contactosConCorreo: ReadonlySet<number>,
  oportunidadesYaEncoladas: ReadonlySet<number>,
): Reparto => {
  const aEncolar: Reparto["aEncolar"] = [];
  const omitidos: Reparto["omitidos"] = {};
  const sumar = (motivo: MotivoOmitido) => {
    omitidos[motivo] = (omitidos[motivo] ?? 0) + 1;
  };

  for (const oportunidad of oportunidades) {
    const contactId = oportunidad.contact_ids?.[0];
    if (contactId == null) {
      sumar("sin-contacto");
      continue;
    }
    // Antes que «sin correo»: si ya se encoló, es que correo tenía.
    if (oportunidadesYaEncoladas.has(oportunidad.id)) {
      sumar("ya-encolado");
      continue;
    }
    if (!contactosConCorreo.has(contactId)) {
      sumar("sin-correo");
      continue;
    }
    aEncolar.push({ dealId: oportunidad.id, contactId });
  }

  return { aEncolar, omitidos };
};

/**
 * A qué teléfono del contacto se le escribe por WhatsApp.
 *
 * Al marcado como móvil, si lo hay: WhatsApp solo vive en celulares, y en
 * México ya no se distingue un móvil de un fijo mirando el número (desde la
 * marcación homologada de 2019 todos tienen 10 dígitos). Si ninguno está
 * marcado, al primero, como se hacía antes: bloquear el envío dejaría sin
 * WhatsApp a casi toda una base que aún no ha marcado sus móviles. En ese
 * caso `esMovil` es false y el diálogo lo avisa.
 *
 * Compartido por el servidor (que envía) y el diálogo (que enseña a qué
 * número va): así lo que se ve es exactamente a donde llega.
 */

/** El `type` con que la ficha marca un móvil (ver ContactInputs). */
export const TIPO_MOVIL = "Mobile";

export interface TelefonoDeLaFicha {
  number?: string | null;
  type?: string | null;
}

export interface TelefonoParaWhatsapp {
  numero: string;
  esMovil: boolean;
}

export function telefonoParaWhatsapp(
  telefonos: TelefonoDeLaFicha[] | null | undefined,
): TelefonoParaWhatsapp | null {
  const conNumero = (telefonos ?? []).filter(
    (telefono) => typeof telefono?.number === "string" && telefono.number.trim(),
  );
  const movil = conNumero.find((telefono) => telefono.type === TIPO_MOVIL);
  const elegido = movil ?? conNumero[0];
  return elegido
    ? { numero: (elegido.number as string).trim(), esMovil: Boolean(movil) }
    : null;
}

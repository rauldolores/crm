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

/**
 * Código de país que se asume para un número de 10 dígitos escrito sin él.
 * Vinqulia se vende en México (MXN, SAT, CFDI), donde todos los números
 * tienen 10 dígitos, y así los teclea la gente en la ficha. Sin esto,
 * «5512345678» salía como «+5512345678», que es un número de Brasil: el
 * mensaje no le llegaba al contacto, o le llegaba a otra persona.
 */
const CODIGO_DE_PAIS_POR_DEFECTO = "+52";
const DIGITOS_DE_UN_NUMERO_NACIONAL = 10;

/**
 * Normaliza a dígitos + signo `+` (formato E.164, el que usa Twilio). Lo que
 * ya trae `+` o un código de país se respeta tal cual; solo un número
 * nacional de 10 dígitos recibe el código de México.
 */
export function normalizarTelefono(numero: string): string {
  const limpio = numero.replace(/[^\d+]/g, "");
  if (limpio.startsWith("+")) return limpio;
  return limpio.length === DIGITOS_DE_UN_NUMERO_NACIONAL
    ? `${CODIGO_DE_PAIS_POR_DEFECTO}${limpio}`
    : `+${limpio}`;
}

/**
 * Enlace que abre el chat con ese número en el WhatsApp de quien lo pulsa
 * (la app del teléfono o WhatsApp Web). wa.me quiere el número internacional
 * sin `+`.
 */
export function enlaceDeWhatsapp(numero: string): string {
  return `https://wa.me/${normalizarTelefono(numero).slice(1)}`;
}

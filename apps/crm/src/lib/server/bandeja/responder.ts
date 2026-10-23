/**
 * Cómo se arma la respuesta a una conversación: asunto con «Re:» y las
 * cabeceras de hilo que hacen que el programa de correo del cliente la
 * muestre dentro de la misma conversación (y que su siguiente respuesta
 * vuelva a encontrar la nuestra).
 */

export const asuntoDeRespuesta = (asunto: string | null | undefined): string => {
  const limpio = (asunto ?? "").trim();
  if (!limpio) return "Re:";
  return /^re\s*:/i.test(limpio) ? limpio : `Re: ${limpio}`;
};

export interface UltimoMensaje {
  message_id: string | null;
  reference_ids: string[] | null;
}

/** In-Reply-To y References para contestar al último mensaje recibido. */
export const cabecerasDeHilo = (
  ultimo: UltimoMensaje | null,
): Record<string, string> | undefined => {
  if (!ultimo?.message_id) return undefined;
  // RFC 5322: References = las del mensaje citado + su propio Message-ID.
  // Se recorta por delante si crece demasiado: algunos servidores rechazan
  // cabeceras enormes, y lo que importa para el hilo es el final.
  const referencias = [...(ultimo.reference_ids ?? []), ultimo.message_id]
    .filter((id, i, todos) => todos.indexOf(id) === i)
    .slice(-20);
  return {
    "In-Reply-To": ultimo.message_id,
    References: referencias.join(" "),
  };
};

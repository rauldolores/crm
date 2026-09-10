export interface TicketSubjectParsed {
  /** El asunto sin los prefijos "[...]" iniciales. */
  title: string;
  /** Las etiquetas extraídas, en el orden en que aparecían. */
  tags: string[];
}

const PREFIJO = /^\s*\[([^\]]+)\]\s*/;

/**
 * Cuántos prefijos "[...]" se admiten como máximo. Los tickets que abre el
 * agente de voz solo traen dos (categoría y motivo corto), pero el asunto es
 * texto libre de un sistema externo: sin este límite, un asunto degenerado
 * podría generar una fila entera de etiquetas.
 */
const MAX_ETIQUETAS = 6;

/**
 * Separa los prefijos "[categoría] [motivo]" que anteponen los tickets
 * abiertos automáticamente (agente de voz, formularios, integraciones) del
 * título real. Un ticket creado a mano en el CRM no lleva ninguno y se
 * devuelve tal cual.
 *
 * @example
 * parseTicketSubject("[other] [Prefiere ayuda humana] Zuriel prefiere...")
 * // => { tags: ["other", "Prefiere ayuda humana"], title: "Zuriel prefiere..." }
 */
export function parseTicketSubject(subject: string): TicketSubjectParsed {
  let resto = subject;
  const tags: string[] = [];
  let match = resto.match(PREFIJO);

  while (match && tags.length < MAX_ETIQUETAS) {
    tags.push(match[1].trim());
    resto = resto.slice(match[0].length);
    match = resto.match(PREFIJO);
  }

  // Si no quedó nada legible después de quitar los prefijos (asunto que es
  // solo corchetes), se conserva el original en vez de mostrar un título vacío.
  const title = resto.trim() || subject;
  return { title, tags };
}

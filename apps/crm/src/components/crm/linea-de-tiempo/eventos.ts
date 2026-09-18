import {
  Archive,
  ArrowRightLeft,
  CheckSquare,
  FileText,
  FileCheck,
  FileX,
  Handshake,
  ListTodo,
  Ticket,
  TicketCheck,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Identifier } from "ra-core";

import { getActivityTypeIcon } from "../notes/noteModel";

/** Una fila de la vista crm.contact_timeline. */
export interface EventoDeLaLinea {
  id: string;
  kind: "note" | "task" | "deal" | "ticket" | "quote";
  type: string;
  source_id: Identifier;
  contact_id: Identifier;
  company_id: Identifier | null;
  date: string;
  sales_id: Identifier | null;
  title: string | null;
  text: string | null;
  status: string | null;
  attachment_count: number;
  amount: number | null;
}

/** Filtro de la línea de tiempo: por familia o por tipo de nota. */
export type FiltroDeLaLinea =
  | { todo: true }
  | { kind: EventoDeLaLinea["kind"] }
  | { type: string };

const ICONOS_POR_TIPO: Record<string, ComponentType<{ className?: string }>> = {
  task: ListTodo,
  task_done: CheckSquare,
  deal: Handshake,
  deal_stage: ArrowRightLeft,
  deal_archived: Archive,
  ticket: Ticket,
  ticket_closed: TicketCheck,
  quote: FileText,
  quote_accepted: FileCheck,
  quote_rejected: FileX,
};

export const iconoDelEvento = (
  evento: Pick<EventoDeLaLinea, "kind" | "type">,
): ComponentType<{ className?: string }> =>
  evento.kind === "note"
    ? getActivityTypeIcon(evento.type)
    : (ICONOS_POR_TIPO[evento.type] ?? FileText);

/** Clave de traducción de la etiqueta de un evento que no es nota. */
export const claveDeEtiqueta = (
  evento: Pick<EventoDeLaLinea, "kind" | "type" | "status">,
): string => {
  if (evento.type === "deal_archived") {
    return evento.status === "won"
      ? "crm.timeline.events.deal_won"
      : "crm.timeline.events.deal_archived";
  }
  return `crm.timeline.events.${evento.type}`;
};

const MAX_RESUMEN = 160;

/**
 * Primera línea con contenido, sin marcas de Markdown, recortada para que
 * una fila de la línea de tiempo quepa en una línea de texto.
 */
export const resumenDe = (texto: string | null | undefined): string => {
  if (!texto) return "";
  const primera = lineasLimpias(texto)[0] ?? "";
  return primera.length > MAX_RESUMEN
    ? `${primera.slice(0, MAX_RESUMEN).trimEnd()}…`
    : primera;
};

/** Las líneas con contenido de una nota, sin marcas de Markdown. */
const lineasLimpias = (texto: string): string[] =>
  texto
    .split(/\r?\n/)
    .map((linea) =>
      linea
        .replace(/^[#>*\-+\s]+/, "")
        .replace(/[*_`~]/g, "")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .trim(),
    )
    .filter((linea) => linea.length > 0);

const CONTEXTO_DEL_FRAGMENTO = 60;

/**
 * Al buscar, la fila muestra el trozo de la nota donde aparece lo buscado
 * (con algo de contexto a cada lado) en vez de su primera línea: una
 * coincidencia en el párrafo tres de una nota larga no serviría de nada si
 * solo se viera el título. Sin coincidencia, cae en el resumen normal.
 */
export const fragmentoCon = (
  texto: string | null | undefined,
  busqueda: string,
): string => {
  if (!texto) return "";
  const plano = lineasLimpias(texto).join(" ");
  const posicion = plano.toLowerCase().indexOf(busqueda.toLowerCase());
  if (posicion < 0 || !busqueda) return resumenDe(texto);
  // La ventana se ajusta a palabras enteras: «…lamada de» no se lee bien.
  let inicio = Math.max(0, posicion - CONTEXTO_DEL_FRAGMENTO);
  if (inicio > 0) {
    const espacio = plano.indexOf(" ", inicio);
    if (espacio >= 0 && espacio < posicion) inicio = espacio + 1;
  }
  let fin = Math.min(
    plano.length,
    posicion + busqueda.length + CONTEXTO_DEL_FRAGMENTO,
  );
  if (fin < plano.length) {
    const espacio = plano.lastIndexOf(" ", fin);
    if (espacio > posicion + busqueda.length) fin = espacio;
  }
  return `${inicio > 0 ? "…" : ""}${plano.slice(inicio, fin).trim()}${
    fin < plano.length ? "…" : ""
  }`;
};

/** «septiembre de 2026»: la cabecera de cada grupo de la cronología. */
export const mesDe = (fecha: string): string => {
  const etiqueta = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
};

/** Agrupa una lista ya ordenada por fecha descendente en bloques por mes. */
export const agruparPorMes = <T extends { date: string }>(
  eventos: T[],
): { mes: string; eventos: T[] }[] => {
  const grupos: { mes: string; eventos: T[] }[] = [];
  for (const evento of eventos) {
    const mes = mesDe(evento.date);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.mes === mes) ultimo.eventos.push(evento);
    else grupos.push({ mes, eventos: [evento] });
  }
  return grupos;
};

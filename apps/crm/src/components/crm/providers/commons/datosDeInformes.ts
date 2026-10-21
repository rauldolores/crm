import type { Deal, Quote, Task, Ticket, TicketEvent } from "../../types";

/**
 * Lo que necesita la página de Informes, de una sola vez y SIN tope de
 * filas: antes cada lista se pedía con `perPage: 1000`, así que con más de
 * mil oportunidades las cifras salían solo de las mil más recientes.
 *
 * De las tablas grandes (oportunidades, tareas, notas) viajan solo las
 * columnas que usan los cálculos.
 */
export type OportunidadDeInforme = Pick<
  Deal,
  | "id"
  | "stage"
  | "pipeline"
  | "amount"
  | "sales_id"
  | "created_at"
  | "updated_at"
  | "archived_at"
  | "expected_closing_date"
  | "loss_reason"
>;

export type TareaDeInforme = Pick<
  Task,
  "id" | "sales_id" | "due_date" | "done_date"
>;

/** Una nota (de contacto o de oportunidad): quién y cuándo. */
export interface NotaDeInforme {
  sales_id: Deal["sales_id"] | null;
  date: string;
}

export interface DatosDeInformes {
  oportunidades: OportunidadDeInforme[];
  cotizaciones: Quote[];
  tickets: Ticket[];
  /** Cambios de estado que salen de «cerrado». */
  reaperturas: TicketEvent[];
  tareas: TareaDeInforme[];
  notas: NotaDeInforme[];
}

/** Columnas de cada tabla que se piden para los informes. */
export const COLUMNAS_DE_INFORMES = {
  deals:
    "id, stage, pipeline, amount, sales_id, created_at, updated_at, archived_at, expected_closing_date, loss_reason",
  tasks: "id, sales_id, due_date, done_date",
  notas: "sales_id, date",
} as const;

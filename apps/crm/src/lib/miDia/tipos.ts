import type { ResultadoDeMiDia } from "./etapas";

/** Lo que «Mi día» necesita de un contacto para ofrecer sus canales. */
export interface ContactoDeMiDia {
  id: number;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company_id: number | null;
  email_jsonb: { email: string; type?: string }[] | null;
  phone_jsonb: { number: string; type?: string }[] | null;
}

/** Una fila de la cola: una tarea que toca hoy o un prospecto nuevo. */
export interface FilaDeMiDia {
  clave: string;
  tarea: {
    id: number;
    text: string | null;
    type: string | null;
    due_date: string | null;
  } | null;
  contacto: ContactoDeMiDia | null;
  empresa: { id: number; name: string } | null;
  oportunidad: {
    id: number;
    name: string;
    stage: string;
    pipeline: string;
  } | null;
}

export interface ColaDeMiDia {
  /** El embudo de los prospectos nuevos (el pedido o el sugerido). */
  embudo: string | null;
  tareas: FilaDeMiDia[];
  nuevos: FilaDeMiDia[];
  /** Tareas abiertas vencidas antes de hoy (todas, no solo las listadas). */
  vencidas: number;
  /** Cuántos siguen en la primera etapa del embudo, sin tocar. */
  porContactar: number;
  /** Notas que dejó hoy quien mira: una por prospecto trabajado. */
  trabajadosHoy: number;
}

export interface PeticionDeResultado {
  dealId?: number | null;
  contactId?: number | null;
  tareaId?: number | null;
  /** El canal usado (tipo de nota): whatsapp, email, call… */
  canal?: string | null;
  nota?: string | null;
  resultado: ResultadoDeMiDia;
}

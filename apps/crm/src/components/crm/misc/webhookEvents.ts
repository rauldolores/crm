/**
 * Recursos que emiten webhooks y eventos que puede emitir cada uno.
 *
 * Es la lista que se muestra en la documentación Y la que alimenta el
 * selector de eventos: una sola fuente para que no se desincronicen. Debe
 * coincidir con los disparadores `notify_webhooks_*` de
 * supabase/schemas/04_triggers.sql — si se añade uno allí, se añade aquí.
 */

export const RECURSOS_NOTIFICABLES = [
  "contacts",
  "companies",
  "deals",
  "tasks",
  "contact_notes",
  "deal_notes",
  "tickets",
  "ticket_notes",
] as const;

export type RecursoNotificable = (typeof RECURSOS_NOTIFICABLES)[number];

export const ACCIONES_NOTIFICABLES = ["created", "updated", "deleted"] as const;

export type AccionNotificable = (typeof ACCIONES_NOTIFICABLES)[number];

/** "contacts.created", "contacts.updated"… para un recurso. */
export const eventosDeRecurso = (recurso: string): string[] =>
  ACCIONES_NOTIFICABLES.map((accion) => `${recurso}.${accion}`);

/** Todos los eventos posibles, en el orden en que se muestran. */
export const TODOS_LOS_EVENTOS: string[] =
  RECURSOS_NOTIFICABLES.flatMap(eventosDeRecurso);

import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Fecha de vencimiento corta para la fila compacta de una tarea.
 *
 * "vence 12/10/2026, 9:00:00" obligaba a hacer la cuenta mental; "hace 9 d"
 * dice de un vistazo cuánto se ha pasado. La fecha completa queda en el
 * `title` de la fila.
 */
export const formatDueLabel = (
  dueDate: string,
  now: Date = new Date(),
): string => {
  const date = new Date(dueDate);
  const days = differenceInCalendarDays(date, now);
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;

  if (days === 0) return hasTime ? `hoy, ${format(date, "H:mm")}` : "hoy";
  if (days === 1) return "mañana";
  if (days === -1) return "ayer";
  if (days < 0) return `hace ${-days} d`;
  if (days < 7) return `en ${days} d`;
  return format(date, "d MMM", { locale: es });
};

export const formatDueTitle = (dueDate: string): string =>
  format(new Date(dueDate), "PPPp", { locale: es });

import { startOfToday } from "date-fns/startOfToday";
import { endOfToday } from "date-fns/endOfToday";
import { endOfTomorrow } from "date-fns/endOfTomorrow";
import { endOfWeek } from "date-fns/endOfWeek";

import { getDay, isAfter } from "date-fns";

export const isBeforeFriday = () => getDay(new Date()) < 5; // Friday is represented by 5

type Task = {
  due_date?: string | null;
  done_date?: string | null;
  sales_id?: string | number | null;
};

export const isDone = (task: Task) => task.done_date != null;

// A task is recently done if it was marked as done less than 5 minutes ago
// useful to keep recently done tasks in the list to avoid flickering when a task is marked as done while the user is consulting the list of tasks. It gives a chance to the user to see that the task was marked as done and then it will disappear after 5 minutes.
export const isRecentlyDone = (task: Task) =>
  task.done_date != null &&
  isAfter(new Date(task.done_date), new Date(Date.now() - 5 * 60 * 1000));

type DueDate = string | null | undefined;

/**
 * Una tarea sin fecha de vencimiento no es una tarea vencida.
 *
 * Antes se pasaba el nulo directamente a `new Date()`, que lo interpreta como
 * el 1 de enero de 1970: las tareas sin fecha aparecian como vencidas hace
 * medio siglo. Ahora tienen su propio grupo.
 */
export const hasNoDueDate = (dateString: DueDate) => !dateString;

export const isOverdue = (dateString: DueDate) => {
  if (!dateString) return false;
  return new Date(dateString) < startOfToday();
};

export const isDueToday = (dateString: DueDate) => {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  return dueDate >= startOfToday() && dueDate < endOfToday();
};

export const isDueTomorrow = (dateString: DueDate) => {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  return dueDate >= endOfToday() && dueDate < endOfTomorrow();
};

export const isDueThisWeek = (dateString: DueDate) => {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  return (
    dueDate >= endOfTomorrow() &&
    dueDate < endOfWeek(new Date(), { weekStartsOn: 0 })
  );
};

export const isDueLater = (dateString: DueDate) => {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  return dueDate >= endOfWeek(new Date(), { weekStartsOn: 0 });
};

/**
 * Tareas que le tocan al comercial que ha iniciado sesion.
 *
 * Incluye deliberadamente las que no tienen responsable (`sales_id` nulo).
 * Todo lo que se escribe por el puente `/api/datos` o por el servidor MCP
 * llega asi, porque el disparador que rellenaba `sales_id` se apoya en
 * `auth.uid()` y el servidor consulta con la clave de servicio. Filtrando solo
 * por `sales_id` esas tareas existian en la base pero no se veian en ninguna
 * pantalla.
 */
export const isAssignedToOrUnassigned = (
  task: Task,
  salesId: string | number | undefined,
) => task.sales_id == null || String(task.sales_id) === String(salesId);

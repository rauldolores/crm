import { useListContext } from "ra-core";

import { Task } from "./Task";
import { isDone, isRecentlyDone } from "./tasksPredicate";

export const TasksIterator = ({
  showContact,
  className,
}: {
  showContact?: boolean;
  className?: string;
}) => {
  const { data, error, isPending } = useListContext();
  if (isPending || error || data.length === 0) return null;

  // Keep only tasks that are not done or done less than 5 minutes ago
  const tasks = data.filter((task) => !isDone(task) || isRecentlyDone(task));

  return (
    // @container: la fila decide qué columnas caben por el ancho de la lista
    // (ficha del contacto, panel, página de tareas), no por el de la pantalla.
    <div className={`@container divide-y divide-border ${className || ""}`}>
      {tasks.map((task) => (
        <Task task={task} showContact={showContact} key={task.id} />
      ))}
    </div>
  );
};

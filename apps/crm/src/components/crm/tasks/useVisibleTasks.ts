import { useMemo } from "react";
import { type Identifier, useGetIdentity, useGetList } from "ra-core";

import type { Task } from "../types";
import {
  isAssignedToOrUnassigned,
  isDone,
  isRecentlyDone,
} from "./tasksPredicate";

/**
 * Tareas que debe ver el comercial que ha iniciado sesion, o las de un
 * contacto concreto si se pasa `filterByContact`.
 *
 * El reparto por comercial se hace en el navegador y no en la consulta. El
 * puente ya limita la tabla a la organizacion activa, el volumen de una pyme
 * cabe de sobra en una peticion, y asi la regla de "mias o sin asignar" vive
 * en un unico sitio (`isAssignedToOrUnassigned`) en lugar de repetirse en cada
 * proveedor de datos.
 */
export const useVisibleTasks = ({
  filterByContact,
  includeDone = false,
}: {
  filterByContact?: Identifier;
  includeDone?: boolean;
} = {}) => {
  const { identity } = useGetIdentity();

  const { data, isPending, error } = useGetList<Task>(
    "tasks",
    {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "due_date", order: "ASC" },
      filter: filterByContact != null ? { contact_id: filterByContact } : {},
    },
    { enabled: filterByContact != null ? true : !!identity },
  );

  const tasks = useMemo(() => {
    const propias = (data ?? []).filter((task) =>
      filterByContact != null
        ? true
        : isAssignedToOrUnassigned(task, identity?.id),
    );
    if (includeDone) return propias;
    return propias.filter((task) => !isDone(task) || isRecentlyDone(task));
  }, [data, filterByContact, identity?.id, includeDone]);

  return { tasks, isPending, error };
};

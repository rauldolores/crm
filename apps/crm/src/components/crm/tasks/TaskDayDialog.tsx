import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ResourceContextProvider, useTranslate } from "ra-core";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Task as TData } from "../types";
import { Task } from "./Task";

/**
 * El "zoom" de un dia del calendario: la rejilla mensual solo cabe para
 * anunciar que hay tareas, y este dialogo es donde se leen enteras y se pueden
 * marcar, aplazar o editar sin salir del calendario.
 */
export const TaskDayDialog = ({
  day,
  tasks,
  open,
  onOpenChange,
}: {
  day: Date | null;
  tasks: TData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const translate = useTranslate();

  if (!day) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-2xl max-h-9/10 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="first-letter:uppercase">
            {format(day, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.tasks.calendar.day_count", {
              smart_count: tasks.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <ResourceContextProvider value="tasks">
          <div className="flex flex-col gap-4 pt-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {translate("resources.tasks.calendar.day_empty")}
              </p>
            ) : (
              tasks.map((task) => (
                <Task key={task.id} task={task} showContact />
              ))
            )}
          </div>
        </ResourceContextProvider>
      </DialogContent>
    </Dialog>
  );
};

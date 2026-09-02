import { CalendarDays, CheckSquare, List } from "lucide-react";
import { useTranslate } from "ra-core";
import { useSearchParams } from "react-router";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { AddTask } from "./AddTask";
import { TasksCalendar } from "./TasksCalendar";
import { TasksListByDueDate } from "./TasksListByDueDate";
import { useVisibleTasks } from "./useVisibleTasks";

type Vista = "lista" | "calendario";

/**
 * Pagina de Tareas.
 *
 * El panel de inicio solo resume las proximas; aqui esta el listado completo y
 * la misma informacion vista como mes. La vista elegida viaja en la URL para
 * que un enlace al calendario siga abriendo el calendario.
 */
export const TaskList = () => {
  const translate = useTranslate();
  const [searchParams, setSearchParams] = useSearchParams();

  const vista: Vista =
    searchParams.get("vista") === "calendario" ? "calendario" : "lista";
  const mostrarCompletadas = searchParams.get("completadas") === "1";

  const actualizarParametro = (clave: string, valor: string | null) => {
    const siguiente = new URLSearchParams(searchParams);
    if (valor == null) siguiente.delete(clave);
    else siguiente.set(clave, valor);
    setSearchParams(siguiente, { replace: true });
  };

  const { tasks } = useVisibleTasks({ includeDone: mostrarCompletadas });

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CheckSquare className="size-5" />
        </div>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">
          {translate("resources.tasks.name", { smart_count: 2 })}
        </h1>

        <div className="flex items-center gap-2">
          <Switch
            id="mostrar-completadas"
            checked={mostrarCompletadas}
            onCheckedChange={(activo) =>
              actualizarParametro("completadas", activo ? "1" : null)
            }
          />
          <Label
            htmlFor="mostrar-completadas"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            {translate("resources.tasks.show_done")}
          </Label>
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          value={vista}
          onValueChange={(valor) =>
            valor && actualizarParametro("vista", valor)
          }
        >
          <ToggleGroupItem
            value="lista"
            aria-label={translate("resources.tasks.views.list")}
          >
            <List className="size-4" />
            <span className="ml-1 hidden sm:inline">
              {translate("resources.tasks.views.list")}
            </span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="calendario"
            aria-label={translate("resources.tasks.views.calendar")}
          >
            <CalendarDays className="size-4" />
            <span className="ml-1 hidden sm:inline">
              {translate("resources.tasks.views.calendar")}
            </span>
          </ToggleGroupItem>
        </ToggleGroup>

        <AddTask display="icon" selectContact />
      </div>

      {vista === "calendario" ? (
        <TasksCalendar tasks={tasks} />
      ) : (
        <Card className="p-4">
          <TasksListByDueDate
            perPage={25}
            includeDone={mostrarCompletadas}
            emptyPlaceholder={
              <p className="text-sm text-muted-foreground">
                {translate("resources.tasks.empty_list_hint")}
              </p>
            }
          />
        </Card>
      )}
    </div>
  );
};

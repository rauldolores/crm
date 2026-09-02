import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslate } from "ra-core";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { Task } from "../types";
import { isDone, isOverdue } from "./tasksPredicate";
import { TaskDayDialog } from "./TaskDayDialog";

const OPCIONES_DE_SEMANA = { weekStartsOn: 1 } as const; // la semana empieza en lunes

/** Clave estable por dia local, para agrupar sin depender de la zona horaria. */
const claveDeDia = (fecha: Date) => format(fecha, "yyyy-MM-dd");

const ChipDeTarea = ({ task }: { task: Task }) => {
  const completada = isDone(task);
  const vencida = !completada && isOverdue(task.due_date);
  return (
    <span
      className={[
        "block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight",
        completada
          ? "bg-muted text-muted-foreground line-through"
          : vencida
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
      ].join(" ")}
      title={task.text}
    >
      {task.due_date ? `${format(new Date(task.due_date), "HH:mm")} ` : ""}
      {task.text}
    </span>
  );
};

/**
 * Vista mensual de las tareas.
 *
 * La rejilla no intenta mostrar la tarea entera —en una celda de mes no cabe—:
 * ensena las primeras y cuantas quedan, y el detalle se abre al pulsar el dia.
 */
export const TasksCalendar = ({ tasks }: { tasks: Task[] }) => {
  const translate = useTranslate();
  const [mesVisible, setMesVisible] = useState(() => startOfMonth(new Date()));
  const [diaAbierto, setDiaAbierto] = useState<Date | null>(null);

  const dias = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(mesVisible), OPCIONES_DE_SEMANA),
        end: endOfWeek(endOfMonth(mesVisible), OPCIONES_DE_SEMANA),
      }),
    [mesVisible],
  );

  const tareasPorDia = useMemo(() => {
    const mapa = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const clave = claveDeDia(new Date(task.due_date));
      mapa.set(clave, [...(mapa.get(clave) ?? []), task]);
    }
    return mapa;
  }, [tasks]);

  const sinFecha = useMemo(
    () => tasks.filter((task) => !task.due_date),
    [tasks],
  );

  const tareasDelDiaAbierto = diaAbierto
    ? (tareasPorDia.get(claveDeDia(diaAbierto)) ?? [])
    : [];

  const nombresDeDia = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(new Date(), OPCIONES_DE_SEMANA),
        end: endOfWeek(new Date(), OPCIONES_DE_SEMANA),
      }).map((dia) => format(dia, "EEEEEE", { locale: es })),
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-lg font-semibold tracking-tight first-letter:uppercase">
          {format(mesVisible, "LLLL yyyy", { locale: es })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMesVisible(startOfMonth(new Date()))}
        >
          {translate("resources.tasks.calendar.today")}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={translate("resources.tasks.calendar.previous_month")}
          onClick={() => setMesVisible((mes) => subMonths(mes, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={translate("resources.tasks.calendar.next_month")}
          onClick={() => setMesVisible((mes) => addMonths(mes, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {nombresDeDia.map((nombre) => (
            <div
              key={nombre}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {nombre}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const delDia = tareasPorDia.get(claveDeDia(dia)) ?? [];
            const pendientes = delDia.filter((task) => !isDone(task));
            const delMes = isSameMonth(dia, mesVisible);
            const hoy = isToday(dia);
            return (
              <button
                key={dia.toISOString()}
                type="button"
                onClick={() => setDiaAbierto(startOfDay(dia))}
                aria-label={format(dia, "d 'de' MMMM", { locale: es })}
                className={[
                  "flex min-h-24 flex-col gap-1 border-b border-r p-1.5 text-left transition-colors last:border-r-0 hover:bg-accent",
                  delMes ? "" : "bg-muted/30 text-muted-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                    hoy
                      ? "bg-primary font-semibold text-primary-foreground"
                      : delMes
                        ? "font-medium"
                        : "",
                  ].join(" ")}
                >
                  {format(dia, "d")}
                </span>

                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {delDia.slice(0, 3).map((task) => (
                    <ChipDeTarea key={task.id} task={task} />
                  ))}
                  {delDia.length > 3 && (
                    <span className="px-1.5 text-[11px] text-muted-foreground">
                      {translate("resources.tasks.calendar.more", {
                        smart_count: delDia.length - 3,
                      })}
                    </span>
                  )}
                </div>

                {pendientes.length > 0 && delDia.length <= 3 && (
                  <span className="sr-only">{pendientes.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {sinFecha.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {translate("resources.tasks.filters.no_due_date")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sinFecha.map((task) => (
              <span
                key={task.id}
                className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs"
                title={task.text}
              >
                {task.text}
              </span>
            ))}
          </div>
        </Card>
      )}

      <TaskDayDialog
        day={diaAbierto}
        tasks={tareasDelDiaAbierto}
        open={diaAbierto != null}
        onOpenChange={(abierto) => !abierto && setDiaAbierto(null)}
      />
    </div>
  );
};

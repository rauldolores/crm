import { useMemo } from "react";
import { type Identifier, useTimeout, useTranslate } from "ra-core";
import { useIsMobile } from "@/hooks/use-mobile";

import { TaskListFilter } from "./TasksListFilter";
import { useVisibleTasks } from "./useVisibleTasks";
import {
  hasNoDueDate,
  isBeforeFriday,
  isDueLater,
  isDueThisWeek,
  isDueToday,
  isDueTomorrow,
  isOverdue,
} from "./tasksPredicate";

export const TasksListByDueDate = ({
  filterByContact,
  emptyPlaceholder,
  pendingPlaceholder,
  perPage,
  includeDone,
}: {
  filterByContact?: Identifier;
  emptyPlaceholder?: React.ReactNode;
  pendingPlaceholder?: React.ReactNode;
  /** Cuantas tareas se ven por grupo antes de "cargar mas". */
  perPage?: number;
  includeDone?: boolean;
}) => {
  const isMobile = useIsMobile();
  const translate = useTranslate();

  const { tasks: ongoingTasks, isPending } = useVisibleTasks({
    filterByContact,
    includeDone,
  });

  const showContact = filterByContact == null;

  const overdueTasks = useMemo(
    () => ongoingTasks.filter((task) => isOverdue(task.due_date)),
    [ongoingTasks],
  );

  const dueTodayTasks = useMemo(
    () => ongoingTasks.filter((task) => isDueToday(task.due_date)),
    [ongoingTasks],
  );

  const dueTomorrowTasks = useMemo(
    () => ongoingTasks.filter((task) => isDueTomorrow(task.due_date)),
    [ongoingTasks],
  );

  const dueThisWeekTasks = useMemo(
    () => ongoingTasks.filter((task) => isDueThisWeek(task.due_date)),
    [ongoingTasks],
  );

  const dueLaterTasks = useMemo(
    () => ongoingTasks.filter((task) => isDueLater(task.due_date)),
    [ongoingTasks],
  );

  const undatedTasks = useMemo(
    () => ongoingTasks.filter((task) => hasNoDueDate(task.due_date)),
    [ongoingTasks],
  );

  const oneSecondHasPassed = useTimeout(1000);

  if (isPending && oneSecondHasPassed) {
    return pendingPlaceholder ?? null;
  }

  if (isPending) {
    return null;
  }

  if (!ongoingTasks.length) {
    return emptyPlaceholder ?? null;
  }

  return (
    <div className="flex flex-col gap-4">
      <TaskListFilter
        tasks={overdueTasks}
        title={translate("resources.tasks.filters.overdue")}
        showContact={showContact}
        isMobile={isMobile}
        perPage={perPage}
      />
      <TaskListFilter
        tasks={dueTodayTasks}
        title={translate("resources.tasks.filters.today")}
        showContact={showContact}
        isMobile={isMobile}
        perPage={perPage}
      />
      <TaskListFilter
        tasks={dueTomorrowTasks}
        title={translate("resources.tasks.filters.tomorrow")}
        showContact={showContact}
        isMobile={isMobile}
        perPage={perPage}
      />
      {(!filterByContact || (filterByContact && isBeforeFriday())) && (
        <TaskListFilter
          tasks={dueThisWeekTasks}
          title={translate("resources.tasks.filters.this_week")}
          showContact={showContact}
          isMobile={isMobile}
          perPage={perPage}
        />
      )}
      <TaskListFilter
        tasks={dueLaterTasks}
        title={translate("resources.tasks.filters.later")}
        showContact={showContact}
        isMobile={isMobile}
        perPage={perPage}
      />
      <TaskListFilter
        tasks={undatedTasks}
        title={translate("resources.tasks.filters.no_due_date")}
        showContact={showContact}
        isMobile={isMobile}
        perPage={perPage}
      />
    </div>
  );
};

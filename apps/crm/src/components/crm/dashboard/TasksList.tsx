import { CheckSquare } from "lucide-react";
import { useTranslate } from "ra-core";
import { Card } from "@/components/ui/card";

import { AddTask } from "../tasks/AddTask";
import { TasksListContent } from "../tasks/TasksListContent";

export const TasksList = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CheckSquare className="size-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex-1">
          {translate("crm.dashboard.upcoming_tasks", {
            _: "Upcoming Tasks",
          })}
        </h2>
        <AddTask display="icon" selectContact />
      </div>
      <Card className="p-4 mb-2">
        <TasksListContent />
      </Card>
    </div>
  );
};

import { Clock } from "lucide-react";
import { useTranslate } from "ra-core";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

import { ActivityLog } from "../activity/ActivityLog";

export function DashboardActivityLog() {
  const isMobile = useIsMobile();
  const translate = useTranslate();
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4 md:mb-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Clock className="size-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {translate("crm.dashboard.latest_activity", {
            _: "Latest Activity",
          })}
        </h2>
      </div>
      {isMobile ? (
        <ActivityLog pageSize={10} />
      ) : (
        <Card className="mb-2 p-6">
          <ActivityLog pageSize={10} />
        </Card>
      )}
    </div>
  );
}

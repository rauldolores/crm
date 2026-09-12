import { LifeBuoy, Plus } from "lucide-react";
import { ListBase, useListContext, useTranslate } from "ra-core";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TicketsIterator } from "../tickets/TicketsIterator";
import type { Ticket } from "../types";

const MAXIMO = 5;

/**
 * Los tickets sin cerrar más recientes, en el panel. Un ticket abierto es un
 * cliente esperando: tiene que verse al entrar, no solo en /tickets.
 */
export const TicketsAbiertos = () => (
  <ListBase<Ticket>
    resource="tickets"
    perPage={MAXIMO}
    sort={{ field: "created_at", order: "DESC" }}
    filter={{ "status@neq": "closed" }}
    disableSyncWithLocation
    storeKey={false}
  >
    <Contenido />
  </ListBase>
);

const Contenido = () => {
  const translate = useTranslate();
  const { data, total, isPending } = useListContext<Ticket>();
  const abiertos = total ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LifeBuoy className="size-5" />
        </div>
        <h2 className="flex flex-1 items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          {translate("crm.dashboard.open_tickets")}
          {abiertos > 0 && (
            <span className="rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground tabular-nums">
              {abiertos}
            </span>
          )}
        </h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                asChild
              >
                <Link to="/tickets/create">
                  <Plus className="size-4 text-primary" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {translate("resources.tickets.action.create")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Card className="gap-2 px-4 py-3">
        {!isPending && abiertos === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            {translate("crm.dashboard.open_tickets_empty")}
          </p>
        ) : (
          <TicketsIterator showContact />
        )}
        {abiertos > (data?.length ?? 0) && (
          <Link
            to="/tickets"
            className="text-xs font-medium text-primary no-underline hover:underline"
          >
            {translate("crm.dashboard.open_tickets_all", { total: abiertos })}
          </Link>
        )}
      </Card>
    </div>
  );
};

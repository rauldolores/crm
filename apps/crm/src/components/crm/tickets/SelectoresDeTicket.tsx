import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import {
  useCreate,
  useGetIdentity,
  useGetList,
  useNotify,
  useRecordContext,
  useTranslate,
  useUpdate,
} from "ra-core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Sale, Ticket } from "../types";
import { CerrarTicketDialog } from "./CerrarTicketDialog";

const SIN_ASIGNAR = "__sin_asignar__";

/**
 * El historial lo escribe la base al modificar el ticket; la lista de
 * eventos en pantalla no se entera sola, así que se invalida su caché
 * después de cada cambio.
 */
const useRefrescarHistorial = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["ticket_events"] });
  };
};

/**
 * Estado del ticket editable en línea (lista y ficha). Pasar a «cerrado»
 * abre el diálogo de motivo; el resto de cambios se guardan al momento. La
 * fecha de cierre y el historial los sella la base.
 */
export const SelectorDeEstadoDeTicket = ({
  className,
}: {
  className?: string;
}) => {
  const record = useRecordContext<Ticket>();
  const { ticketStatuses } = useConfigurationContext();
  const [update, { isPending }] = useUpdate();
  const [create] = useCreate();
  const notify = useNotify();
  const refrescarHistorial = useRefrescarHistorial();
  const [cerrando, setCerrando] = useState(false);
  if (!record) return null;

  const cambiar = (status: string, extra: Partial<Ticket> = {}) =>
    update(
      "tickets",
      { id: record.id, data: { status, ...extra }, previousData: record },
      {
        onSuccess: refrescarHistorial,
        onError: () =>
          notify("resources.tickets.notifications.update_error", {
            type: "error",
          }),
      },
    );

  const handleValueChange = (value: string) => {
    if (value === record.status) return;
    if (value === "closed") {
      setCerrando(true);
      return;
    }
    cambiar(value);
  };

  const confirmarCierre = async (resolution: string, nota: string) => {
    await cambiar("closed", { resolution });
    if (nota) {
      await create("ticket_notes", {
        data: { ticket_id: record.id, text: nota, type: "note" },
      });
    }
    setCerrando(false);
  };

  return (
    <div
      className={className}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Select
        disabled={isPending}
        value={record.status}
        onValueChange={handleValueChange}
      >
        <SelectTrigger size="sm" className="border-none shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ticketStatuses.map((estado) => (
            <SelectItem key={estado.value} value={estado.value}>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: estado.color }}
                />
                {estado.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <CerrarTicketDialog
        open={cerrando}
        onOpenChange={setCerrando}
        onConfirm={confirmarCierre}
        guardando={isPending}
      />
    </div>
  );
};

/**
 * Responsable del ticket editable en línea, con «Asignármelo» a un clic:
 * es el gesto más frecuente al triar una cola de soporte.
 */
export const SelectorDeResponsableDeTicket = ({
  className,
  conAsignarme = true,
}: {
  className?: string;
  conAsignarme?: boolean;
}) => {
  const record = useRecordContext<Ticket>();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const [update, { isPending }] = useUpdate();
  const refrescarHistorial = useRefrescarHistorial();
  const { data: usuarios } = useGetList<Sale>("sales", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "first_name", order: "ASC" },
    filter: { "disabled@neq": true },
  });
  if (!record) return null;

  const asignar = (valor: string) => {
    const sales_id = valor === SIN_ASIGNAR ? null : Number(valor);
    if (sales_id === (record.sales_id ?? null)) return;
    update(
      "tickets",
      { id: record.id, data: { sales_id }, previousData: record },
      { onSuccess: refrescarHistorial },
    );
  };

  const esMio = identity?.id != null && record.sales_id === identity.id;

  return (
    <div
      className={"flex items-center gap-1 " + (className ?? "")}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Select
        disabled={isPending}
        value={record.sales_id != null ? String(record.sales_id) : SIN_ASIGNAR}
        onValueChange={asignar}
      >
        <SelectTrigger size="sm" className="border-none shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SIN_ASIGNAR}>
            <span className="text-muted-foreground">
              {translate("resources.tickets.unassigned")}
            </span>
          </SelectItem>
          {usuarios?.map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.first_name} {u.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {conAsignarme && !esMio && identity?.id != null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={isPending}
          onClick={() => asignar(String(identity.id))}
        >
          <UserRound className="size-3.5" />
          {translate("resources.tickets.action.assign_me")}
        </Button>
      )}
    </div>
  );
};

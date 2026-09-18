import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Merge } from "lucide-react";
import {
  useDataProvider,
  useGetList,
  useNotify,
  useRedirect,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Ticket } from "../types";
import { parseTicketSubject } from "./parseTicketSubject";

/**
 * Fusionar este ticket con otro abierto del mismo contacto. Las notas y el
 * historial del que se descarta pasan al que se conserva, y el descartado
 * se cierra como duplicado (crm.merge_tickets). Se elige cuál sobrevive: lo
 * habitual es conservar el más antiguo, que es el que el cliente conoce.
 */
export const FusionarTicketButton = ({ ticket }: { ticket: Ticket }) => {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);
  const { data: candidatos } = useGetList<Ticket>("tickets", {
    filter: {
      contact_id: ticket.contact_id,
      "id@neq": ticket.id,
      "status@neq": "closed",
    },
    sort: { field: "created_at", order: "ASC" },
    pagination: { page: 1, perPage: 50 },
  });
  if (ticket.status === "closed" || !candidatos?.length) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Merge className="size-4" />
        {translate("resources.tickets.merge.action")}
      </Button>
      <FusionarDialog
        key={ticket.id}
        open={open}
        onClose={() => setOpen(false)}
        ticket={ticket}
        candidatos={candidatos}
      />
    </>
  );
};

const etiqueta = (t: Ticket) =>
  `#${t.id} · ${parseTicketSubject(t.subject).title}`;

const FusionarDialog = ({
  open,
  onClose,
  ticket,
  candidatos,
}: {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  candidatos: Ticket[];
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider();
  const [otroId, setOtroId] = useState<string>(String(candidatos[0].id));
  const [conservar, setConservar] = useState<"este" | "otro">("este");
  const otro = candidatos.find((c) => String(c.id) === otroId);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!otro) return;
      const [perdedor, ganador] =
        conservar === "este" ? [otro.id, ticket.id] : [ticket.id, otro.id];
      await dataProvider.fusionarTickets(perdedor, ganador);
      return ganador;
    },
  });

  const fusionar = async () => {
    try {
      const ganador = await mutateAsync();
      notify("resources.tickets.merge.success", { type: "success" });
      void queryClient.invalidateQueries({ queryKey: ["ticket_notes"] });
      void queryClient.invalidateQueries({ queryKey: ["ticket_events"] });
      onClose();
      if (ganador != null && ganador !== ticket.id) {
        redirect("show", "tickets", ganador);
      } else {
        refresh();
      }
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.tickets.merge.error"),
        { type: "error" },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.tickets.merge.title")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.tickets.merge.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{translate("resources.tickets.merge.other")}</Label>
            <Select value={otroId} onValueChange={setOtroId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {candidatos.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {etiqueta(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{translate("resources.tickets.merge.keep")}</Label>
            <RadioGroup
              value={conservar}
              onValueChange={(v) => setConservar(v as "este" | "otro")}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="este" id="conservar-este" />
                <Label htmlFor="conservar-este" className="font-normal">
                  {etiqueta(ticket)}
                </Label>
              </div>
              {otro && (
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="otro" id="conservar-otro" />
                  <Label htmlFor="conservar-otro" className="font-normal">
                    {etiqueta(otro)}
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {translate("ra.action.cancel")}
          </Button>
          <Button onClick={fusionar} disabled={!otro || isPending}>
            {translate("resources.tickets.merge.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

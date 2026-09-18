import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleX, Mail, Send } from "lucide-react";
import {
  useDataProvider,
  useGetOne,
  useNotify,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Contact, Ticket } from "../types";
import { parseTicketSubject } from "./parseTicketSubject";

/**
 * Responder al cliente por correo sin salir del ticket. El asunto lleva
 * «[#id]» para que la respuesta del cliente se reconozca como parte del
 * ticket, y el correo queda como nota del ticket (y del contacto), lo que
 * sella la primera respuesta del SLA.
 */
export const ResponderPorCorreoButton = ({ ticket }: { ticket: Ticket }) => {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);
  const { data: contacto } = useGetOne<Contact>("contacts", {
    id: ticket.contact_id,
  });
  const correo = contacto?.email_jsonb?.[0]?.email;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!correo}
        title={
          correo ? undefined : translate("resources.tickets.reply.no_email")
        }
        onClick={() => setOpen(true)}
      >
        <Mail className="size-4" />
        {translate("resources.tickets.reply.action")}
      </Button>
      {correo && (
        <ResponderDialog
          open={open}
          onClose={() => setOpen(false)}
          ticket={ticket}
          correo={correo}
        />
      )}
    </>
  );
};

const ResponderDialog = ({
  open,
  onClose,
  ticket,
  correo,
}: {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
  correo: string;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider();
  const { title } = parseTicketSubject(ticket.subject);
  const [asunto, setAsunto] = useState(`[#${ticket.id}] ${title}`);
  const [texto, setTexto] = useState("");

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      dataProvider.enviarCorreo(ticket.contact_id, asunto, texto, ticket.id),
  });

  const enviar = async () => {
    try {
      await mutateAsync();
      notify("resources.tickets.reply.success", { type: "success" });
      void queryClient.invalidateQueries({ queryKey: ["ticket_notes"] });
      refresh();
      setTexto("");
      onClose();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.tickets.reply.error"),
        { type: "error" },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="md:min-w-lg max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.tickets.reply.title")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.contacts.send_email.to", { email: correo })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="respuesta-asunto">
              {translate("resources.contacts.send_email.subject")}
            </Label>
            <Input
              id="respuesta-asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="respuesta-texto">
              {translate("resources.contacts.send_email.message")}
            </Label>
            <Textarea
              id="respuesta-texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              maxLength={20000}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            <CircleX />
            {translate("resources.contacts.send_email.cancel")}
          </Button>
          <Button onClick={enviar} disabled={!asunto || !texto || isPending}>
            <Send />
            {isPending
              ? translate("resources.contacts.send_email.sending")
              : translate("resources.contacts.send_email.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

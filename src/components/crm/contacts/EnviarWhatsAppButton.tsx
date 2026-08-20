import { useState } from "react";
import { MessageCircle, CircleX, Send } from "lucide-react";
import {
  useDataProvider,
  useNotify,
  useRecordContext,
  useRefresh,
  useTranslate,
} from "ra-core";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Contact } from "../types";

/**
 * Envía un WhatsApp real al contacto (no solo una nota informativa) y deja
 * constancia en su ficha. Solo aparece si tiene un teléfono registrado.
 */
export const EnviarWhatsAppButton = () => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();
  const [open, setOpen] = useState(false);

  if (!record?.phone_jsonb?.[0]?.number) return null;

  return (
    <>
      <Button
        variant="outline"
        className="h-6 cursor-pointer"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="w-4 h-4" />
        {translate("resources.contacts.send_whatsapp.action")}
      </Button>
      <EnviarWhatsAppDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const EnviarWhatsAppDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const record = useRecordContext<Contact>();
  const notify = useNotify();
  const refresh = useRefresh();
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const [mensaje, setMensaje] = useState("");

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      await dataProvider.enviarWhatsapp(record!.id, mensaje);
    },
  });

  const handleClose = () => {
    setMensaje("");
    onClose();
  };

  const handleEnviar = async () => {
    try {
      await mutateAsync();
      notify("resources.contacts.send_whatsapp.success", { type: "success" });
      refresh();
      handleClose();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.contacts.send_whatsapp.error"),
        { type: "error" },
      );
    }
  };

  if (!record) return null;
  const telefonoDestino = record.phone_jsonb?.[0]?.number ?? "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="md:min-w-lg max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.contacts.send_whatsapp.action")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.contacts.send_whatsapp.to", {
              phone: telefonoDestino,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="texto-whatsapp">
            {translate("resources.contacts.send_whatsapp.message")}
          </Label>
          <Textarea
            id="texto-whatsapp"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={6}
            maxLength={4096}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            <CircleX />
            {translate("resources.contacts.send_whatsapp.cancel")}
          </Button>
          <Button onClick={handleEnviar} disabled={!mensaje || isPending}>
            <Send />
            {isPending
              ? translate("resources.contacts.send_whatsapp.sending")
              : translate("resources.contacts.send_whatsapp.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

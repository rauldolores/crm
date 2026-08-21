import { useState } from "react";
import { Mail, CircleX, Send } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Contact } from "../types";

/**
 * Envía un correo real al contacto (no solo una nota informativa) y deja
 * constancia en su ficha. Solo aparece si tiene un correo registrado.
 */
export const EnviarCorreoButton = () => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();
  const [open, setOpen] = useState(false);

  if (!record?.email_jsonb?.[0]?.email) return null;

  return (
    <>
      <Button
        variant="outline"
        className="h-6 cursor-pointer"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Mail className="w-4 h-4" />
        {translate("resources.contacts.send_email.action")}
      </Button>
      <EnviarCorreoDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const EnviarCorreoDialog = ({
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
  const [asunto, setAsunto] = useState("");
  const [texto, setTexto] = useState("");

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      await dataProvider.enviarCorreo(record!.id, asunto, texto);
    },
  });

  const handleClose = () => {
    setAsunto("");
    setTexto("");
    onClose();
  };

  const handleEnviar = async () => {
    try {
      await mutateAsync();
      notify("resources.contacts.send_email.success", { type: "success" });
      refresh();
      handleClose();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("resources.contacts.send_email.error"),
        { type: "error" },
      );
    }
  };

  if (!record) return null;
  const correoDestino = record.email_jsonb?.[0]?.email ?? "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="md:min-w-lg max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.contacts.send_email.action")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.contacts.send_email.to", {
              email: correoDestino,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="asunto-correo">
              {translate("resources.contacts.send_email.subject")}
            </Label>
            <Input
              id="asunto-correo"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="texto-correo">
              {translate("resources.contacts.send_email.message")}
            </Label>
            <Textarea
              id="texto-correo"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={8}
              maxLength={20000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            <CircleX />
            {translate("resources.contacts.send_email.cancel")}
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={!asunto || !texto || isPending}
          >
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

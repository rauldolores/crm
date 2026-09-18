import { useTranslate } from "ra-core";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ticketResolutions } from "../root/defaultConfiguration";

/**
 * Al cerrar un ticket se pide el motivo. Un ticket cerrado sin motivo no
 * dice nada después: «resuelto» y «el cliente nunca contestó» son dos
 * historias distintas para el informe y para la próxima vez que llame.
 * La nota opcional se guarda como nota del ticket, en el hilo.
 */
export const CerrarTicketDialog = ({
  open,
  onOpenChange,
  onConfirm,
  guardando,
}: {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  onConfirm: (resolution: string, nota: string) => void;
  guardando?: boolean;
}) => {
  const translate = useTranslate();
  const [resolution, setResolution] = useState("resolved");
  const [nota, setNota] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.tickets.close.title")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.tickets.close.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{translate("resources.tickets.fields.resolution")}</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ticketResolutions.map((motivo) => (
                  <SelectItem key={motivo.value} value={motivo.value}>
                    {motivo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cierre-nota">
              {translate("resources.tickets.close.note")}
            </Label>
            <Textarea
              id="cierre-nota"
              rows={3}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={translate(
                "resources.tickets.close.note_placeholder",
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {translate("ra.action.cancel")}
          </Button>
          <Button
            type="button"
            disabled={guardando}
            onClick={() => onConfirm(resolution, nota.trim())}
          >
            {translate("resources.tickets.close.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

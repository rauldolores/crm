import { useMutation } from "@tanstack/react-query";
import { useDataProvider, useNotify, useTranslate } from "ra-core";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  hoyEnMexico,
  MOTIVOS_NO_CONSUME,
  primerError,
  registroDeTiempoSchema,
  type MotivoNoConsume,
} from "@/lib/soporteTiempos";
import type { CrmDataProvider } from "../providers/types";
import type { SoporteTiempo } from "../types";
import { useRefrescarTiempos } from "./useRefrescarTiempos";

/**
 * Registrar tiempo de soporte en el ticket: minutos, qué se hizo (lo lee el
 * cliente), nota interna y si descuenta de la bolsa. Quien registra queda
 * como quien atendió.
 */
export const RegistrarTiempoDialog = ({
  ticketId,
  open,
  onClose,
}: {
  ticketId: number;
  open: boolean;
  onClose: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refrescar = useRefrescarTiempos();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [minutos, setMinutos] = useState("");
  const [fecha, setFecha] = useState(hoyEnMexico());
  const [descripcion, setDescripcion] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const [consume, setConsume] = useState(true);
  const [motivo, setMotivo] = useState<MotivoNoConsume>("FALLA_SISTEMA");
  const [autorizadoPor, setAutorizadoPor] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: (
      registro: Parameters<CrmDataProvider["registrarTiempoSoporte"]>[0],
    ) => dataProvider.registrarTiempoSoporte(registro),
    onSuccess: () => {
      notify("resources.tickets.tiempos.saved", { type: "success" });
      void refrescar();
      onClose();
    },
    onError: (error) => notify(error.message, { type: "error" }),
  });

  const guardar = () => {
    const registro = {
      ticketId,
      minutos: Number(minutos),
      fechaAtencion: fecha,
      descripcionCliente: descripcion,
      notaInterna,
      consume,
      motivoNoConsume: consume ? null : motivo,
      autorizadoPor: consume ? autorizadoPor : null,
    };
    // Se valida aquí con el mismo esquema que el servidor para avisar sin
    // viajar; el servidor vuelve a validar.
    const validacion = registroDeTiempoSchema.safeParse(registro);
    if (!validacion.success) {
      notify(primerError(validacion.error), { type: "warning" });
      return;
    }
    mutate(registro);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.tickets.tiempos.register")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.tickets.tiempos.client_description_help")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tiempo-minutos">
                {translate("resources.tickets.tiempos.minutes")}
              </Label>
              <Input
                id="tiempo-minutos"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={minutos}
                onChange={(e) => setMinutos(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tiempo-fecha">
                {translate("resources.tickets.tiempos.date")}
              </Label>
              <Input
                id="tiempo-fecha"
                type="date"
                max={hoyEnMexico()}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiempo-descripcion">
              {translate("resources.tickets.tiempos.client_description")}
            </Label>
            <Textarea
              id="tiempo-descripcion"
              rows={3}
              maxLength={2000}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiempo-nota">
              {translate("resources.tickets.tiempos.internal_note")}
            </Label>
            <Textarea
              id="tiempo-nota"
              rows={2}
              maxLength={4000}
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="tiempo-consume"
              checked={consume}
              onCheckedChange={setConsume}
            />
            <Label htmlFor="tiempo-consume" className="font-normal">
              {translate("resources.tickets.tiempos.consumes")}
            </Label>
          </div>
          {consume ? (
            <div className="space-y-1.5">
              <Label htmlFor="tiempo-autorizo">
                {translate("resources.tickets.tiempos.authorized_by")}
              </Label>
              <Input
                id="tiempo-autorizo"
                maxLength={200}
                value={autorizadoPor}
                onChange={(e) => setAutorizadoPor(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {translate("resources.tickets.tiempos.authorized_by_help")}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{translate("resources.tickets.tiempos.reason")}</Label>
              <Select
                value={motivo}
                onValueChange={(v) => setMotivo(v as MotivoNoConsume)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_NO_CONSUME.map((m) => (
                    <SelectItem key={m} value={m}>
                      {translate(`resources.tickets.tiempos.reasons.${m}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {translate("ra.action.cancel")}
          </Button>
          <Button onClick={guardar} disabled={isPending}>
            {translate("resources.tickets.tiempos.register")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Corregir un registro: se anula con uno en contra y, si se indica, se
 * guarda la cifra buena como registro nuevo.
 */
export const CorregirTiempoDialog = ({
  registro,
  onClose,
}: {
  registro: SoporteTiempo | null;
  onClose: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refrescar = useRefrescarTiempos();
  const dataProvider = useDataProvider<CrmDataProvider>();
  const [motivo, setMotivo] = useState("");
  const [minutosCorrectos, setMinutosCorrectos] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      dataProvider.corregirTiempoSoporte({
        id: Number(registro?.id),
        motivo,
        minutosCorrectos: minutosCorrectos ? Number(minutosCorrectos) : null,
      }),
    onSuccess: () => {
      notify("resources.tickets.tiempos.corrected_ok", { type: "success" });
      void refrescar();
      onClose();
    },
    onError: (error) => notify(error.message, { type: "error" }),
  });

  return (
    <Dialog open={registro != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {translate("resources.tickets.tiempos.correct_title")}
          </DialogTitle>
          <DialogDescription>
            {translate("resources.tickets.tiempos.correct_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="correccion-motivo">
              {translate("resources.tickets.tiempos.correct_reason")}
            </Label>
            <Textarea
              id="correccion-motivo"
              rows={2}
              maxLength={1000}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correccion-minutos">
              {translate("resources.tickets.tiempos.correct_minutes")}
            </Label>
            <Input
              id="correccion-minutos"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={minutosCorrectos}
              onChange={(e) => setMinutosCorrectos(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {translate("ra.action.cancel")}
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !motivo.trim()}
          >
            {translate("resources.tickets.tiempos.correct")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

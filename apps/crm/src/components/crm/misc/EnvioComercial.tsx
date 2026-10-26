import { Gauge } from "lucide-react";
import { useNotify, useTranslate } from "ra-core";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { llamarApi } from "./llamarApi";

/**
 * Ajustes → Correo saliente → Correo comercial: cuántos correos de
 * automatizaciones y envíos masivos salen al día, si se calienta el dominio,
 * cómo va el día y cuántas direcciones se dieron de baja.
 *
 * Lo transaccional (cotizaciones, tickets, renovaciones) no cuenta aquí:
 * sale siempre.
 */

interface EstadoDelEnvio {
  limiteDiario: number;
  calentamiento: boolean;
  limiteDeHoy: number;
  enviados: number;
  bajas: number;
  editable: boolean;
}

export const EnvioComercial = () => {
  const translate = useTranslate();
  const notify = useNotify();
  const [estado, setEstado] = useState<EstadoDelEnvio | null>(null);
  const [limite, setLimite] = useState("");
  const [calentamiento, setCalentamiento] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    llamarApi<EstadoDelEnvio>("/api/correos/envio-comercial")
      .then((datos) => {
        setEstado(datos);
        setLimite(String(datos.limiteDiario));
        setCalentamiento(datos.calentamiento);
      })
      .catch((error: Error) => notify(error.message, { type: "error" }));

  useEffect(() => {
    void cargar();
    // Solo al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await llamarApi("/api/correos/envio-comercial", {
        method: "PUT",
        body: JSON.stringify({
          limiteDiario: Number(limite),
          calentamiento,
        }),
      });
      notify("crm.email.commercial.saved");
      await cargar();
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error), {
        type: "error",
      });
    } finally {
      setGuardando(false);
    }
  };

  if (!estado) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate("crm.email.commercial.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {translate("crm.email.commercial.intro")}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              {translate("crm.email.commercial.today")}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {estado.enviados} / {estado.limiteDeHoy}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              {translate("crm.email.commercial.unsubscribed")}
            </p>
            <p className="text-xl font-semibold tabular-nums">{estado.bajas}</p>
          </div>
        </div>

        {estado.editable ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="limite-diario">
                {translate("crm.email.commercial.daily_limit")}
              </Label>
              <Input
                id="limite-diario"
                type="number"
                min={1}
                max={100000}
                className="w-40"
                value={limite}
                onChange={(evento) => setLimite(evento.target.value)}
              />
            </div>

            <div className="flex items-start gap-2">
              <Switch
                checked={calentamiento}
                onCheckedChange={setCalentamiento}
                aria-label={translate("crm.email.commercial.warmup")}
              />
              <div>
                <p>{translate("crm.email.commercial.warmup")}</p>
                <p className="text-xs text-muted-foreground">
                  {translate("crm.email.commercial.warmup_help")}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={guardar} disabled={guardando || !limite}>
                <Gauge className="h-4 w-4 mr-1" />
                {translate("ra.action.save")}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            {translate("crm.email.commercial.needs_server")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

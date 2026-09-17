import { Building2, Check, CircleX, ExternalLink, Send } from "lucide-react";
import {
  useDataProvider,
  useGetIdentity,
  useNotify,
  useTranslate,
} from "ra-core";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { env } from "@/lib/env";

/**
 * No es un plan de KontrolIA Auth: no tiene precio, no pasa por Stripe, no
 * hay `startCheckout` que iniciar. Es una tarjeta fija junto a los planes
 * reales para el caso que ningún plan de catálogo cubre — infraestructura
 * propia, SSO, integraciones a medida — y en vez de comprar, pide que lo
 * contactemos.
 *
 * El «desde» y las modalidades son un resumen: la fuente de los precios, la
 * calculadora y la explicación completa viven en el sitio público
 * (apps/web, content/enterprise.ts). Si cambian allí, cambia el texto aquí.
 */
const CARACTERISTICAS = [
  "dedicated",
  "modalities",
  "unlimited",
  "implementation",
  "sla",
  "integrations",
] as const;

export const PlanEnterpriseCard = () => {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="border-dashed">
        <CardContent className="flex h-full flex-col gap-4 pt-6">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                {translate("crm.billing.enterprise.name")}
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {translate("crm.billing.enterprise.tagline")}
            </p>
          </div>

          <div>
            <span className="text-2xl font-semibold">
              {translate("crm.billing.enterprise.from")}
            </span>
            <p className="text-xs text-muted-foreground">
              {translate("crm.billing.enterprise.from_detail")}
            </p>
          </div>

          <ul className="flex flex-col gap-1.5 text-sm">
            {CARACTERISTICAS.map((clave) => (
              <li key={clave} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {translate(`crm.billing.enterprise.features.${clave}`)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <Button className="w-full" onClick={() => setOpen(true)}>
              {translate("crm.billing.enterprise.action")}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`${env.sitioUrl}/enterprise`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                {translate("crm.billing.enterprise.details")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PlanEnterpriseDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const PlanEnterpriseDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const { identity } = useGetIdentity();

  const [nombre, setNombre] = useState("");
  const [nombreEditadoAMano, setNombreEditadoAMano] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  // `identity` llega de forma asíncrona: en el momento de abrir el diálogo
  // todavía puede no estar lista. Por eso el nombre se sincroniza con un
  // efecto (que reacciona cuando identity por fin llega) en vez de fijarse
  // una sola vez al abrir — y solo mientras la persona no lo haya tocado, así
  // no le pisa un nombre que ya empezó a corregir.
  useEffect(() => {
    if (!nombreEditadoAMano && identity?.fullName) {
      setNombre(identity.fullName);
    }
  }, [identity?.fullName, nombreEditadoAMano]);

  const handleNombreChange = (valor: string) => {
    setNombre(valor);
    setNombreEditadoAMano(true);
  };

  const handleClose = () => {
    setMensaje("");
    setNombreEditadoAMano(false);
    onClose();
  };

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      await dataProvider.contactarPlanEnterprise(nombre, mensaje);
      notify("crm.billing.enterprise.success", { type: "success" });
      handleClose();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : translate("crm.billing.enterprise.error"),
        { type: "error" },
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(abierto) => !abierto && handleClose()}>
      <DialogContent className="md:min-w-lg max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {translate("crm.billing.enterprise.dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {translate("crm.billing.enterprise.dialog_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre-enterprise">
              {translate("crm.billing.enterprise.name_field")}
            </Label>
            <Input
              id="nombre-enterprise"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mensaje-enterprise">
              {translate("crm.billing.enterprise.message_field")}
            </Label>
            <Textarea
              id="mensaje-enterprise"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={translate(
                "crm.billing.enterprise.message_placeholder",
              )}
              rows={6}
              maxLength={4000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={enviando}>
            <CircleX />
            {translate("crm.billing.enterprise.cancel")}
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={!nombre.trim() || !mensaje.trim() || enviando}
          >
            <Send />
            {enviando
              ? translate("crm.billing.enterprise.sending")
              : translate("crm.billing.enterprise.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

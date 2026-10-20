import { Banknote, Loader2, RotateCw } from "lucide-react";
import { CanAccess, useNotify, useTranslate } from "ra-core";
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

import { llamarApi } from "../misc/llamarApi";
import type { Invoice } from "../types";
import { fechaDeVigencia } from "./formatoDeFacturas";

/**
 * Renovar el acceso al pagar: qué pasó con la vigencia en KontrolIA Auth
 * cuando la factura de un contrato por transferencia quedó pagada, y
 * «Registrar pago» para una timbrada que se cobró fuera de Faqturia.
 *
 * Reintentar y registrar el pago pasan por /api/facturacion/facturas/:id,
 * que exige administrador; los botones solo se ven si lo eres.
 */

type Respuesta = { factura: Invoice; mensaje: string | null };

const accionDeFactura = (id: Invoice["id"], cuerpo: Record<string, unknown>) =>
  llamarApi<Respuesta>(`/api/facturacion/facturas/${id}`, {
    method: "POST",
    body: JSON.stringify(cuerpo),
  });

/** Una línea con el estado del acceso; nada si no le toca. */
export const EstadoDeAccesoDeFactura = ({
  factura,
  alCambiar,
}: {
  factura: Invoice;
  alCambiar: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [ocupado, setOcupado] = useState(false);
  const estado = factura.access_status;

  const reintentar = async () => {
    setOcupado(true);
    try {
      const { factura: nueva, mensaje } = await accionDeFactura(factura.id, {
        accion: "renovar_acceso",
      });
      if (nueva.access_status === "renewed") {
        notify("crm.customer_billing.access.renewed_ok", {
          type: "info",
          messageArgs: { date: fechaDeVigencia(nueva.access_renewed_until) },
        });
      } else {
        notify(mensaje ?? "crm.customer_billing.access.not_renewed", {
          type: "warning",
          autoHideDuration: 10000,
        });
      }
    } catch (error) {
      notify((error as Error).message, {
        type: "error",
        autoHideDuration: 10000,
      });
    } finally {
      setOcupado(false);
      alCambiar();
    }
  };

  let texto: string | null = null;
  let clase = "text-muted-foreground";
  let conReintento = false;
  switch (estado) {
    case "renewed":
      texto = factura.access_renewed_until
        ? translate("crm.customer_billing.access.renewed", {
            date: fechaDeVigencia(factura.access_renewed_until),
          })
        : translate("crm.customer_billing.access.renewed_no_date");
      clase = "text-emerald-700 dark:text-emerald-400";
      break;
    case "pending":
      texto = translate("crm.customer_billing.access.pending");
      break;
    case "error":
      texto = translate("crm.customer_billing.access.error", {
        reason:
          factura.access_error ??
          translate("crm.customer_billing.access.unknown"),
      });
      if (factura.access_next_attempt_at) {
        texto += ` ${translate("crm.customer_billing.access.next_attempt", {
          date: new Date(factura.access_next_attempt_at).toLocaleString(),
        })}`;
      }
      clase = "text-destructive";
      conReintento = true;
      break;
    case "skipped":
      texto = translate("crm.customer_billing.access.skipped", {
        reason:
          factura.access_error ??
          translate("crm.customer_billing.access.unknown"),
      });
      clase = "text-amber-700 dark:text-amber-400";
      conReintento = true;
      break;
    case "not_applicable":
      // Solo se dice en los cobros con tarjeta o de créditos: en las demás
      // (contratos que no son de KontrolIA Auth) sería ruido.
      if (factura.origin === "card" || factura.origin === "credits") {
        texto = translate("crm.customer_billing.access.not_applicable_card");
      }
      break;
  }
  if (!texto) return null;

  return (
    <p className={`flex flex-wrap items-center gap-x-2 text-xs ${clase}`}>
      <span>{texto}</span>
      {conReintento && (
        <CanAccess resource="configuration" action="edit">
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={reintentar}
            disabled={ocupado}
          >
            {ocupado ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            {translate("crm.customer_billing.access.retry")}
          </Button>
        </CanAccess>
      )}
    </p>
  );
};

/** «Registrar pago»: solo en una timbrada sin pagar, solo administradores. */
export const BotonRegistrarPago = ({
  factura,
  alCambiar,
}: {
  factura: Invoice;
  alCambiar: () => void;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [fecha, setFecha] = useState(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
    }).format(new Date()),
  );
  const [referencia, setReferencia] = useState("");

  if (
    factura.origin === "quote" ||
    factura.billing_status !== "stamped" ||
    factura.payment_status === "paid"
  ) {
    return null;
  }

  const registrar = async () => {
    setOcupado(true);
    try {
      const { factura: nueva, mensaje } = await accionDeFactura(factura.id, {
        accion: "registrar_pago",
        pagada_el: fecha,
        referencia: referencia.trim() || null,
      });
      if (nueva.access_status === "renewed") {
        notify("crm.customer_billing.access.paid_and_renewed", {
          type: "info",
          messageArgs: { date: fechaDeVigencia(nueva.access_renewed_until) },
        });
      } else if (mensaje) {
        notify(mensaje, { type: "warning", autoHideDuration: 10000 });
      } else {
        notify("crm.customer_billing.access.paid", { type: "info" });
      }
      setAbierto(false);
    } catch (error) {
      notify((error as Error).message, {
        type: "error",
        autoHideDuration: 10000,
      });
    } finally {
      setOcupado(false);
      alCambiar();
    }
  };

  return (
    <CanAccess resource="configuration" action="edit">
      <Button size="sm" variant="outline" onClick={() => setAbierto(true)}>
        <Banknote className="h-4 w-4" />
        {translate("crm.customer_billing.access.register_payment")}
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={(abrir) => !abrir && setAbierto(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translate("crm.customer_billing.access.register_payment")}
            </DialogTitle>
            <DialogDescription>
              {translate("crm.customer_billing.access.register_payment_help")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`pagada-el-${factura.id}`}>
                {translate("crm.customer_billing.access.paid_on")}
              </Label>
              <Input
                id={`pagada-el-${factura.id}`}
                type="date"
                value={fecha}
                onChange={(evento) => setFecha(evento.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`referencia-${factura.id}`}>
                {translate("crm.customer_billing.access.reference")}
              </Label>
              <Input
                id={`referencia-${factura.id}`}
                value={referencia}
                maxLength={200}
                placeholder={translate(
                  "crm.customer_billing.access.reference_placeholder",
                )}
                onChange={(evento) => setReferencia(evento.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAbierto(false)}
              disabled={ocupado}
            >
              {translate("ra.action.cancel")}
            </Button>
            <Button onClick={registrar} disabled={ocupado || !fecha}>
              {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
              {translate("crm.customer_billing.access.register_confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CanAccess>
  );
};

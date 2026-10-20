import { Loader2, ReceiptText } from "lucide-react";
import { useGetList, useNotify, useRefresh, useTranslate } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { llamarApi } from "../misc/llamarApi";
import type { BillingSettings, Company, Contract, Invoice } from "../types";
import { BotonesDeDescarga } from "./ListaDeFacturas";
import { PorFacturarPage } from "./PorFacturarPage";
import {
  fechaCorta,
  folioDe,
  importeDe,
  periodoDe,
  VARIANTE_DE_BANDEJA,
} from "./formatoDeFacturas";

/**
 * Lo del módulo de facturación en la pestaña «Cliente» de la empresa: sus
 * facturas (de contratos, cobros y cotizaciones) y, en cada contrato con
 * periodicidad, el interruptor «Facturar automáticamente», cuándo saldrá la
 * siguiente y «Facturar ahora».
 */

const DIAS_POR_OMISION = 15;

/** Días de anticipación del producto del contrato (o los generales). */
const useDiasAntes = (producto?: string | null): number => {
  const { data } = useGetList<BillingSettings & { id: number }>(
    "billing_settings",
    { pagination: { page: 1, perPage: 100 } },
    { staleTime: 60_000 },
  );
  const propia = data?.find((fila) => fila.product_key === producto);
  const general = data?.find((fila) => fila.product_key === "*");
  const dias = Number((propia ?? general)?.days_before);
  return Number.isFinite(dias) && (propia ?? general) ? dias : DIAS_POR_OMISION;
};

const restarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
};

export const FacturacionDelContrato = ({
  contrato,
}: {
  contrato: Contract;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const dias = useDiasAntes(contrato.application_slug);
  const [ocupado, setOcupado] = useState(false);
  const [encendido, setEncendido] = useState(Boolean(contrato.billing_enabled));

  if (contrato.status !== "active") return null;
  const conTarjeta = contrato.provider === "stripe";

  const cambiar = async (valor: boolean) => {
    setOcupado(true);
    try {
      await llamarApi(`/api/facturacion/contratos/${contrato.id}`, {
        method: "PATCH",
        body: JSON.stringify({ billing_enabled: valor }),
      });
      setEncendido(valor);
      notify(
        valor
          ? "crm.customer_billing.company.enabled"
          : "crm.customer_billing.company.disabled",
        { type: "info" },
      );
    } catch (error) {
      notify((error as Error).message, { type: "error" });
    } finally {
      setOcupado(false);
    }
  };

  const facturarAhora = async () => {
    if (
      !window.confirm(
        translate("crm.customer_billing.company.bill_now_confirm"),
      )
    )
      return;
    setOcupado(true);
    try {
      const { mensaje } = await llamarApi<{ mensaje: string | null }>(
        `/api/facturacion/contratos/${contrato.id}`,
        { method: "POST", body: JSON.stringify({ accion: "facturar_ahora" }) },
      );
      notify(mensaje ?? "crm.customer_billing.inbox.stamped", {
        type: mensaje ? "warning" : "info",
        autoHideDuration: 10000,
      });
      refresh();
    } catch (error) {
      notify((error as Error).message, {
        type: "error",
        autoHideDuration: 10000,
      });
    } finally {
      setOcupado(false);
    }
  };

  const idDelInterruptor = `facturar-solo-${contrato.id}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
      {conTarjeta ? (
        <p className="text-xs text-muted-foreground">
          {translate("crm.customer_billing.company.next_card")}
        </p>
      ) : (
        <div className="flex items-start gap-2">
          <Switch
            id={idDelInterruptor}
            checked={encendido}
            disabled={ocupado}
            onCheckedChange={cambiar}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor={idDelInterruptor} className="text-xs">
              {translate("crm.customer_billing.company.auto")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {encendido && contrato.renews_on
                ? translate("crm.customer_billing.company.next_on", {
                    date: fechaCorta(restarDias(contrato.renews_on, dias)),
                  })
                : translate("crm.customer_billing.company.auto_help", {
                    days: dias,
                  })}
            </p>
          </div>
        </div>
      )}
      {!conTarjeta && (
        <Button
          size="sm"
          variant="outline"
          onClick={facturarAhora}
          disabled={ocupado}
        >
          {ocupado ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ReceiptText className="h-4 w-4" />
          )}
          {translate("crm.customer_billing.company.bill_now")}
        </Button>
      )}
    </div>
  );
};

export const SeccionDeFacturas = ({ empresa }: { empresa: Company }) => {
  const translate = useTranslate();
  const { data: facturas, isPending } = useGetList<Invoice>("invoices", {
    filter: { company_id: empresa.id, "billing_status@neq": "discarded" },
    sort: { field: "created_at", order: "DESC" },
    pagination: { page: 1, perPage: 50 },
  });

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h6 className="text-sm font-semibold">
          {translate("crm.customer_billing.company.title")}
        </h6>
        <Link to={PorFacturarPage.path} className="text-xs">
          {translate("crm.customer_billing.company.go_inbox")}
        </Link>
      </div>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !facturas?.length ? (
        <p className="text-sm text-muted-foreground">
          {translate("crm.customer_billing.company.empty")}
        </p>
      ) : (
        <ul className="divide-y rounded-md border text-sm">
          {facturas.map((factura) => {
            const estado = factura.billing_status ?? "stamped";
            return (
              <li
                key={factura.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div>
                  <p className="font-medium tabular-nums">
                    {folioDe(factura) ||
                      translate(
                        `crm.customer_billing.inbox.origin.${factura.origin ?? "quote"}`,
                      )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {periodoDe(factura)}
                    {Number(factura.paid_amount ?? 0) > 0
                      ? ` · ${translate("crm.customer_billing.company.paid")} ${importeDe(
                          factura.paid_amount,
                          factura.currency,
                        )}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {importeDe(factura.total, factura.currency)}
                  </span>
                  {factura.payment_status && (
                    <Badge
                      variant={
                        factura.payment_status === "paid"
                          ? "default"
                          : "outline"
                      }
                    >
                      {translate(
                        `crm.customer_billing.payment_status.${factura.payment_status}`,
                      )}
                    </Badge>
                  )}
                  <Badge variant={VARIANTE_DE_BANDEJA[estado]}>
                    {translate(`crm.customer_billing.billing_status.${estado}`)}
                  </Badge>
                  <BotonesDeDescarga factura={factura} compactos />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

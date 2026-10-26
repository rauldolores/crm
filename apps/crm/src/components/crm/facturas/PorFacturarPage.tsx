import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  useGetList,
  useGetMany,
  useNotify,
  useTranslate,
  type Identifier,
} from "ra-core";
import { useState } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { llamarApi } from "../misc/llamarApi";
import type {
  Company,
  Contract,
  Invoice,
  InvoiceBillingStatus,
  InvoiceItem,
} from "../types";
import { BotonRegistrarPago, EstadoDeAccesoDeFactura } from "./AccesoDeFactura";
import { BotonesDeDescarga } from "./ListaDeFacturas";
import {
  fechaCorta,
  folioDe,
  importeDe,
  periodoDe,
  VARIANTE_DE_BANDEJA,
} from "./formatoDeFacturas";
import { PageHero } from "../misc/Patrones";

/**
 * Bandeja «Por facturar»: las facturas que arma el CRM (contratos por
 * transferencia y cobros con tarjeta) antes de timbrarse. Por revisar, las
 * que esperan datos fiscales, las que fallaron y las últimas timbradas.
 *
 * Aprobar, reintentar y descartar pasan por /api/facturacion/facturas/:id,
 * que exige administrador; la lista se lee por el puente, de solo lectura.
 */

type Pestana = "pending_review" | "missing_data" | "error" | "stamped";

const PESTANAS: Pestana[] = [
  "pending_review",
  "missing_data",
  "error",
  "stamped",
];

/** Lo que entra en cada pestaña: «por revisar» incluye lo que ya va a la cola. */
const ESTADOS_DE_PESTANA: Record<Pestana, InvoiceBillingStatus[]> = {
  pending_review: ["pending_review", "queued", "stamping"],
  missing_data: ["missing_data"],
  error: ["error"],
  stamped: ["stamped"],
};

export const PorFacturarPage = () => {
  const translate = useTranslate();
  const [pestana, setPestana] = useState<Pestana>("pending_review");

  return (
    <div className="mt-8 mb-16 flex flex-col gap-6">
      <PageHero
        badge={translate("crm.modules.invoicing.name")}
        title={translate("crm.customer_billing.inbox.title")}
        description={translate("crm.customer_billing.inbox.intro")}
      />
      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)}>
        <TabsList>
          {PESTANAS.map((clave) => (
            <TabsTrigger key={clave} value={clave}>
              {translate(`crm.customer_billing.inbox.tabs.${clave}`)}
              <Contador
                estados={ESTADOS_DE_PESTANA[clave]}
                oculto={clave === "stamped"}
              />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <ListaDePestana key={pestana} pestana={pestana} />
    </div>
  );
};

PorFacturarPage.path = "/por-facturar";

const Contador = ({
  estados,
  oculto,
}: {
  estados: InvoiceBillingStatus[];
  oculto: boolean;
}) => {
  const { total } = useGetList<Invoice>(
    "invoices",
    {
      filter: {
        "billing_status@in": `(${estados.join(",")})`,
        "origin@neq": "quote",
      },
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !oculto },
  );
  if (oculto || !total) return null;
  return (
    <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
      {total}
    </Badge>
  );
};

const ListaDePestana = ({ pestana }: { pestana: Pestana }) => {
  const translate = useTranslate();
  const { data, isPending, refetch } = useGetList<Invoice>("invoices", {
    filter: {
      "billing_status@in": `(${ESTADOS_DE_PESTANA[pestana].join(",")})`,
      "origin@neq": "quote",
    },
    sort:
      pestana === "stamped"
        ? { field: "issued_at", order: "DESC" }
        : { field: "created_at", order: "ASC" },
    pagination: { page: 1, perPage: pestana === "stamped" ? 25 : 100 },
  });

  const facturas = data ?? [];
  const { data: empresas } = useGetMany<Company>("companies", {
    ids: [
      ...new Set(
        facturas
          .map((f) => f.company_id)
          .filter((id): id is Identifier => id != null),
      ),
    ],
  });
  const { data: contratos } = useGetMany<Contract>("contracts", {
    ids: [
      ...new Set(
        facturas
          .map((f) => f.contract_id)
          .filter((id): id is Identifier => id != null),
      ),
    ],
  });

  if (isPending) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (!facturas.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate(`crm.customer_billing.inbox.empty.${pestana}`)}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {facturas.map((factura) => (
        <FilaDeFactura
          key={factura.id}
          factura={factura}
          empresa={empresas?.find((e) => e.id === factura.company_id)}
          contrato={contratos?.find((c) => c.id === factura.contract_id)}
          alCambiar={() => refetch()}
        />
      ))}
    </div>
  );
};

const productoDe = (contrato?: Contract) =>
  contrato ? contrato.name.split(" · ")[0] || contrato.name : null;

export const FilaDeFactura = ({
  factura,
  empresa,
  contrato,
  alCambiar,
  sinCliente = false,
}: {
  factura: Invoice;
  empresa?: Pick<Company, "id" | "name">;
  contrato?: Contract;
  alCambiar: () => void;
  /** En la ficha de la empresa el cliente ya se sabe. */
  sinCliente?: boolean;
}) => {
  const translate = useTranslate();
  const notify = useNotify();
  const [abierta, setAbierta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const estado = factura.billing_status ?? "stamped";

  const actuar = async (cuerpo: Record<string, unknown>) => {
    setOcupado(true);
    try {
      const { mensaje, factura: nueva } = await llamarApi<{
        mensaje: string | null;
        factura: Invoice;
      }>(`/api/facturacion/facturas/${factura.id}`, {
        method: "POST",
        body: JSON.stringify(cuerpo),
      });
      if (mensaje) {
        notify(mensaje, { type: "warning", autoHideDuration: 10000 });
      } else if (nueva.billing_status === "discarded") {
        notify("crm.customer_billing.inbox.discarded", { type: "info" });
      } else {
        notify("crm.customer_billing.inbox.stamped", { type: "info" });
      }
      setDescartando(false);
      alCambiar();
    } catch (error) {
      notify((error as Error).message, {
        type: "error",
        autoHideDuration: 10000,
      });
      alCambiar();
    } finally {
      setOcupado(false);
    }
  };

  const problemas = (factura.problems ?? []).map((p) =>
    translate(`crm.customer_billing.problems.${p}`, { _: p }),
  );

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">
            {!sinCliente && (
              <>
                {empresa ? (
                  <Link to={`/companies/${empresa.id}/show`}>
                    {empresa.name}
                  </Link>
                ) : (
                  translate("crm.customer_billing.inbox.fields.customer") +
                  ": —"
                )}
                {" · "}
              </>
            )}
            {productoDe(contrato) ??
              translate("crm.customer_billing.inbox.no_product")}
          </p>
          <p className="text-xs text-muted-foreground">
            {periodoDe(factura)}
            {" · "}
            {translate(
              `crm.customer_billing.inbox.origin.${factura.origin ?? "quote"}`,
            )}
            {factura.due_on
              ? ` · ${translate("crm.customer_billing.inbox.fields.due_on")} ${fechaCorta(factura.due_on)}`
              : ""}
            {folioDe(factura) ? ` · ${folioDe(factura)}` : ""}
          </p>
          {factura.notes && (
            <p className="text-xs text-muted-foreground">{factura.notes}</p>
          )}
          {estado === "missing_data" && problemas.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {translate("crm.customer_billing.inbox.missing")}{" "}
              {problemas.join(", ")}
              {empresa && (
                <>
                  {" · "}
                  <Link to={`/companies/${empresa.id}/show`}>
                    {translate("crm.customer_billing.inbox.open_company")}
                  </Link>
                </>
              )}
            </p>
          )}
          {estado === "error" && factura.error && (
            <p className="text-xs text-destructive">{factura.error}</p>
          )}
          <EstadoDeAccesoDeFactura factura={factura} alCambiar={alCambiar} />
          {estado === "discarded" && factura.discard_reason && (
            <p className="text-xs text-muted-foreground">
              {factura.discard_reason}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tabular-nums">
            {importeDe(factura.total, factura.currency)}
          </span>
          <Badge variant={VARIANTE_DE_BANDEJA[estado]}>
            {translate(`crm.customer_billing.billing_status.${estado}`)}
          </Badge>
          {factura.payment_status && (
            <Badge
              variant={
                factura.payment_status === "paid" ? "default" : "outline"
              }
            >
              {translate(
                `crm.customer_billing.payment_status.${factura.payment_status}`,
              )}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(estado === "pending_review" || estado === "missing_data") && (
          <Button
            size="sm"
            onClick={() => actuar({ accion: "aprobar" })}
            disabled={ocupado}
          >
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
            {translate("crm.customer_billing.inbox.approve")}
          </Button>
        )}
        {estado === "error" && (
          <Button
            size="sm"
            onClick={() => actuar({ accion: "reintentar" })}
            disabled={ocupado}
          >
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
            {translate("crm.customer_billing.inbox.retry")}
          </Button>
        )}
        {["pending_review", "missing_data", "error", "queued"].includes(
          estado,
        ) && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => setDescartando(true)}
            disabled={ocupado}
          >
            {translate("crm.customer_billing.inbox.discard")}
          </Button>
        )}
        {estado === "stamped" && (
          <BotonesDeDescarga factura={factura} compactos />
        )}
        <BotonRegistrarPago factura={factura} alCambiar={alCambiar} />
        <Button size="sm" variant="ghost" onClick={() => setAbierta((a) => !a)}>
          {abierta ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {translate(
            abierta
              ? "crm.customer_billing.inbox.hide"
              : "crm.customer_billing.inbox.view",
          )}
        </Button>
      </div>

      {abierta && <RenglonesDeFactura factura={factura} />}

      <DialogoDeDescarte
        abierto={descartando}
        ocupado={ocupado}
        alCerrar={() => setDescartando(false)}
        alConfirmar={(motivo) => actuar({ accion: "descartar", motivo })}
      />
    </div>
  );
};

const RenglonesDeFactura = ({ factura }: { factura: Invoice }) => {
  const translate = useTranslate();
  const { data, isPending } = useGetList<InvoiceItem>("invoice_items", {
    filter: { invoice_id: factura.id },
    sort: { field: "position", order: "ASC" },
    pagination: { page: 1, perPage: 50 },
  });
  if (isPending) {
    return (
      <Loader2 className="mt-2 h-4 w-4 animate-spin text-muted-foreground" />
    );
  }
  return (
    <div className="mt-3 border-t pt-2">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {translate("crm.customer_billing.inbox.lines")}
      </p>
      <ul className="space-y-0.5 text-xs">
        {(data ?? []).map((renglon) => (
          <li key={renglon.id} className="flex justify-between gap-3">
            <span>
              {Number(renglon.quantity) !== 1
                ? `${Number(renglon.quantity)} × `
                : ""}
              {renglon.description}
              <span className="text-muted-foreground">
                {" "}
                · {renglon.clave_prod_serv} / {renglon.clave_unidad}
              </span>
            </span>
            <span className="tabular-nums">
              {importeDe(renglon.amount, factura.currency)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-2 flex flex-wrap justify-end gap-x-4 text-xs text-muted-foreground">
        <div className="flex gap-1">
          <dt>{translate("crm.customer_billing.inbox.subtotal")}:</dt>
          <dd className="tabular-nums">
            {importeDe(factura.subtotal, factura.currency)}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>{translate("crm.customer_billing.inbox.tax")}:</dt>
          <dd className="tabular-nums">
            {importeDe(factura.tax, factura.currency)}
          </dd>
        </div>
        <div className="flex gap-1 font-medium text-foreground">
          <dt>{translate("crm.customer_billing.inbox.fields.total")}:</dt>
          <dd className="tabular-nums">
            {importeDe(factura.total, factura.currency)}
          </dd>
        </div>
      </dl>
    </div>
  );
};

const DialogoDeDescarte = ({
  abierto,
  ocupado,
  alCerrar,
  alConfirmar,
}: {
  abierto: boolean;
  ocupado: boolean;
  alCerrar: () => void;
  alConfirmar: (motivo: string) => void;
}) => {
  const translate = useTranslate();
  const [motivo, setMotivo] = useState("");
  return (
    <Dialog open={abierto} onOpenChange={(abrir) => !abrir && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {translate("crm.customer_billing.inbox.discard_title")}
          </DialogTitle>
          <DialogDescription>
            {translate("crm.customer_billing.inbox.discard_help")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="motivo-de-descarte">
            {translate("crm.customer_billing.inbox.discard_reason")}
          </Label>
          <Textarea
            id="motivo-de-descarte"
            value={motivo}
            maxLength={500}
            onChange={(evento) => setMotivo(evento.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={alCerrar} disabled={ocupado}>
            {translate("ra.action.cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={ocupado || !motivo.trim()}
            onClick={() => alConfirmar(motivo.trim())}
          >
            {translate("crm.customer_billing.inbox.discard_confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

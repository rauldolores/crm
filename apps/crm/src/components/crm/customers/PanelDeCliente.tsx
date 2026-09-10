import { Plus } from "lucide-react";
import {
  Form,
  RecordContextProvider,
  required,
  useCreate,
  useGetList,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DateInput } from "@/components/admin/date-input";
import { NumberInput } from "@/components/admin/number-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type {
  Company,
  Contract,
  CustomerSummary,
  Purchase,
  PurchaseItem,
} from "../types";
import { EtapaDeCliente } from "./EtapaDeCliente";

/**
 * Pestaña «Cliente» de la ficha de empresa: todo lo que ha hecho con
 * nosotros. El resumen agregado, sus contratos y sus compras con líneas.
 *
 * Desde aquí también se registran a mano un contrato o una compra. Es el
 * camino para quien no tenga un sistema externo conectado; quien lo tenga,
 * lo alimenta por la API de ingesta y aquí solo consulta.
 */

const PERIODOS = [
  { id: "monthly", name: "crm.customers.period.monthly" },
  { id: "quarterly", name: "crm.customers.period.quarterly" },
  { id: "yearly", name: "crm.customers.period.yearly" },
  { id: "one_time", name: "crm.customers.period.one_time" },
];

const ESTADOS_DE_CONTRATO = [
  { id: "active", name: "crm.customers.contract_status.active" },
  { id: "paused", name: "crm.customers.contract_status.paused" },
  { id: "cancelled", name: "crm.customers.contract_status.cancelled" },
  { id: "expired", name: "crm.customers.contract_status.expired" },
];

const ESTADOS_DE_COMPRA = [
  { id: "paid", name: "crm.customers.purchase_status.paid" },
  { id: "pending", name: "crm.customers.purchase_status.pending" },
  { id: "cancelled", name: "crm.customers.purchase_status.cancelled" },
  { id: "refunded", name: "crm.customers.purchase_status.refunded" },
];

const useImporte = () => {
  const { currency } = useConfigurationContext();
  return (valor?: number | null) =>
    Number(valor ?? 0).toLocaleString(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
};

const fecha = (valor?: string | null) =>
  valor ? new Date(`${valor}T00:00:00`).toLocaleDateString() : "—";

const Cifra = ({ etiqueta, valor }: { etiqueta: string; valor: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{etiqueta}</p>
    <p className="text-lg font-semibold">{valor}</p>
  </div>
);

export const PanelDeCliente = ({ empresa }: { empresa: Company }) => {
  const translate = useTranslate();
  const importe = useImporte();

  const { data: resumen } = useGetOne<CustomerSummary>("customer_summary", {
    id: empresa.id,
  });
  const { data: contratos } = useGetList<Contract>("contracts", {
    filter: { company_id: empresa.id },
    sort: { field: "renews_on", order: "ASC" },
    pagination: { page: 1, perPage: 100 },
  });
  const { data: compras } = useGetList<Purchase>("purchases", {
    filter: { company_id: empresa.id },
    sort: { field: "purchased_on", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RecordContextProvider value={empresa}>
          <EtapaDeCliente />
        </RecordContextProvider>
        <div className="flex gap-2">
          <NuevoContrato empresaId={empresa.id} />
          <NuevaCompra empresaId={empresa.id} />
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Cifra
            etiqueta={translate("crm.customers.fields.total_spent")}
            valor={importe(resumen.total_spent)}
          />
          <Cifra
            etiqueta={translate("crm.customers.fields.nb_purchases")}
            valor={String(resumen.nb_purchases)}
          />
          <Cifra
            etiqueta={translate("crm.customers.fields.recurring_amount")}
            valor={importe(resumen.recurring_amount)}
          />
          <Cifra
            etiqueta={translate("crm.customers.fields.next_renewal_on")}
            valor={fecha(resumen.next_renewal_on)}
          />
        </div>
      )}

      <Separator />

      <section className="space-y-2">
        <h6 className="text-sm font-semibold">
          {translate("crm.customers.contracts")}
        </h6>
        {!contratos?.length ? (
          <p className="text-sm text-muted-foreground">
            {translate("crm.customers.no_contracts")}
          </p>
        ) : (
          contratos.map((contrato) => (
            <div
              key={contrato.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{contrato.name}</p>
                <p className="text-xs text-muted-foreground">
                  {contrato.billing_period
                    ? translate(
                        `crm.customers.period.${contrato.billing_period}`,
                      )
                    : ""}
                  {contrato.renews_on
                    ? ` · ${translate("crm.customers.renews_on")} ${fecha(contrato.renews_on)}`
                    : ""}
                  {contrato.source !== "manual" ? ` · ${contrato.source}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{importe(contrato.amount)}</span>
                <Badge
                  variant={
                    contrato.status === "active" ? "default" : "secondary"
                  }
                >
                  {translate(
                    `crm.customers.contract_status.${contrato.status}`,
                  )}
                </Badge>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h6 className="text-sm font-semibold">
          {translate("crm.customers.purchases")}
        </h6>
        {!compras?.length ? (
          <p className="text-sm text-muted-foreground">
            {translate("crm.customers.no_purchases")}
          </p>
        ) : (
          compras.map((compra) => (
            <FilaDeCompra key={compra.id} compra={compra} />
          ))
        )}
      </section>
    </div>
  );
};

const FilaDeCompra = ({ compra }: { compra: Purchase }) => {
  const translate = useTranslate();
  const importe = useImporte();
  const { data: lineas } = useGetList<PurchaseItem>("purchase_items", {
    filter: { purchase_id: compra.id },
    pagination: { page: 1, perPage: 50 },
  });

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {fecha(compra.purchased_on)}
            {compra.reference ? ` · ${compra.reference}` : ""}
          </p>
          {compra.source !== "manual" && (
            <p className="text-xs text-muted-foreground">{compra.source}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium">{importe(compra.amount)}</span>
          <Badge variant={compra.status === "paid" ? "default" : "secondary"}>
            {translate(`crm.customers.purchase_status.${compra.status}`)}
          </Badge>
        </div>
      </div>
      {!!lineas?.length && (
        <ul className="mt-2 space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
          {lineas.map((linea) => (
            <li key={linea.id} className="flex justify-between gap-2">
              <span>
                {Number(linea.quantity) !== 1 ? `${linea.quantity} × ` : ""}
                {linea.description}
              </span>
              <span>{importe(linea.amount ?? linea.unit_price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Alta manual de un contrato, para quien no tiene sistema externo. */
const NuevoContrato = ({ empresaId }: { empresaId: Company["id"] }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const [abierto, setAbierto] = useState(false);
  const [create, { isPending }] = useCreate();

  const guardar = async (valores: Record<string, unknown>) => {
    try {
      await create(
        "contracts",
        {
          data: {
            company_id: empresaId,
            name: valores.name,
            status: valores.status ?? "active",
            billing_period: valores.billing_period ?? null,
            amount: valores.amount ?? null,
            started_on: valores.started_on ?? null,
            renews_on: valores.renews_on ?? null,
            source: "manual",
          },
        },
        { returnPromise: true },
      );
      notify("crm.customers.contract_created", { type: "info" });
      setAbierto(false);
      refresh();
    } catch {
      notify("crm.customers.save_error", { type: "error" });
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Plus className="mr-1 h-4 w-4" />
        {translate("crm.customers.new_contract")}
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("crm.customers.new_contract")}</DialogTitle>
          </DialogHeader>
          <Form
            onSubmit={guardar}
            defaultValues={{ status: "active", billing_period: "monthly" }}
          >
            <div className="flex flex-col gap-3">
              <TextInput
                source="name"
                label="crm.customers.fields.contract_name"
                validate={required()}
                helperText={false}
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  source="amount"
                  label="crm.customers.fields.amount"
                  helperText={false}
                />
                <SelectInput
                  source="billing_period"
                  label="crm.customers.fields.billing_period"
                  choices={PERIODOS}
                  helperText={false}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DateInput
                  source="started_on"
                  label="crm.customers.fields.started_on"
                  helperText={false}
                />
                <DateInput
                  source="renews_on"
                  label="crm.customers.fields.renews_on"
                  helperText="crm.customers.fields.renews_on_help"
                />
              </div>
              <SelectInput
                source="status"
                label="crm.customers.fields.status"
                choices={ESTADOS_DE_CONTRATO}
                helperText={false}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {translate("ra.action.save")}
                </Button>
              </div>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

/** Alta manual de una compra con una línea. */
const NuevaCompra = ({ empresaId }: { empresaId: Company["id"] }) => {
  const translate = useTranslate();
  const notify = useNotify();
  const refresh = useRefresh();
  const [abierto, setAbierto] = useState(false);
  const [create, { isPending }] = useCreate();

  const guardar = async (valores: Record<string, unknown>) => {
    try {
      const importe = Number(valores.amount ?? 0);
      const compra = (await create(
        "purchases",
        {
          data: {
            company_id: empresaId,
            reference: valores.reference || null,
            purchased_on: valores.purchased_on,
            amount: importe,
            status: valores.status ?? "paid",
            source: "manual",
          },
        },
        { returnPromise: true },
      )) as Purchase;

      // La compra manual lleva una sola línea: lo que se vendió. Quien
      // necesite el detalle a varias líneas lo tiene por la API de ingesta.
      if (valores.description) {
        await create(
          "purchase_items",
          {
            data: {
              purchase_id: compra.id,
              description: valores.description,
              quantity: 1,
              unit_price: importe,
              amount: importe,
            },
          },
          { returnPromise: true },
        );
      }
      notify("crm.customers.purchase_created", { type: "info" });
      setAbierto(false);
      refresh();
    } catch {
      notify("crm.customers.save_error", { type: "error" });
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <Plus className="mr-1 h-4 w-4" />
        {translate("crm.customers.new_purchase")}
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("crm.customers.new_purchase")}</DialogTitle>
          </DialogHeader>
          <Form
            onSubmit={guardar}
            defaultValues={{
              status: "paid",
              purchased_on: new Date().toISOString().slice(0, 10),
            }}
          >
            <div className="flex flex-col gap-3">
              <TextInput
                source="description"
                label="crm.customers.fields.description"
                validate={required()}
                helperText="crm.customers.fields.description_help"
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  source="amount"
                  label="crm.customers.fields.amount"
                  validate={required()}
                  helperText={false}
                />
                <DateInput
                  source="purchased_on"
                  label="crm.customers.fields.purchased_on"
                  validate={required()}
                  helperText={false}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  source="reference"
                  label="crm.customers.fields.reference"
                  helperText={false}
                />
                <SelectInput
                  source="status"
                  label="crm.customers.fields.status"
                  choices={ESTADOS_DE_COMPRA}
                  helperText={false}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {translate("ra.action.save")}
                </Button>
              </div>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

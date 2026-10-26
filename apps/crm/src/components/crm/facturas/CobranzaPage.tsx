import { Clock, FileText, HandCoins, Loader2, ShieldAlert } from "lucide-react";
import { useGetList, useGetMany, useTranslate, type Identifier } from "ra-core";
import { useState } from "react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Company, Contract, Invoice } from "../types";
import { FilaDeFactura } from "./PorFacturarPage";
import {
  diasDeAtraso,
  hoyEnMexico,
  resumirCobranza,
  type Monto,
} from "./cobranza";
import { fechaCorta, fechaDeVigencia, importeDe } from "./formatoDeFacturas";
import { PageHero, StatCard, StatGrid } from "../misc/Patrones";

/**
 * Cobranza: cuántas facturas se han emitido, cuánto falta por cobrar y qué
 * clientes pagan por transferencia. Registrar un pago se hace en la misma
 * fila de la factura (BotonRegistrarPago), que además renueva el acceso en
 * KontrolIA Auth; aquí solo se ve y se encuentra lo pendiente.
 */

type Pestana = "por_cobrar" | "vencidas" | "acceso" | "contratos";

const PESTANAS: Pestana[] = ["por_cobrar", "vencidas", "acceso", "contratos"];

// Lo que se emitió y no se ha pagado del todo.
const FILTRO_POR_COBRAR = {
  status: "stamped",
  "payment_status@in": "(unpaid,partial)",
};

// Pagada, pero KontrolIA Auth no extendió el acceso: el cliente pagó y aun
// así lo pueden suspender.
const FILTRO_ACCESO = { "access_status@in": "(error,skipped)" };

// Más que esto no cabe en una pantalla de cobranza; si llega a pasar, el
// resumen lo dice en vez de quedarse corto en silencio.
const LIMITE = 500;

export const CobranzaPage = () => {
  const translate = useTranslate();
  const [pestana, setPestana] = useState<Pestana>("por_cobrar");
  const hoy = hoyEnMexico();

  const {
    data: porCobrar,
    total: totalPorCobrar,
    isPending,
    refetch,
  } = useGetList<Invoice>("invoices", {
    filter: FILTRO_POR_COBRAR,
    sort: { field: "due_on", order: "ASC" },
    pagination: { page: 1, perPage: LIMITE },
  });
  const { total: emitidas } = useGetList<Invoice>("invoices", {
    filter: { status: "stamped" },
    pagination: { page: 1, perPage: 1 },
  });
  const { total: sinRenovar } = useGetList<Invoice>("invoices", {
    filter: FILTRO_ACCESO,
    pagination: { page: 1, perPage: 1 },
  });

  const facturas = porCobrar ?? [];
  const resumen = resumirCobranza(facturas, hoy);
  const vencidas = facturas.filter((f) => diasDeAtraso(f.due_on, hoy) > 0);

  return (
    <div className="mt-8 mb-16 flex flex-col gap-6">
      <PageHero
        badge={translate("crm.modules.invoicing.name")}
        title={translate("crm.customer_billing.collections.title")}
        description={translate("crm.customer_billing.collections.intro")}
      />

      <StatGrid>
        <StatCard
          tono="total"
          icon={<FileText />}
          title={translate("crm.customer_billing.collections.cards.issued")}
          value={emitidas ?? "—"}
        />
        <StatCard
          tono="info"
          icon={<HandCoins />}
          title={translate("crm.customer_billing.collections.cards.receivable")}
          value={textoDeMonto(resumen.porCobrar)}
          trend={translate("crm.customer_billing.collections.cards.count", {
            smart_count: resumen.porCobrar.cantidad,
          })}
        />
        <StatCard
          tono="error"
          icon={<Clock />}
          title={translate("crm.customer_billing.collections.cards.overdue")}
          value={textoDeMonto(resumen.vencidas)}
          trend={translate("crm.customer_billing.collections.cards.count", {
            smart_count: resumen.vencidas.cantidad,
          })}
        />
        <StatCard
          tono="fecha"
          icon={<ShieldAlert />}
          title={translate(
            "crm.customer_billing.collections.cards.access_failed",
          )}
          value={sinRenovar ?? "—"}
        />
      </StatGrid>
      {(totalPorCobrar ?? 0) > LIMITE && (
        <p className="text-xs text-muted-foreground">
          {translate("crm.customer_billing.collections.truncated", {
            shown: LIMITE,
            total: totalPorCobrar,
          })}
        </p>
      )}

      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)}>
        <TabsList>
          {PESTANAS.map((clave) => (
            <TabsTrigger key={clave} value={clave}>
              {translate(`crm.customer_billing.collections.tabs.${clave}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {pestana === "por_cobrar" && (
        <ListaDeFacturas
          facturas={facturas}
          cargando={isPending}
          vacia="crm.customer_billing.collections.empty.por_cobrar"
          hoy={hoy}
          alCambiar={() => refetch()}
        />
      )}
      {pestana === "vencidas" && (
        <ListaDeFacturas
          facturas={vencidas}
          cargando={isPending}
          vacia="crm.customer_billing.collections.empty.vencidas"
          hoy={hoy}
          alCambiar={() => refetch()}
        />
      )}
      {pestana === "acceso" && <AccesoSinRenovar hoy={hoy} />}
      {pestana === "contratos" && <ContratosPorTransferencia />}
    </div>
  );
};

CobranzaPage.path = "/cobranza";

/** El saldo por moneda; no se suman pesos con dólares. */
const textoDeMonto = (monto: Monto): string =>
  Object.keys(monto.importes).length
    ? Object.entries(monto.importes)
        .map(([moneda, importe]) => importeDe(importe, moneda))
        .join(" · ")
    : importeDe(0);

const idsDe = (valores: (Identifier | null | undefined)[]): Identifier[] => [
  ...new Set(valores.filter((id): id is Identifier => id != null)),
];

const ListaDeFacturas = ({
  facturas,
  cargando,
  vacia,
  hoy,
  alCambiar,
}: {
  facturas: Invoice[];
  cargando: boolean;
  vacia: string;
  hoy: string;
  alCambiar: () => void;
}) => {
  const translate = useTranslate();
  const { data: empresas } = useGetMany<Company>("companies", {
    ids: idsDe(facturas.map((f) => f.company_id)),
  });
  const { data: contratos } = useGetMany<Contract>("contracts", {
    ids: idsDe(facturas.map((f) => f.contract_id)),
  });

  if (cargando) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (!facturas.length) {
    return <p className="text-sm text-muted-foreground">{translate(vacia)}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {facturas.map((factura) => {
        const atraso = diasDeAtraso(factura.due_on, hoy);
        return (
          <div key={factura.id} className="flex flex-col gap-1">
            {atraso > 0 && (
              <p className="text-xs font-medium text-destructive">
                {translate("crm.customer_billing.collections.overdue_days", {
                  smart_count: atraso,
                })}
              </p>
            )}
            <FilaDeFactura
              factura={factura}
              empresa={empresas?.find((e) => e.id === factura.company_id)}
              contrato={contratos?.find((c) => c.id === factura.contract_id)}
              alCambiar={alCambiar}
            />
          </div>
        );
      })}
    </div>
  );
};

const AccesoSinRenovar = ({ hoy }: { hoy: string }) => {
  const { data, isPending, refetch } = useGetList<Invoice>("invoices", {
    filter: FILTRO_ACCESO,
    sort: { field: "paid_at", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });
  return (
    <ListaDeFacturas
      facturas={data ?? []}
      cargando={isPending}
      vacia="crm.customer_billing.collections.empty.acceso"
      hoy={hoy}
      alCambiar={() => refetch()}
    />
  );
};

/**
 * Los clientes que pagan por transferencia: nadie les cobra solo, así que
 * aquí se ve cuándo renueva cada uno y quién ya está en días de gracia.
 */
const ContratosPorTransferencia = () => {
  const translate = useTranslate();
  const { data, isPending } = useGetList<Contract>("contracts", {
    filter: { provider: "manual", "status@in": "(active,paused)" },
    sort: { field: "renews_on", order: "ASC" },
    pagination: { page: 1, perPage: 200 },
  });
  const contratos = data ?? [];
  const { data: empresas } = useGetMany<Company>("companies", {
    ids: idsDe(contratos.map((c) => c.company_id)),
  });

  if (isPending) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (!contratos.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {translate("crm.customer_billing.collections.empty.contratos")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {contratos.map((contrato) => {
        const empresa = empresas?.find((e) => e.id === contrato.company_id);
        return (
          <div
            key={contrato.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3 text-sm"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium">
                {empresa ? (
                  <Link to={`/companies/${empresa.id}/show`}>
                    {empresa.name}
                  </Link>
                ) : (
                  "—"
                )}
                {" · "}
                {contrato.plan_name ?? contrato.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {translate("crm.customer_billing.collections.renews_on", {
                  date: fechaCorta(contrato.renews_on),
                })}
                {contrato.billing_period
                  ? ` · ${translate(
                      `crm.customers.period.${contrato.billing_period}`,
                      { _: contrato.billing_period },
                    )}`
                  : ""}
              </p>
              {contrato.in_grace && (
                <p className="text-xs font-medium text-destructive">
                  {translate("crm.customer_billing.collections.in_grace", {
                    date: fechaDeVigencia(contrato.grace_until),
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Number(contrato.amount ?? 0) > 0 && (
                <span className="font-medium tabular-nums">
                  {importeDe(contrato.amount, contrato.currency)}
                </span>
              )}
              <Badge variant={contrato.billing_enabled ? "default" : "outline"}>
                {translate(
                  contrato.billing_enabled
                    ? "crm.customer_billing.collections.auto_billing_on"
                    : "crm.customer_billing.collections.auto_billing_off",
                )}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};

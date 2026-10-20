import { z } from "zod";

import {
  aCentavos,
  conceptoDesdePlantilla,
  productoDelContrato,
} from "./planear";
import { fechaDeInstante, instanteIso, textoDelPeriodo } from "./periodos";
import type {
  AjustesDeFacturacion,
  ContratoAFacturar,
  FacturaPlaneada,
  RenglonPlaneado,
} from "./tipos";

/**
 * Cobros con tarjeta: KontrolIA Auth cobra con Stripe y avisa con
 * `payment.succeeded`. La factura sale ya PAGADA (PUE, forma de tarjeta) y
 * su total es exactamente lo cobrado: el cobro de tarjeta INCLUYE el IVA,
 * así que el subtotal se despeja de ahí.
 *
 * Contrato del aviso: apps/auth-server/public/platform-webhooks.md del repo
 * de KontrolIA Auth. Importes en CENTAVOS.
 */

export const EVENTO_DE_COBRO = "payment.succeeded";

const texto = z.string().nullish();
const numero = z.coerce.number().nullish();
const instante = z.union([z.string(), z.number()]).nullish();

const LineaDeStripe = z
  .object({
    description: texto,
    amount: numero,
    quantity: numero,
    priceId: texto,
    productId: texto,
  })
  .passthrough();

export const DatosDeCobro = z.object({
  subscription_event_id: z
    .union([z.string(), z.number()])
    .transform(String)
    .nullish(),
  kind: z.enum(["subscription", "credits"]).default("subscription"),
  subscription_id: texto,
  provider: texto,
  payload: z
    .object({
      invoiceId: texto,
      sessionId: texto,
      amountPaid: numero,
      currency: texto,
      periodStart: instante,
      periodEnd: instante,
      number: texto,
      paidAt: instante,
      limitKey: texto,
      units: numero,
      lines: z.array(LineaDeStripe).nullish(),
    })
    .passthrough(),
});

export type DatosDeCobro = z.infer<typeof DatosDeCobro>;

/** El aviso completo: lo que interesa de él para facturar el cobro. */
export const AvisoDeCobro = z.object({
  id: texto,
  type: texto,
  organization_id: z.string(),
  application: z
    .object({ slug: z.string(), name: texto })
    .passthrough()
    .nullish(),
  data: DatosDeCobro,
});

export type AvisoDeCobro = z.infer<typeof AvisoDeCobro>;

/**
 * Reparte un subtotal entre renglones en proporción a lo cobrado por cada
 * uno; el último se queda con los centavos que sobren del redondeo, para que
 * la suma cuadre exacto.
 */
export const repartir = (subtotal: number, pesos: number[]): number[] => {
  const total = pesos.reduce((s, p) => s + p, 0);
  if (total <= 0) return pesos.map(() => 0);
  const partes = pesos.map((p) => aCentavos((subtotal * p) / total));
  const suma = partes.slice(0, -1).reduce((s, p) => s + p, 0);
  partes[partes.length - 1] = aCentavos(subtotal - suma);
  return partes;
};

/** Referencia del cobro que lo hace único (para no facturarlo dos veces). */
export const referenciaDelCobro = (
  aviso: Pick<AvisoDeCobro, "id" | "data">,
): string | null =>
  aviso.data.payload.invoiceId ||
  aviso.data.payload.sessionId ||
  aviso.data.subscription_event_id ||
  aviso.id ||
  null;

/**
 * La factura de un cobro con tarjeta, o null si no hay nada que facturar
 * (un cobro de cero: periodo de prueba o cupón del 100 %).
 */
export const facturaDeCobro = (
  aviso: AvisoDeCobro,
  contexto: {
    ajustes: AjustesDeFacturacion;
    contrato: ContratoAFacturar | null;
    companyId: number | null;
  },
): FacturaPlaneada | null => {
  const { ajustes, contrato } = contexto;
  const { data } = aviso;
  const centavos = Number(data.payload.amountPaid ?? 0);
  if (!Number.isFinite(centavos) || centavos <= 0) return null;

  const total = aCentavos(centavos / 100);
  const subtotal = aCentavos(total / (1 + ajustes.tax_rate));
  const tax = aCentavos(total - subtotal);
  const esCredito = data.kind === "credits";

  const producto = contrato
    ? productoDelContrato(contrato)
    : aviso.application?.name || aviso.application?.slug || "Servicio";
  const inicio = fechaDeInstante(data.payload.periodStart);
  // Stripe da el fin como instante exclusivo: el último día pagado es el
  // anterior.
  const finExclusivo = fechaDeInstante(data.payload.periodEnd);
  const fin =
    finExclusivo && inicio && finExclusivo > inicio
      ? new Date(Date.parse(`${finExclusivo}T00:00:00Z`) - 86_400_000)
          .toISOString()
          .slice(0, 10)
      : null;
  const periodoTexto = inicio && fin ? textoDelPeriodo(inicio, fin) : null;

  const base = {
    quantity: 1,
    clave_prod_serv: ajustes.clave_prod_serv,
    clave_unidad: ajustes.clave_unidad,
    tax_rate: ajustes.tax_rate,
  };

  let renglones: RenglonPlaneado[];
  const lineas = data.payload.lines ?? [];
  const importes = lineas.map((l) => Number(l.amount ?? NaN));
  // Las líneas de Stripe sirven si todas son importes positivos que suman lo
  // cobrado. Un prorrateo trae líneas negativas, que un CFDI no admite: en
  // ese caso, una sola línea con la plantilla.
  const lineasUtiles =
    !esCredito &&
    lineas.length > 0 &&
    importes.every((i) => Number.isFinite(i) && i > 0) &&
    importes.reduce((s, i) => s + i, 0) === centavos;

  if (esCredito) {
    const unidades = Number(data.payload.units ?? 0);
    const concepto = [
      "Paquete de",
      unidades > 0 ? String(unidades) : null,
      data.payload.limitKey || "créditos",
    ]
      .filter(Boolean)
      .join(" ");
    renglones = [
      {
        ...base,
        position: 0,
        description: `${producto} · ${concepto}`.slice(0, 1000),
        product_ref: [aviso.application?.slug, data.payload.limitKey]
          .filter(Boolean)
          .join(":") || null,
        unit_price: subtotal,
        amount: subtotal,
      },
    ];
  } else if (lineasUtiles) {
    const partes = repartir(subtotal, importes);
    renglones = lineas.map((linea, i) => ({
      ...base,
      position: i,
      description: (
        linea.description?.trim() ||
        conceptoDesdePlantilla(ajustes.concept_template, {
          producto,
          plan: contrato?.plan_name ?? null,
          periodo: periodoTexto,
        })
      ).slice(0, 1000),
      product_ref: linea.priceId ?? linea.productId ?? null,
      unit_price: partes[i],
      amount: partes[i],
    }));
  } else {
    renglones = [
      {
        ...base,
        position: 0,
        description: conceptoDesdePlantilla(ajustes.concept_template, {
          producto,
          plan: contrato?.plan_name ?? null,
          periodo: periodoTexto,
        }),
        product_ref: aviso.application?.slug ?? null,
        unit_price: subtotal,
        amount: subtotal,
      },
    ];
  }

  return {
    origin: esCredito ? "credits" : "card",
    contract_id: contrato?.id ?? null,
    company_id: contexto.companyId,
    period_start: esCredito ? null : inicio,
    period_end: esCredito ? null : fin,
    due_on: null,
    currency: (data.payload.currency || contrato?.currency || "MXN")
      .toUpperCase()
      .slice(0, 3),
    payment_method: "PUE",
    payment_form: ajustes.forma_pago_tarjeta,
    payment_status: "paid",
    paid_amount: total,
    paid_at: instanteIso(data.payload.paidAt) ?? new Date().toISOString(),
    source_ref: referenciaDelCobro(aviso),
    subtotal,
    tax,
    total,
    renglones,
    periodo_texto: periodoTexto,
    producto,
  };
};

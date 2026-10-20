import { z } from "zod";

import type { EstadoDePago } from "./tipos";

/**
 * Lo que Faqturia cuenta de una factura (su detalle, igual en GET
 * /invoices/:id y en el `data` de sus avisos) convertido en cambios para
 * crm.invoices. Puro, para poder probarlo.
 *
 * Estados de Faqturia: draft | pendiente | timbrada | parcialmente_pagada |
 * pagada | cancelada.
 */

const texto = z.string().nullish();
const numero = z.coerce.number().nullish();

export const DetalleDeFaqturia = z
  .object({
    id: z.string(),
    organization_id: texto,
    status: z.string(),
    uuid: texto,
    serie: texto,
    folio: texto,
    total: numero,
    monto_pagado: numero,
    moneda: texto,
    fecha_emision: texto,
    fecha_pago: texto,
    fecha_cancelacion: texto,
    updated_at: texto,
  })
  .passthrough();

export type DetalleDeFaqturia = z.infer<typeof DetalleDeFaqturia>;

/** Un aviso (webhook) de Faqturia. */
export const AvisoDeFaqturia = z.object({
  id: texto,
  event: texto,
  api_version: texto,
  created_at: texto,
  organization_id: z.string(),
  data: DetalleDeFaqturia,
});

export type AvisoDeFaqturia = z.infer<typeof AvisoDeFaqturia>;

/** Los eventos que tocan a una factura de ingreso. */
export const EVENTOS_DE_FACTURA = new Set([
  "invoice.created",
  "invoice.stamped",
  "invoice.canceled",
  "invoice.paid",
  "invoice.partially_paid",
]);

const ORDEN_DE_PAGO: Record<EstadoDePago, number> = {
  unpaid: 0,
  partial: 1,
  paid: 2,
};

/** Lo que el CRM ya sabe de la factura (para no retroceder). */
export interface FacturaActual {
  billing_status: string | null;
  payment_status: EstadoDePago | null;
  paid_amount: number | string | null;
  paid_at: string | null;
  total: number | string | null;
}

/**
 * Cambios a aplicar. Dos reglas:
 *   - El pago nunca retrocede: una factura PUE que el CRM ya marcó pagada
 *     (cobro con tarjeta) puede salir de Faqturia como «timbrada» sin pago
 *     registrado allá, y no por eso deja de estar pagada.
 *   - La cancelación manda sobre todo lo demás.
 */
export const cambiosDesdeFaqturia = (
  detalle: DetalleDeFaqturia,
  actual: FacturaActual,
  ahora = new Date().toISOString(),
): Record<string, unknown> => {
  const cambios: Record<string, unknown> = {};
  if (detalle.uuid) cambios.uuid = detalle.uuid;
  if (detalle.serie) cambios.serie = detalle.serie;
  if (detalle.folio) cambios.folio = detalle.folio;
  if (detalle.total != null && Number(detalle.total) > 0) {
    cambios.total = Number(detalle.total);
  }
  if (detalle.fecha_emision) cambios.issued_at = detalle.fecha_emision;

  const estado = detalle.status;
  if (estado === "cancelada") {
    cambios.status = "cancelled";
    cambios.billing_status = "cancelled";
  } else if (actual.billing_status === "cancelled") {
    // Cancelada es definitivo: un aviso atrasado no la revive.
  } else if (
    estado === "timbrada" ||
    estado === "parcialmente_pagada" ||
    estado === "pagada"
  ) {
    cambios.status = "stamped";
    cambios.billing_status = "stamped";
    cambios.error = null;
  } else if (
    actual.billing_status !== "stamped" &&
    actual.billing_status !== "cancelled"
  ) {
    // Un aviso viejo («creada») que llega después del de «timbrada» no
    // regresa la factura a borrador.
    cambios.status = "draft";
  }

  const total = Number(detalle.total ?? actual.total ?? 0);
  const pagadoAlla = Number(detalle.monto_pagado ?? 0);
  let pagoAlla: EstadoDePago = "unpaid";
  if (estado === "pagada" || (total > 0 && pagadoAlla >= total)) {
    pagoAlla = "paid";
  } else if (estado === "parcialmente_pagada" || pagadoAlla > 0) {
    pagoAlla = "partial";
  }

  const pagoActual = actual.payment_status ?? "unpaid";
  if (ORDEN_DE_PAGO[pagoAlla] > ORDEN_DE_PAGO[pagoActual]) {
    cambios.payment_status = pagoAlla;
  }
  const pagadoActual = Number(actual.paid_amount ?? 0);
  const pagadoNuevo =
    pagoAlla === "paid" && pagadoAlla <= 0 ? total : pagadoAlla;
  if (pagadoNuevo > pagadoActual) cambios.paid_amount = pagadoNuevo;
  if (
    !actual.paid_at &&
    (cambios.payment_status === "paid" || pagoActual === "paid")
  ) {
    cambios.paid_at = detalle.fecha_pago || detalle.updated_at || ahora;
  }

  cambios.updated_at = ahora;
  return cambios;
};

import { LOCALE } from "../misc/RelativeDate";
import type { Invoice, InvoiceBillingStatus } from "../types";

/** Utilidades de presentación del módulo de facturación. */

export const importeDe = (valor: unknown, moneda = "MXN"): string =>
  Number(valor ?? 0).toLocaleString(LOCALE, {
    style: "currency",
    currency: moneda || "MXN",
  });

/** Una fecha de calendario (AAAA-MM-DD) sin que la zona la corra un día. */
export const fechaCorta = (valor?: string | null): string =>
  valor
    ? new Date(`${valor.slice(0, 10)}T00:00:00`).toLocaleDateString(LOCALE, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const periodoDe = (
  factura: Pick<Invoice, "period_start" | "period_end">,
): string =>
  factura.period_start && factura.period_end
    ? `${fechaCorta(factura.period_start)} – ${fechaCorta(factura.period_end)}`
    : factura.period_end
      ? `— ${fechaCorta(factura.period_end)}`
      : "—";

export const folioDe = (factura: Pick<Invoice, "serie" | "folio">) =>
  [factura.serie, factura.folio].filter(Boolean).join("-");

export const VARIANTE_DE_BANDEJA: Record<
  InvoiceBillingStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending_review: "secondary",
  missing_data: "outline",
  queued: "secondary",
  stamping: "secondary",
  stamped: "default",
  error: "destructive",
  cancelled: "outline",
  discarded: "outline",
};

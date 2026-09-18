import type { Quote, QuoteStatus } from "../types";

const hoy = () => new Date().toISOString().slice(0, 10);

/**
 * El estado que ve la persona: una enviada cuya vigencia ya pasó se muestra
 * vencida aunque en la base siga como `sent`, que es lo que le importa al
 * comercial —ya no la puede aceptar nadie.
 */
export const estadoVisible = (cotizacion: Quote): QuoteStatus =>
  (cotizacion.status === "sent" || cotizacion.status === "viewed") &&
  cotizacion.valid_until &&
  cotizacion.valid_until < hoy()
    ? "expired"
    : cotizacion.status;

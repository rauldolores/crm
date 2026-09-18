import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";

import type { Ticket } from "../types";

export type EstadoDePlazo = "none" | "pending" | "overdue" | "met" | "late";

export interface Plazo {
  estado: EstadoDePlazo;
  /** Distancia legible («3 horas») entre el plazo y el momento relevante. */
  distancia: string;
}

const distancia = (a: Date, b: Date) =>
  formatDistanceStrict(a, b, { locale: es });

/**
 * Un plazo (`vence`) frente a lo que pasó (`cumplido`, cuando ya pasó) o
 * frente a ahora (cuando sigue pendiente).
 */
const evaluar = (
  vence: string | null | undefined,
  cumplido: string | null | undefined,
  ahora: Date,
): Plazo => {
  if (!vence) return { estado: "none", distancia: "" };
  const limite = new Date(vence);
  if (cumplido) {
    const hecho = new Date(cumplido);
    return hecho <= limite
      ? { estado: "met", distancia: "" }
      : { estado: "late", distancia: distancia(hecho, limite) };
  }
  return limite < ahora
    ? { estado: "overdue", distancia: distancia(ahora, limite) }
    : { estado: "pending", distancia: distancia(limite, ahora) };
};

/** Los dos plazos de un ticket, ya evaluados. */
export const plazosDeTicket = (ticket: Ticket, ahora = new Date()) => ({
  respuesta: evaluar(
    ticket.first_response_due_at,
    ticket.first_response_at,
    ahora,
  ),
  resolucion: evaluar(
    ticket.due_at,
    ticket.status === "closed" ? (ticket.closed_at ?? ticket.updated_at) : null,
    ahora,
  ),
});

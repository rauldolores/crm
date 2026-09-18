import type { TicketSla } from "../root/ConfigurationContext";

/** Deja solo horas válidas (> 0); una fila vacía es «sin plazo». */
export const limpiarSla = (sla: TicketSla | undefined): TicketSla => {
  const limpio: TicketSla = {};
  for (const [prioridad, objetivo] of Object.entries(sla ?? {})) {
    const horas = (n: unknown) =>
      typeof n === "number" && Number.isFinite(n) && n > 0
        ? Math.round(n)
        : null;
    const firstResponseHours = horas(objetivo?.firstResponseHours);
    const resolutionHours = horas(objetivo?.resolutionHours);
    if (firstResponseHours != null || resolutionHours != null) {
      limpio[prioridad] = { firstResponseHours, resolutionHours };
    }
  }
  return limpio;
};

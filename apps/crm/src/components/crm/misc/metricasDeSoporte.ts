import type { Ticket, TicketEvent } from "../types";

/**
 * Las cifras del informe de soporte a partir de los tickets y las
 * reaperturas. `desde` acota lo que pasó en el periodo (creados, cerrados,
 * tiempos, SLA, CSAT, reaperturas); lo que está abierto o vencido ahora no
 * depende del periodo.
 */
export interface MetricasDeSoporte {
  creados: number;
  cerrados: number;
  abiertos: number;
  vencidos: number;
  /** Media en horas; null si ningún ticket del periodo tuvo ese dato. */
  mediaPrimeraRespuestaHoras: number | null;
  mediaResolucionHoras: number | null;
  /** % de tickets cerrados en plazo, entre los cerrados que tenían plazo. */
  slaCumplidoPct: number | null;
  conPlazo: number;
  /** Promedio de la encuesta (1 a 5) y cuántas respuestas lo forman. */
  csat: number | null;
  encuestas: number;
  reaperturas: number;
  porCategoria: Record<string, number>;
  abiertosPorResponsable: Record<string, number>;
}

const HORA = 60 * 60 * 1000;

const horasEntre = (desde: string, hasta: string) =>
  (new Date(hasta).getTime() - new Date(desde).getTime()) / HORA;

const media = (valores: number[]) =>
  valores.length
    ? valores.reduce((total, v) => total + v, 0) / valores.length
    : null;

export const metricasDeSoporte = (
  tickets: Ticket[],
  reaperturas: TicketEvent[],
  desde: Date | null,
  ahora = new Date(),
): MetricasDeSoporte => {
  const enPeriodo = (fecha?: string | null) =>
    !!fecha && (!desde || new Date(fecha) >= desde);

  const creados = tickets.filter((t) => enPeriodo(t.created_at));
  const cerrados = tickets.filter(
    (t) => t.status === "closed" && enPeriodo(t.closed_at),
  );
  const abiertosAhora = tickets.filter((t) => t.status !== "closed");

  const respuestas = creados
    .filter((t) => t.first_response_at && t.created_at)
    .map((t) => horasEntre(t.created_at!, t.first_response_at!));
  const resoluciones = cerrados
    .filter((t) => t.closed_at && t.created_at)
    .map((t) => horasEntre(t.created_at!, t.closed_at!));

  const cerradosConPlazo = cerrados.filter((t) => t.due_at && t.closed_at);
  const enPlazo = cerradosConPlazo.filter(
    (t) => new Date(t.closed_at!) <= new Date(t.due_at!),
  );

  const conEncuesta = tickets.filter(
    (t) => t.satisfaction_rating && enPeriodo(t.satisfaction_at),
  );

  const porCategoria: Record<string, number> = {};
  for (const t of creados) {
    const clave = t.category ?? "";
    porCategoria[clave] = (porCategoria[clave] ?? 0) + 1;
  }
  const abiertosPorResponsable: Record<string, number> = {};
  for (const t of abiertosAhora) {
    const clave = t.sales_id == null ? "" : String(t.sales_id);
    abiertosPorResponsable[clave] = (abiertosPorResponsable[clave] ?? 0) + 1;
  }

  return {
    creados: creados.length,
    cerrados: cerrados.length,
    abiertos: abiertosAhora.length,
    vencidos: abiertosAhora.filter(
      (t) => t.due_at && new Date(t.due_at) < ahora,
    ).length,
    mediaPrimeraRespuestaHoras: media(respuestas),
    mediaResolucionHoras: media(resoluciones),
    slaCumplidoPct: cerradosConPlazo.length
      ? (enPlazo.length / cerradosConPlazo.length) * 100
      : null,
    conPlazo: cerradosConPlazo.length,
    csat: media(conEncuesta.map((t) => t.satisfaction_rating!)),
    encuestas: conEncuesta.length,
    reaperturas: reaperturas.filter((e) => enPeriodo(e.created_at)).length,
    porCategoria,
    abiertosPorResponsable,
  };
};

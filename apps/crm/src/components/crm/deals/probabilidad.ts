import { defaultDealStages } from "../root/defaultConfiguration";
import type { Deal, DealPipeline } from "../types";

/**
 * Probabilidad de cierre (0-100) de una etapa. Manda la que se configuró en
 * Ajustes; sin ella, una ganada vale 100, una perdida 0, una etapa de las
 * de serie (opportunity, proposal-sent, delayed…) toma la probabilidad de
 * serie —las organizaciones existentes tienen esas etapas guardadas sin
 * probabilidad— y las demás se reparten a intervalos iguales según su orden
 * en el embudo (con tres etapas abiertas: 25, 50, 75), que es la
 * aproximación clásica cuando nadie ha medido todavía.
 */
export const probabilidadDeEtapa = (
  embudo: Pick<DealPipeline, "stages" | "pipelineStatuses" | "lostStages">,
  stage: string,
): number => {
  const etapa = embudo.stages.find((candidata) => candidata.value === stage);
  if (typeof etapa?.probability === "number") {
    return Math.max(0, Math.min(100, etapa.probability));
  }
  if ((embudo.pipelineStatuses ?? []).includes(stage)) return 100;
  if ((embudo.lostStages ?? []).includes(stage)) return 0;
  const deSerie = defaultDealStages.find(
    (candidata) => candidata.value === stage,
  );
  if (typeof deSerie?.probability === "number") return deSerie.probability;
  const abiertas = embudo.stages.filter(
    (candidata) =>
      !(embudo.pipelineStatuses ?? []).includes(candidata.value) &&
      !(embudo.lostStages ?? []).includes(candidata.value),
  );
  const posicion = abiertas.findIndex((candidata) => candidata.value === stage);
  if (posicion < 0) return 0;
  return Math.round((100 * (posicion + 1)) / (abiertas.length + 1));
};

/** Importe × probabilidad de su etapa. */
export const importePonderado = (
  deal: Pick<Deal, "amount" | "stage">,
  embudo: Pick<DealPipeline, "stages" | "pipelineStatuses" | "lostStages">,
): number =>
  ((deal.amount ?? 0) * probabilidadDeEtapa(embudo, deal.stage)) / 100;

/** Una oportunidad que sigue en juego: sin archivar y ni ganada ni perdida. */
export const estaAbierta = (
  deal: Pick<Deal, "archived_at" | "stage">,
  embudo: Pick<DealPipeline, "pipelineStatuses" | "lostStages">,
): boolean =>
  !deal.archived_at &&
  !(embudo.pipelineStatuses ?? []).includes(deal.stage) &&
  !(embudo.lostStages ?? []).includes(deal.stage);

export type MesDelPronostico = {
  /** «2026-10», para ordenar y agrupar. */
  clave: string;
  /** «Octubre de 2026». */
  etiqueta: string;
  abierto: number;
  ponderado: number;
  oportunidades: number;
};

const claveDeMes = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

const etiquetaDeMes = (fecha: Date, locale: string) => {
  const texto = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/**
 * Pronóstico: lo abierto agrupado por el mes en que se espera cerrar, con su
 * importe total y el ponderado por la probabilidad de la etapa. Cubre desde
 * el mes actual `meses` meses hacia delante; lo que ya venció (fecha
 * prevista en el pasado) cae en el mes actual, porque sigue abierto y es lo
 * que toca cerrar ahora; lo que no tiene fecha va en una fila aparte al
 * final, para que no se pierda del total.
 */
export const pronosticoPorMes = (
  deals: Deal[],
  embudo: Pick<DealPipeline, "stages" | "pipelineStatuses" | "lostStages">,
  opciones: { meses?: number; hoy?: Date; locale?: string; sinFecha: string },
): MesDelPronostico[] => {
  const { meses = 6, hoy = new Date(), locale = "es-ES", sinFecha } = opciones;
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const filas = new Map<string, MesDelPronostico>();
  for (let i = 0; i < meses; i += 1) {
    const fecha = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
    filas.set(claveDeMes(fecha), {
      clave: claveDeMes(fecha),
      etiqueta: etiquetaDeMes(fecha, locale),
      abierto: 0,
      ponderado: 0,
      oportunidades: 0,
    });
  }
  const ultimaClave = claveDeMes(
    new Date(inicio.getFullYear(), inicio.getMonth() + meses - 1, 1),
  );
  const filaSinFecha: MesDelPronostico = {
    clave: "sin-fecha",
    etiqueta: sinFecha,
    abierto: 0,
    ponderado: 0,
    oportunidades: 0,
  };

  for (const deal of deals) {
    if (!estaAbierta(deal, embudo)) continue;
    let fila: MesDelPronostico | undefined;
    if (deal.expected_closing_date) {
      const prevista = new Date(`${deal.expected_closing_date}T00:00:00`);
      const clave = claveDeMes(prevista);
      if (clave < claveDeMes(inicio)) fila = filas.get(claveDeMes(inicio));
      else if (clave > ultimaClave) fila = undefined;
      else fila = filas.get(clave);
      // Más allá del horizonte: no cabe en la gráfica, pero cuenta como sin
      // fecha para no perderlo del total.
      if (!fila) fila = filaSinFecha;
    } else {
      fila = filaSinFecha;
    }
    fila.abierto += deal.amount ?? 0;
    fila.ponderado += importePonderado(deal, embudo);
    fila.oportunidades += 1;
  }

  const resultado = Array.from(filas.values());
  if (filaSinFecha.oportunidades > 0) resultado.push(filaSinFecha);
  return resultado;
};

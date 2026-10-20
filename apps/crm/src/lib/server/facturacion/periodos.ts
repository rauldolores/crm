import type { Periodicidad } from "./tipos";

/**
 * Fechas de los periodos a facturar. Todo con fechas AAAA-MM-DD y aritmética
 * en UTC: una fecha de calendario no tiene zona y así no hay sorpresas con
 * el horario de verano ni con la zona del servidor.
 */

export const MESES_POR_PERIODO: Record<Periodicidad, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export const esPeriodicidad = (valor: unknown): valor is Periodicidad =>
  valor === "monthly" || valor === "quarterly" || valor === "yearly";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const esFecha = (valor: unknown): valor is string =>
  typeof valor === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
  !Number.isNaN(Date.parse(`${valor}T00:00:00Z`));

const partes = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return { anio, mes, dia };
};

const aTexto = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** Suma días a una fecha (negativos restan). */
export const sumarDias = (fecha: string, dias: number): string => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return aTexto(d);
};

/**
 * Suma meses respetando el fin de mes: el 31 de enero más un mes es el 28 (o
 * 29) de febrero, no el 3 de marzo.
 */
export const sumarMeses = (fecha: string, meses: number): string => {
  const { anio, mes, dia } = partes(fecha);
  const indice = anio * 12 + (mes - 1) + meses;
  const nuevoAnio = Math.floor(indice / 12);
  const nuevoMes = indice % 12;
  const ultimoDia = new Date(Date.UTC(nuevoAnio, nuevoMes + 1, 0)).getUTCDate();
  return aTexto(
    new Date(Date.UTC(nuevoAnio, nuevoMes, Math.min(dia, ultimoDia))),
  );
};

/**
 * El periodo que se factura: empieza el día de la renovación y dura lo que
 * diga la periodicidad. El fin es el último día INCLUIDO.
 */
export const periodoAFacturar = (
  inicio: string,
  periodicidad: Periodicidad,
): { inicio: string; fin: string } => ({
  inicio,
  fin: sumarDias(sumarMeses(inicio, MESES_POR_PERIODO[periodicidad]), -1),
});

/**
 * El periodo en palabras, para el concepto: «enero 2027» si es un mes
 * completo, «ene 2027 – dic 2027» si son varios meses completos y con días
 * («15 ene 2027 – 14 feb 2027») si no empieza el día primero.
 */
export const textoDelPeriodo = (inicio: string, fin: string): string => {
  const a = partes(inicio);
  const b = partes(fin);
  const mesesCompletos =
    a.dia === 1 && sumarDias(fin, 1).endsWith("-01");
  if (mesesCompletos) {
    if (a.anio === b.anio && a.mes === b.mes) {
      return `${MESES[a.mes - 1]} ${a.anio}`;
    }
    return `${MESES_CORTOS[a.mes - 1]} ${a.anio} – ${MESES_CORTOS[b.mes - 1]} ${b.anio}`;
  }
  return `${a.dia} ${MESES_CORTOS[a.mes - 1]} ${a.anio} – ${b.dia} ${MESES_CORTOS[b.mes - 1]} ${b.anio}`;
};

/** Meses que abarca el periodo (para cobrar un extra mensual). */
export const mesesEntre = (inicio: string, fin: string): number => {
  const a = partes(inicio);
  const finSiguiente = partes(sumarDias(fin, 1));
  const meses =
    (finSiguiente.anio - a.anio) * 12 +
    (finSiguiente.mes - a.mes) +
    (finSiguiente.dia - a.dia) / 30;
  return Math.max(1, Math.round(meses));
};

/** Zona de KONTROLIA: los instantes se leen como fechas de México. */
const ZONA = "America/Mexico_City";

/**
 * Fecha (AAAA-MM-DD) en hora de México de un instante: ISO, segundos Unix
 * (Stripe) o milisegundos. Una fecha sin hora se respeta tal cual.
 */
export const fechaDeInstante = (
  valor: string | number | null | undefined,
): string | null => {
  if (valor == null || valor === "") return null;
  if (typeof valor === "string" && esFecha(valor)) return valor;
  let instante: Date;
  if (typeof valor === "number") {
    instante = new Date(valor < 1e12 ? valor * 1000 : valor);
  } else if (/^\d+$/.test(valor)) {
    const n = Number(valor);
    instante = new Date(n < 1e12 ? n * 1000 : n);
  } else {
    instante = new Date(valor);
  }
  if (Number.isNaN(instante.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
};

/** Instante ISO de un valor que puede venir en segundos Unix o en ISO. */
export const instanteIso = (
  valor: string | number | null | undefined,
): string | null => {
  if (valor == null || valor === "") return null;
  let instante: Date;
  if (typeof valor === "number" || /^\d+$/.test(valor)) {
    const n = Number(valor);
    instante = new Date(n < 1e12 ? n * 1000 : n);
  } else {
    instante = new Date(valor);
  }
  return Number.isNaN(instante.getTime()) ? null : instante.toISOString();
};

/** Hoy en México, AAAA-MM-DD. */
export const hoyEnMexico = (ahora = new Date()): string =>
  fechaDeInstante(ahora.getTime()) ?? aTexto(ahora);

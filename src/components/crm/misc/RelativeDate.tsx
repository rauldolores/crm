/* eslint-disable react-refresh/only-export-components */
import { differenceInDays, formatRelative } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Usamos date-fns en lugar de Intl porque Intl todavía no formatea las fechas
 * relativas como queremos.
 *
 * Lo más parecido que permite sería:
 *
 * const relativeDay = new Intl.RelativeTimeFormat(locale, {
 *   numeric: "auto",
 * }).format(diffInDays, "day");
 *
 * const time = new Intl.DateTimeFormat(locale, {
 *   hour: "numeric",
 *   minute: "numeric",
 * }).format(dateObj);
 *
 * return `${relativeDay} ${time}`;
 *
 * Eso devuelve "hace 3 días 15:00", y lo que queremos es "hace 3 días a las 15:00".
 *
 * Kontrolia CRM es una aplicación en español, así que el idioma está fijado:
 * no se recibe como parámetro ni se lee del estado de i18n.
 */
export const LOCALE = "es-ES";

export const formatLocalizedDate = (date: string) =>
  new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

export const formatRelativeDate = (date: string) => {
  const dateObj = new Date(date);
  const now = new Date();

  if (differenceInDays(now, dateObj) > 6) {
    return new Intl.DateTimeFormat(LOCALE).format(dateObj);
  }

  return formatRelative(dateObj, now, { locale: es });
};

export const useRelativeDate = (date: string) => formatRelativeDate(date);

export function RelativeDate({ date }: { date: string }) {
  return useRelativeDate(date);
}

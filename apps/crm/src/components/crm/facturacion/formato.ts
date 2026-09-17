import type {
  KontroliaBillingInterval,
  KontroliaPlan,
} from "@/lib/kontrolia-auth/facturacion";

const LOCALE = "es-MX";

/** «$499.00 MXN» a partir de centavos y la moneda del plan. */
export const importeConMoneda = (
  centavos: number,
  currency: string,
): string => {
  const moneda = currency.toUpperCase();
  const importe = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: moneda,
  }).format(centavos / 100);
  return `${importe} ${moneda}`;
};

/** «$499.00 MXN», o «Gratis» cuando el precio es cero. */
export const precioDelPlan = (plan: KontroliaPlan): string =>
  plan.priceAmount === 0
    ? "Gratis"
    : importeConMoneda(plan.priceAmount, plan.currency);

/** Precio anual del plan, o null si no tiene opción anual. */
export const precioAnualDelPlan = (plan: KontroliaPlan): string | null =>
  plan.yearlyPriceAmount === null
    ? null
    : importeConMoneda(plan.yearlyPriceAmount, plan.currency);

/** Lo que sale al mes pagando el año: «$415.67 MXN». */
export const equivalenteMensual = (plan: KontroliaPlan): string | null =>
  plan.yearlyPriceAmount === null
    ? null
    : importeConMoneda(Math.round(plan.yearlyPriceAmount / 12), plan.currency);

/**
 * Porcentaje que se ahorra al año frente a doce mensualidades — la fórmula
 * de billing.md, calculada aquí porque el servidor solo da los dos precios.
 * null si el plan no tiene opción anual; 0 si no hay ahorro.
 */
export const ahorroAnual = (plan: KontroliaPlan): number | null => {
  if (plan.yearlyPriceAmount === null || plan.priceAmount === 0) return null;
  return Math.max(
    0,
    Math.round((1 - plan.yearlyPriceAmount / (plan.priceAmount * 12)) * 100),
  );
};

/** Nombre del plan con «(anual)» cuando la suscripción se cobra al año. */
export const nombreDelPlanConIntervalo = (suscripcion: {
  planName: string;
  billingInterval: KontroliaBillingInterval;
}): string =>
  suscripcion.billingInterval === "year"
    ? `${suscripcion.planName} (anual)`
    : suscripcion.planName;

export const periodoDeCobro = (intervalo: KontroliaBillingInterval): string =>
  ({ month: "al mes", year: "al año", one_time: "pago único" })[intervalo];

/** «12 de octubre de 2026» a partir de una fecha ISO; vacío si no hay. */
export const fechaLarga = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString(LOCALE, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

export const etiquetaDePeriodo = (
  periodo: "day" | "month" | "year" | "lifetime",
): string =>
  ({ day: "hoy", month: "este mes", year: "este año", lifetime: "en total" })[
    periodo
  ];

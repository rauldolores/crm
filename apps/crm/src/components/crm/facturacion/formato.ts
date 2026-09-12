import type {
  KontroliaBillingInterval,
  KontroliaPlan,
} from "@/lib/kontrolia-auth/facturacion";

const LOCALE = "es-MX";

/** «$499.00 MXN / mes», o «Gratis» cuando el precio es cero. */
export const precioDelPlan = (plan: KontroliaPlan): string => {
  if (plan.priceAmount === 0) return "Gratis";
  const importe = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: plan.currency.toUpperCase(),
  }).format(plan.priceAmount / 100);
  return `${importe} ${plan.currency.toUpperCase()}`;
};

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

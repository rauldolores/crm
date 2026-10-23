import type { Invoice } from "../types";

/**
 * Cuentas de la vista de Cobranza: cuánto falta por cobrar y cuánto ya está
 * vencido. Se calcula sobre las facturas timbradas sin pagar (o pagadas en
 * parte) que ya trajo la página.
 */

type FacturaPorCobrar = Pick<
  Invoice,
  "total" | "paid_amount" | "currency" | "due_on"
>;

export interface Monto {
  cantidad: number;
  /** Lo que falta por cobrar, por moneda: no se suman pesos con dólares. */
  importes: Record<string, number>;
}

export interface ResumenDeCobranza {
  porCobrar: Monto;
  vencidas: Monto;
}

/** Hoy en México como AAAA-MM-DD, para compararlo con due_on. */
export const hoyEnMexico = (ahora: Date = new Date()): string =>
  ahora.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

/** Lo que el cliente todavía debe de una factura. */
export const saldoDe = (factura: FacturaPorCobrar): number =>
  Math.max(0, Number(factura.total ?? 0) - Number(factura.paid_amount ?? 0));

/** Días desde que venció; 0 si no ha vencido o no tiene fecha. */
export const diasDeAtraso = (
  dueOn: string | null | undefined,
  hoy: string,
): number => {
  if (!dueOn) return 0;
  const dias = Math.round(
    (Date.parse(`${hoy}T00:00:00Z`) -
      Date.parse(`${dueOn.slice(0, 10)}T00:00:00Z`)) /
      86_400_000,
  );
  return Math.max(0, dias);
};

const sumar = (monto: Monto, factura: FacturaPorCobrar): Monto => {
  const moneda = factura.currency || "MXN";
  return {
    cantidad: monto.cantidad + 1,
    importes: {
      ...monto.importes,
      [moneda]: (monto.importes[moneda] ?? 0) + saldoDe(factura),
    },
  };
};

const VACIO: Monto = { cantidad: 0, importes: {} };

export const resumirCobranza = (
  facturas: FacturaPorCobrar[],
  hoy: string,
): ResumenDeCobranza =>
  facturas.reduce<ResumenDeCobranza>(
    (resumen, factura) => ({
      porCobrar: sumar(resumen.porCobrar, factura),
      vencidas:
        diasDeAtraso(factura.due_on, hoy) > 0
          ? sumar(resumen.vencidas, factura)
          : resumen.vencidas,
    }),
    { porCobrar: VACIO, vencidas: VACIO },
  );

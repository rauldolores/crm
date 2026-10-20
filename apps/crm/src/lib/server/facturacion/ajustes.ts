import { z } from "zod";

import type { AjustesDeFacturacion } from "./tipos";

/**
 * Ajustes de facturación por producto: una fila general ('*') y, si se
 * quiere, una por producto (application_slug del contrato) que manda sobre
 * la general. Sin ninguna fila, valen los de aquí.
 */

export const PRODUCTO_GENERAL = "*";

export const AJUSTES_POR_OMISION: AjustesDeFacturacion = {
  product_key: PRODUCTO_GENERAL,
  // 81112106: «Proveedores de servicios de aplicación» (software como
  // servicio). E48: «Unidad de servicio».
  clave_prod_serv: "81112106",
  clave_unidad: "E48",
  concept_template: "{producto} · {plan} · {periodo}",
  tax_rate: 0.16,
  prices_include_tax: false,
  metodo_pago_transferencia: "PPD",
  forma_pago_transferencia: "99",
  // 04 = tarjeta de crédito. Hay quien prefiere 28 (débito); se cambia aquí.
  forma_pago_tarjeta: "04",
  days_before: 15,
  mode: "review",
  active: true,
};

/** Una fila de la base (numeric llega como texto) a ajustes con tipos. */
export const normalizarAjustes = (
  fila: Partial<Record<keyof AjustesDeFacturacion, unknown>>,
): AjustesDeFacturacion => {
  const base = AJUSTES_POR_OMISION;
  const texto = (valor: unknown, porOmision: string) =>
    typeof valor === "string" && valor.trim() ? valor.trim() : porOmision;
  const tasa = Number(fila.tax_rate);
  const dias = Number(fila.days_before);
  return {
    product_key: texto(fila.product_key, base.product_key),
    clave_prod_serv: texto(fila.clave_prod_serv, base.clave_prod_serv),
    clave_unidad: texto(fila.clave_unidad, base.clave_unidad),
    concept_template: texto(fila.concept_template, base.concept_template),
    tax_rate:
      fila.tax_rate != null && Number.isFinite(tasa) ? tasa : base.tax_rate,
    prices_include_tax:
      typeof fila.prices_include_tax === "boolean"
        ? fila.prices_include_tax
        : base.prices_include_tax,
    metodo_pago_transferencia:
      fila.metodo_pago_transferencia === "PUE" ? "PUE" : "PPD",
    forma_pago_transferencia: texto(
      fila.forma_pago_transferencia,
      base.forma_pago_transferencia,
    ),
    forma_pago_tarjeta: texto(fila.forma_pago_tarjeta, base.forma_pago_tarjeta),
    days_before:
      fila.days_before != null && Number.isFinite(dias)
        ? Math.trunc(dias)
        : base.days_before,
    mode: fila.mode === "auto" ? "auto" : "review",
    active: typeof fila.active === "boolean" ? fila.active : base.active,
  };
};

/**
 * Los ajustes que valen para un producto: los suyos si tiene fila; si no,
 * los generales; si tampoco, los de omisión.
 */
export const ajustesDelProducto = (
  filas: Partial<Record<keyof AjustesDeFacturacion, unknown>>[],
  producto: string | null | undefined,
): AjustesDeFacturacion => {
  const propia = producto
    ? filas.find((fila) => fila.product_key === producto)
    : undefined;
  const general = filas.find((fila) => fila.product_key === PRODUCTO_GENERAL);
  const elegida = propia ?? general;
  return elegida
    ? normalizarAjustes(elegida)
    : { ...AJUSTES_POR_OMISION, product_key: producto || PRODUCTO_GENERAL };
};

/** Lo que llega de la pantalla de ajustes, validado. */
export const AjustesRecibidos = z.object({
  product_key: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^(\*|[a-z0-9][a-z0-9_-]*)$/i),
  clave_prod_serv: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "La clave del SAT son 8 dígitos."),
  clave_unidad: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,5}$/, "La unidad del SAT no es válida."),
  concept_template: z.string().trim().min(1).max(300),
  tax_rate: z.number().min(0).max(1),
  prices_include_tax: z.boolean(),
  metodo_pago_transferencia: z.enum(["PPD", "PUE"]),
  forma_pago_transferencia: z.string().regex(/^\d{2}$/),
  forma_pago_tarjeta: z.string().regex(/^\d{2}$/),
  days_before: z.number().int().min(0).max(90),
  mode: z.enum(["review", "auto"]),
  active: z.boolean(),
});

export type AjustesRecibidos = z.infer<typeof AjustesRecibidos>;

/**
 * Totales de una cotización a partir de sus líneas, con las mismas reglas
 * que la base (crm.recalcular_totales_de_cotizacion): importe de línea =
 * cantidad × precio × (1 − descuento), redondeado a centavos; IVA por
 * línea sobre ese importe. Aquí solo sirve para la vista previa mientras se
 * edita; lo que vale es lo que calcula la base al guardar.
 */

export interface LineaEditable {
  description?: string;
  /** SKU o id externo del producto del catálogo, si la línea salió de uno. */
  product_ref?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  discount_pct?: number | string | null;
  tax_rate?: number | string | null;
}

const numero = (valor: unknown): number => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const aCentavos = (valor: number): number => Math.round(valor * 100) / 100;

export const importeDeLinea = (linea: LineaEditable): number =>
  aCentavos(
    numero(linea.quantity) *
      numero(linea.unit_price) *
      (1 - numero(linea.discount_pct) / 100),
  );

export const calcularTotales = (
  lineas: LineaEditable[] | undefined,
): { subtotal: number; iva: number; total: number } => {
  let subtotal = 0;
  let iva = 0;
  for (const linea of lineas ?? []) {
    const importe = importeDeLinea(linea);
    subtotal += importe;
    iva += aCentavos((importe * numero(linea.tax_rate)) / 100);
  }
  subtotal = aCentavos(subtotal);
  iva = aCentavos(iva);
  return { subtotal, iva, total: aCentavos(subtotal + iva) };
};

/** Fecha de vencimiento a N días de hoy, como aaaa-mm-dd. */
export const venceEn = (dias: number, hoy = new Date()): string => {
  const fecha = new Date(hoy);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
};

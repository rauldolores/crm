import { esCodigoPostalValido, esRfcValido } from "@/lib/conectores/sat";

import {
  ErrorDeConector,
  type LineaAFacturar,
  type ReceptorFiscal,
} from "./tipos";

/**
 * De la cotización a lo que se le pide al proveedor: líneas como conceptos
 * y receptor validado. Sin red ni base de datos, para poder probarlo.
 */

/** Las líneas de la cotización como conceptos: el descuento en importe. */
export const lineasAFacturar = (
  lineas: {
    description: string;
    quantity: number;
    unit_price: number;
    discount_pct: number;
    tax_rate: number;
    product_ref: string | null;
  }[],
): LineaAFacturar[] =>
  lineas.map((linea) => {
    const cantidad = Number(linea.quantity) || 0;
    const precio = Number(linea.unit_price) || 0;
    const bruto = cantidad * precio;
    return {
      descripcion: linea.description,
      cantidad,
      precioUnitario: precio,
      descuento: Math.round(bruto * (Number(linea.discount_pct) || 0)) / 100,
      tasaIva: (Number(linea.tax_rate) || 0) / 100,
      sku: linea.product_ref || null,
    };
  });

export const validarReceptor = (
  receptor: Partial<ReceptorFiscal>,
): ReceptorFiscal => {
  const razonSocial = (receptor.razonSocial ?? "").trim().slice(0, 300);
  const rfc = (receptor.rfc ?? "").trim().toUpperCase();
  const regimenFiscal = (receptor.regimenFiscal ?? "").trim();
  const usoCfdi = (receptor.usoCfdi ?? "").trim();
  const codigoPostal = (receptor.codigoPostal ?? "").trim();
  const email = (receptor.email ?? "").trim() || null;
  if (!razonSocial) throw new ErrorDeConector("Falta la razón social.", 400);
  if (!esRfcValido(rfc))
    throw new ErrorDeConector("El RFC no tiene un formato válido.", 400);
  if (!/^\d{3}$/.test(regimenFiscal))
    throw new ErrorDeConector("Elige el régimen fiscal.", 400);
  if (!/^[A-Z]{1,2}\d{2}$/.test(usoCfdi))
    throw new ErrorDeConector("Elige el uso del CFDI.", 400);
  if (!esCodigoPostalValido(codigoPostal))
    throw new ErrorDeConector("El código postal debe tener 5 dígitos.", 400);
  return { razonSocial, rfc, regimenFiscal, usoCfdi, codigoPostal, email };
};

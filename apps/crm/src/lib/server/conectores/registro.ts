import {
  proveedorPorClave,
  type FamiliaDeConector,
} from "@/lib/conectores/catalogo";

import { ConectorFaqturia } from "./faqturia";
import { ConectorShopify } from "./shopify";
import {
  ErrorDeConector,
  type Conector,
  type ConectorDeFacturacion,
  type ConectorDeProductos,
  type CredencialesDeConector,
} from "./tipos";

/**
 * De la clave del proveedor al conector que sabe hablar con él. Agregar un
 * proveedor es: implementarlo en su archivo, describirlo en el catálogo
 * (src/lib/conectores/catalogo.ts) y sumarlo aquí.
 */
const FABRICAS: Record<string, (c: CredencialesDeConector) => Conector> = {
  shopify: (c) => new ConectorShopify(c),
  faqturia: (c) => new ConectorFaqturia(c),
};

export const construirConector = (
  proveedor: string,
  credenciales: CredencialesDeConector,
): Conector => {
  const fabrica = FABRICAS[proveedor];
  const definicion = proveedorPorClave(proveedor);
  if (!fabrica || !definicion) {
    throw new ErrorDeConector("Ese proveedor no existe.", 400);
  }
  return fabrica(credenciales);
};

export const esConectorDeProductos = (
  conector: Conector,
): conector is ConectorDeProductos => conector.familia === "products";

export const esConectorDeFacturacion = (
  conector: Conector,
): conector is ConectorDeFacturacion => conector.familia === "invoicing";

/** El proveedor existe y es de esa familia. */
export const proveedorValidoPara = (
  familia: FamiliaDeConector,
  proveedor: string,
): boolean => proveedorPorClave(proveedor)?.family === familia;

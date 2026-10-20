/**
 * La interfaz de conector: lo que el CRM necesita de un proveedor, y nada
 * más. Cada proveedor (Shopify, Faqturia…) la implementa a su manera; el
 * resto del CRM habla solo con estos tipos.
 *
 * Dos familias:
 * - ConectorDeProductos: de dónde salen los productos de una cotización.
 * - ConectorDeFacturacion: quién timbra y guarda la factura.
 *
 * Cada método de red devuelve datos o lanza ErrorDeConector con un mensaje
 * pensado para la persona que lo va a leer en pantalla, no para el log.
 */

export type ResultadoDePrueba =
  | { ok: true; detalle: string }
  | { ok: false; mensaje: string };

/** Un producto como lo entrega el proveedor, ya normalizado. */
export interface ProductoExterno {
  externalId: string;
  sku: string | null;
  name: string;
  description: string | null;
  unitPrice: number;
  currency: string;
  active: boolean;
  imageUrl: string | null;
}

export interface ConectorDeProductos {
  readonly familia: "products";
  /** Comprueba la credencial; el detalle es lo que se enseña al conectar. */
  probar(): Promise<ResultadoDePrueba>;
  /** El catálogo completo. Se llama al sincronizar, no al teclear. */
  listarProductos(): Promise<ProductoExterno[]>;
}

/** Lo que el CFDI exige del receptor. */
export interface ReceptorFiscal {
  razonSocial: string;
  rfc: string;
  regimenFiscal: string;
  usoCfdi: string;
  codigoPostal: string;
  email: string | null;
}

export interface LineaAFacturar {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  /** Importe del descuento de la línea, no porcentaje. */
  descuento: number;
  /** 0.16, 0.08 o 0. */
  tasaIva: number;
  /** Referencia del producto en el catálogo, si la línea salió de uno. */
  sku: string | null;
  /** Clave de producto o servicio del SAT; si falta, la del conector. */
  claveProdServ?: string;
  /** Clave de unidad del SAT; si falta, la del conector. */
  claveUnidad?: string;
}

export interface PeticionDeFactura {
  receptor: ReceptorFiscal;
  lineas: LineaAFacturar[];
  moneda: string;
  /** Folio de la cotización de origen: para trazar y para no duplicar. */
  referencia: string;
  /** Forma y método de pago SAT; si faltan, los del conector. */
  formaPago?: string;
  metodoPago?: string;
  /**
   * Clave para que el proveedor no timbre dos veces la misma factura si la
   * petición se repite (un reintento tras un corte, por ejemplo).
   */
  claveDeIdempotencia?: string;
  /** Texto libre que el proveedor imprime en la factura (el periodo). */
  notas?: string;
  /** Fecha límite de pago (AAAA-MM-DD), para las de pago diferido (PPD). */
  fechaDeVencimiento?: string;
}

export type EstadoDeFactura = "stamped" | "draft" | "cancelled" | "error";

export interface FacturaEmitida {
  externalId: string;
  uuid: string | null;
  serie: string | null;
  folio: string | null;
  total: number;
  currency: string;
  status: EstadoDeFactura;
  issuedAt: string | null;
  /** Por qué no se timbró, cuando status es draft o error. */
  error: string | null;
  /**
   * La factura tal como la devolvió el proveedor, para quien necesite más
   * que lo normalizado (el módulo de facturación lee el pago registrado).
   */
  detalle?: Record<string, unknown>;
}

export interface ConectorDeFacturacion {
  readonly familia: "invoicing";
  probar(): Promise<ResultadoDePrueba>;
  emitirFactura(peticion: PeticionDeFactura): Promise<FacturaEmitida>;
  recuperarFactura(externalId: string): Promise<FacturaEmitida>;
  /** URL temporal para descargar el PDF o el XML del proveedor. */
  enlaceDeDescarga(externalId: string, formato: "pdf" | "xml"): Promise<string>;
}

export type Conector = ConectorDeProductos | ConectorDeFacturacion;

/** Error con mensaje para la persona; `status` sugiere el código HTTP. */
export class ErrorDeConector extends Error {
  readonly status: number;
  constructor(mensaje: string, status = 502) {
    super(mensaje);
    this.name = "ErrorDeConector";
    this.status = status;
  }
}

/** Configuración con la que se construye un conector: ajustes + secreto. */
export interface CredencialesDeConector {
  settings: Record<string, string>;
  secret: string;
}

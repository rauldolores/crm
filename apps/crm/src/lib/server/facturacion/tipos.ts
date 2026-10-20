/**
 * Módulo de facturación: los tipos que comparten la parte pura (qué factura
 * toca y con qué renglones) y los ejecutores (los que leen y escriben la
 * base y hablan con el proveedor).
 *
 * Reglas del dueño (ver la doc «Módulo de facturación»):
 *   - Una factura por producto: el contrato y sus extras en la misma.
 *   - Transferencia: PPD, 15 días antes de renews_on, por el periodo que sigue.
 *   - Tarjeta (cobró KontrolIA Auth): PUE, forma 04, ya pagada.
 *   - Sin datos fiscales completos no se timbra: «falta información».
 */

export type ModoDeFacturacion = "review" | "auto";

/** Una fila de crm.billing_settings, ya con valores por omisión. */
export interface AjustesDeFacturacion {
  product_key: string;
  clave_prod_serv: string;
  clave_unidad: string;
  concept_template: string;
  tax_rate: number;
  prices_include_tax: boolean;
  metodo_pago_transferencia: "PPD" | "PUE";
  forma_pago_transferencia: string;
  forma_pago_tarjeta: string;
  days_before: number;
  mode: ModoDeFacturacion;
  active: boolean;
}

export type Periodicidad = "monthly" | "quarterly" | "yearly";

export type OrigenDeFactura = "quote" | "contract" | "card" | "credits" | "manual";

export type EstadoDeBandeja =
  | "pending_review"
  | "missing_data"
  | "queued"
  | "stamping"
  | "stamped"
  | "error"
  | "cancelled"
  | "discarded";

export type EstadoDePago = "unpaid" | "partial" | "paid";

/**
 * Renovar el acceso al pagar: qué pasó con la vigencia en KontrolIA Auth
 * cuando la factura de un contrato por transferencia quedó pagada.
 */
export type EstadoDeAcceso =
  | "not_applicable"
  | "pending"
  | "renewed"
  | "error"
  | "skipped";

/** Lo que falta para timbrar; la pantalla lo traduce. */
export type ProblemaFiscal =
  | "customer"
  | "name"
  | "rfc"
  | "tax_regime"
  | "cfdi_use"
  | "zipcode"
  | "amount";

/** Extra del contrato tal como llega de KontrolIA Auth (centavos). */
export interface ExtraDeContrato {
  addon_id?: string | null;
  slug?: string | null;
  name?: string | null;
  included?: boolean | null;
  price_amount?: number | null;
  currency?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  contract_amount?: number | null;
  contract_currency?: string | null;
}

/** Lo que se lee de crm.contracts para facturarlo. */
export interface ContratoAFacturar {
  id: number;
  company_id: number;
  name: string;
  status: string;
  billing_period: string | null;
  amount: number | string | null;
  currency: string | null;
  renews_on: string | null;
  provider: string | null;
  application_slug: string | null;
  plan_name: string | null;
  addons: ExtraDeContrato[] | null;
  billing_enabled: boolean;
}

/** Lo que se lee de crm.companies para timbrar. */
export interface EmpresaFiscal {
  id: number;
  name: string | null;
  tax_identifier: string | null;
  tax_regime: string | null;
  cfdi_use: string | null;
  zipcode: string | null;
  sales_id?: number | null;
}

/** Un renglón de crm.invoice_items antes de guardarlo. */
export interface RenglonPlaneado {
  position: number;
  description: string;
  product_ref: string | null;
  quantity: number;
  /** Antes de IVA. */
  unit_price: number;
  amount: number;
  clave_prod_serv: string;
  clave_unidad: string;
  tax_rate: number;
}

/** Una factura de crm.invoices antes de guardarla (sin estado de bandeja). */
export interface FacturaPlaneada {
  origin: Exclude<OrigenDeFactura, "quote">;
  contract_id: number | null;
  company_id: number | null;
  period_start: string | null;
  period_end: string | null;
  due_on: string | null;
  currency: string;
  payment_method: "PPD" | "PUE";
  payment_form: string;
  payment_status: EstadoDePago;
  paid_amount: number;
  paid_at: string | null;
  source_ref: string | null;
  subtotal: number;
  tax: number;
  total: number;
  renglones: RenglonPlaneado[];
  /** Para la tarea y la nota de la factura («enero 2027»). */
  periodo_texto: string | null;
  producto: string;
}

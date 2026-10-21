import { esCodigoPostalValido, esRfcValido } from "@/lib/conectores/sat";

import {
  esFecha,
  esPeriodicidad,
  mesesEntre,
  periodoAFacturar,
  sumarDias,
  textoDelPeriodo,
} from "./periodos";
import type {
  AjustesDeFacturacion,
  ContratoAFacturar,
  EmpresaFiscal,
  EstadoDeBandeja,
  ExtraDeContrato,
  FacturaPlaneada,
  ProblemaFiscal,
  RenglonPlaneado,
} from "./tipos";

/**
 * Qué factura toca a un contrato y con qué renglones. Puro: sin base de
 * datos ni red, para poder probarlo. Quien guarda es `contratos.ts`.
 */

/** Redondeo a centavos sin el clásico 1.005 → 1.00. */
export const aCentavos = (valor: number): number =>
  Math.round((valor + Number.EPSILON) * 100) / 100;

/** Producto del contrato: lo que va antes del « · » en su nombre. */
export const productoDelContrato = (
  contrato: Pick<ContratoAFacturar, "name" | "application_slug">,
): string =>
  contrato.name.split(" · ")[0]?.trim() ||
  contrato.application_slug ||
  contrato.name;

/**
 * Arma el concepto con la plantilla. Un marcador vacío (un contrato sin
 * plan) no deja un « ·  · » colgando: se quitan los tramos vacíos.
 */
export const conceptoDesdePlantilla = (
  plantilla: string,
  valores: { producto: string; plan: string | null; periodo: string | null },
): string => {
  const texto = plantilla
    .replaceAll("{producto}", valores.producto ?? "")
    .replaceAll("{plan}", valores.plan ?? "")
    .replaceAll("{periodo}", valores.periodo ?? "");
  const limpio = texto
    .split(" · ")
    .map((tramo) => tramo.trim())
    .filter(Boolean)
    .join(" · ")
    .replace(/\s+/g, " ")
    .trim();
  return (limpio || valores.producto || "Servicio").slice(0, 1000);
};

/** Día en que debe salir la factura del periodo que sigue. */
export const fechaDeFacturacion = (
  contrato: Pick<ContratoAFacturar, "renews_on">,
  ajustes: Pick<AjustesDeFacturacion, "days_before">,
): string | null =>
  esFecha(contrato.renews_on)
    ? sumarDias(contrato.renews_on, -ajustes.days_before)
    : null;

/** Por qué un contrato no se factura solo (o null si sí se factura). */
export type MotivoParaNoFacturar =
  | "disabled"
  | "inactive_product"
  | "not_active"
  | "not_recurring"
  | "card"
  | "no_renewal"
  | "too_early";

export const motivoParaNoFacturar = (
  contrato: ContratoAFacturar,
  ajustes: AjustesDeFacturacion,
  hoy: string,
  opciones: { forzar?: boolean } = {},
): MotivoParaNoFacturar | null => {
  // «Facturar ahora» lo pide una persona: no exige el interruptor ni la
  // fecha, pero sí lo que hace que una factura tenga sentido.
  if (!opciones.forzar && !contrato.billing_enabled) return "disabled";
  if (!opciones.forzar && !ajustes.active) return "inactive_product";
  if (contrato.status !== "active") return "not_active";
  if (!esPeriodicidad(contrato.billing_period)) return "not_recurring";
  // Lo que se cobra con tarjeta se factura cuando KontrolIA Auth avisa del
  // cobro, no por calendario.
  if (contrato.provider === "stripe") return "card";
  if (!esFecha(contrato.renews_on)) return "no_renewal";
  if (!opciones.forzar) {
    const desde = fechaDeFacturacion(contrato, ajustes);
    if (!desde || hoy < desde) return "too_early";
  }
  return null;
};

/** ¿El extra cuenta en ese periodo? Sí, si estuvo vigente en algún día. */
const extraVigente = (
  extra: ExtraDeContrato,
  periodo: { inicio: string; fin: string },
): boolean => {
  const desde = extra.starts_at?.slice(0, 10);
  const hasta = extra.ends_at?.slice(0, 10);
  if (hasta && esFecha(hasta) && hasta <= periodo.inicio) return false;
  if (desde && esFecha(desde) && desde > periodo.fin) return false;
  return true;
};

/** Precio antes de IVA: si el del contrato ya lo incluye, se le quita. */
export const sinIva = (
  importe: number,
  ajustes: Pick<AjustesDeFacturacion, "prices_include_tax" | "tax_rate">,
): number =>
  ajustes.prices_include_tax
    ? aCentavos(importe / (1 + ajustes.tax_rate))
    : aCentavos(importe);

/**
 * Renglones de la factura de un contrato: el plan y, debajo, cada extra que
 * no venga incluido. El precio del extra (centavos) se toma como mensual y
 * se multiplica por los meses del periodo.
 */
export const renglonesDelContrato = (
  contrato: ContratoAFacturar,
  ajustes: AjustesDeFacturacion,
  periodo: { inicio: string; fin: string },
): RenglonPlaneado[] => {
  const producto = productoDelContrato(contrato);
  const periodoTexto = textoDelPeriodo(periodo.inicio, periodo.fin);
  const meses = mesesEntre(periodo.inicio, periodo.fin);
  const base = {
    quantity: 1,
    clave_prod_serv: ajustes.clave_prod_serv,
    clave_unidad: ajustes.clave_unidad,
    tax_rate: ajustes.tax_rate,
  };

  const renglones: RenglonPlaneado[] = [];
  const importe = Number(contrato.amount);
  if (Number.isFinite(importe) && importe > 0) {
    const precio = sinIva(importe, ajustes);
    renglones.push({
      ...base,
      position: 0,
      description: conceptoDesdePlantilla(ajustes.concept_template, {
        producto,
        plan: contrato.plan_name,
        periodo: periodoTexto,
      }),
      product_ref: contrato.application_slug
        ? [contrato.application_slug, contrato.plan_name]
            .filter(Boolean)
            .join(":")
        : null,
      unit_price: precio,
      amount: precio,
    });
  }

  for (const extra of contrato.addons ?? []) {
    if (extra.included) continue;
    if (!extraVigente(extra, periodo)) continue;
    const centavos = extra.contract_amount ?? extra.price_amount;
    if (centavos == null || !(Number(centavos) > 0)) continue;
    const precio = sinIva((Number(centavos) / 100) * meses, ajustes);
    const nombre = extra.name || extra.slug || "Extra";
    renglones.push({
      ...base,
      position: renglones.length,
      description: `${nombre} · ${periodoTexto}`.slice(0, 1000),
      product_ref: extra.slug
        ? `${contrato.application_slug ?? "extra"}:${extra.slug}`
        : null,
      unit_price: precio,
      amount: precio,
    });
  }
  return renglones;
};

/** Subtotal, IVA (renglón por renglón, como el CFDI) y total. */
export const totalesDe = (
  renglones: Pick<RenglonPlaneado, "amount" | "tax_rate">[],
): { subtotal: number; tax: number; total: number } => {
  const subtotal = aCentavos(renglones.reduce((s, r) => s + r.amount, 0));
  const tax = aCentavos(
    renglones.reduce((s, r) => s + aCentavos(r.amount * r.tax_rate), 0),
  );
  return { subtotal, tax, total: aCentavos(subtotal + tax) };
};

/**
 * La factura del periodo que sigue a la renovación, o null si no toca.
 * Transferencia: método y forma de los ajustes (PPD / 99), sin pagar, y
 * vence el día de la renovación.
 */
export const planearFacturaDeContrato = (
  contrato: ContratoAFacturar,
  ajustes: AjustesDeFacturacion,
  hoy: string,
  opciones: { forzar?: boolean } = {},
): FacturaPlaneada | null => {
  if (motivoParaNoFacturar(contrato, ajustes, hoy, opciones)) return null;
  const periodo = periodoAFacturar(
    contrato.renews_on as string,
    contrato.billing_period as "monthly" | "quarterly" | "yearly",
  );
  const renglones = renglonesDelContrato(contrato, ajustes, periodo);
  if (!renglones.length) return null;
  const totales = totalesDe(renglones);
  return {
    origin: "contract",
    contract_id: contrato.id,
    company_id: contrato.company_id,
    period_start: periodo.inicio,
    period_end: periodo.fin,
    due_on: periodo.inicio,
    currency: (contrato.currency || "MXN").toUpperCase(),
    payment_method: ajustes.metodo_pago_transferencia,
    payment_form: ajustes.forma_pago_transferencia,
    payment_status: "unpaid",
    paid_amount: 0,
    paid_at: null,
    source_ref: null,
    ...totales,
    renglones,
    periodo_texto: textoDelPeriodo(periodo.inicio, periodo.fin),
    producto: productoDelContrato(contrato),
  };
};

/** Lo que le falta a la empresa para poder timbrarle. */
export const problemasFiscales = (
  empresa: EmpresaFiscal | null,
): ProblemaFiscal[] => {
  if (!empresa) return ["customer"];
  const problemas: ProblemaFiscal[] = [];
  if (!empresa.name?.trim()) problemas.push("name");
  if (!esRfcValido(empresa.tax_identifier ?? "")) problemas.push("rfc");
  if (!/^\d{3}$/.test((empresa.tax_regime ?? "").trim()))
    problemas.push("tax_regime");
  if (!/^[A-Z]{1,2}\d{2}$/.test((empresa.cfdi_use ?? "").trim()))
    problemas.push("cfdi_use");
  if (!esCodigoPostalValido(empresa.zipcode ?? "")) problemas.push("zipcode");
  return problemas;
};

/** Cómo se dice cada problema en la tarea para el responsable. */
export const TEXTO_DEL_PROBLEMA: Record<ProblemaFiscal, string> = {
  customer: "la empresa del cliente",
  name: "la razón social",
  rfc: "el RFC",
  tax_regime: "el régimen fiscal",
  cfdi_use: "el uso del CFDI",
  zipcode: "el código postal fiscal",
  amount: "el importe",
};

/** «el RFC, el régimen fiscal y el código postal fiscal». */
export const listaDeProblemas = (problemas: ProblemaFiscal[]): string => {
  const textos = problemas.map((p) => TEXTO_DEL_PROBLEMA[p]);
  if (textos.length <= 1) return textos[0] ?? "";
  return `${textos.slice(0, -1).join(", ")} y ${textos[textos.length - 1]}`;
};

/**
 * Dónde entra una factura recién armada (o revisada de nuevo):
 * sin datos fiscales → «falta información»; con ellos, a la cola si puede
 * timbrarse sola; si no, a revisión.
 */
export const estadoInicial = (
  problemas: ProblemaFiscal[],
  puedeTimbrarSola: boolean,
): Extract<EstadoDeBandeja, "missing_data" | "pending_review" | "queued"> => {
  if (problemas.length) return "missing_data";
  return puedeTimbrarSola ? "queued" : "pending_review";
};

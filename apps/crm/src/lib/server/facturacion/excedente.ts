import { z } from "zod";

import {
  ORIGEN_KONTROLIA_AUTH,
  llaveDeContrato,
} from "../integraciones/kontroliaAuth";
import { getServiceClient } from "../supabase-service";
import { ajustesDelProducto } from "./ajustes";
import {
  COLUMNAS_DE_CONTRATO,
  conectorDeFacturacion,
  exigir,
  guardarFacturaPlaneada,
  leerAjustes,
  leerEmpresa,
  puedeTimbrarSola,
  type Db,
  type FacturaDeBandeja,
} from "./guardar";
import {
  aCentavos,
  productoDelContrato,
  sinIva,
  totalesDe,
} from "./planear";
import { esFecha, hoyEnMexico, sumarDias, textoDelPeriodo } from "./periodos";
import type {
  AjustesDeFacturacion,
  ContratoAFacturar,
  FacturaPlaneada,
} from "./tipos";

/**
 * Excedente de consumo: cuando KontrolIA Auth cierra un mes de una
 * suscripción manual (por transferencia) y el cliente usó más de lo que
 * incluye su plan, avisa con `usage.overage`: un aviso por mes cerrado,
 * suscripción y límite. Importes en CENTAVOS.
 *
 * Reglas del dueño:
 *   - Una factura APARTE por producto, mes y límite: no se suma a la del
 *     plan.
 *   - PPD, con la forma de pago de transferencia del producto; vence
 *     DIAS_PARA_PAGAR_EXCEDENTE días después del día en que se arma.
 *   - Mismos ajustes por producto (claves del SAT, IVA, «precios con IVA») y
 *     mismo modo de revisión que las facturas de contrato: se timbra sola
 *     solo si el producto está en «timbrar sola» y el contrato tiene
 *     encendida la facturación automática. Si no, espera en la bandeja.
 *     Nunca se tira un excedente sin que nadie lo vea.
 *   - No renueva el acceso en KontrolIA Auth (access_status
 *     'not_applicable').
 */

export const EVENTO_DE_EXCEDENTE = "usage.overage";

/** Plazo para pagar la factura de un excedente, contado desde que se arma. */
export const DIAS_PARA_PAGAR_EXCEDENTE = 15;

const texto = z.string().nullish();
const numero = z.coerce.number().nullish();
const identificador = z.union([z.string(), z.number()]).transform(String);

/** AAAA-MM-DD; si llega con hora, se toma la fecha tal cual (sin zona). */
const fecha = z
  .string()
  .transform((valor) => valor.trim().slice(0, 10))
  .refine(esFecha, "Se esperaba una fecha AAAA-MM-DD.");

export const DatosDeExcedente = z.object({
  closure_id: identificador.refine((v) => v.trim().length > 0),
  subscription_id: identificador.nullish(),
  limit_key: z.string().min(1),
  description: texto,
  period_start: fecha,
  period_end: fecha,
  used: numero,
  included: numero,
  credit_units: numero,
  excess_units: z.coerce.number(),
  unit_price_amount: z.coerce.number(),
  currency: texto,
  amount: numero,
});

export type DatosDeExcedente = z.infer<typeof DatosDeExcedente>;

export const AvisoDeExcedente = z.object({
  id: texto,
  type: texto,
  organization_id: z.string(),
  application: z.object({ slug: z.string(), name: texto }).passthrough(),
  data: DatosDeExcedente,
});

export type AvisoDeExcedente = z.infer<typeof AvisoDeExcedente>;

/** La llave que hace único al excedente (un reintento no lo duplica). */
export const referenciaDelExcedente = (
  aviso: Pick<AvisoDeExcedente, "data">,
): string => `kontrolia-auth:overage:${aviso.data.closure_id}`;

/**
 * Último día incluido. El aviso da el fin incluido («2026-10-31»); si llega
 * como el día primero del mes siguiente («2026-11-01», fin exclusivo), se
 * toma el día anterior para que el periodo se lea «octubre 2026».
 */
export const finIncluido = (inicio: string, fin: string): string =>
  fin > inicio && fin.endsWith("-01") && inicio.endsWith("-01")
    ? sumarDias(fin, -1)
    : fin;

const cifra = (valor: number | null | undefined): string =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(
    Number.isFinite(Number(valor)) ? Number(valor) : 0,
  );

/** «Usado 260, incluido 200, cubierto con créditos 0». */
export const notaDelConsumo = (
  datos: Pick<DatosDeExcedente, "used" | "included" | "credit_units">,
): string =>
  `Usado ${cifra(datos.used)}, incluido ${cifra(datos.included)}, ` +
  `cubierto con créditos ${cifra(datos.credit_units)}`;

/**
 * ¿El importe que declara el aviso es unidades × precio? Si no cuadra, la
 * factura se arma igual con unidades × precio (es lo que exige el CFDI) y se
 * avisa en el registro del servidor.
 */
export const importeCuadra = (datos: DatosDeExcedente): boolean =>
  datos.amount == null ||
  Math.abs(datos.excess_units * datos.unit_price_amount - datos.amount) <= 1;

/**
 * La factura del excedente, o null si no hay nada que cobrar (cero unidades
 * o precio cero). Pura, para poder probarla.
 */
export const planearFacturaDeExcedente = (
  aviso: AvisoDeExcedente,
  contexto: {
    ajustes: AjustesDeFacturacion;
    contrato: ContratoAFacturar;
    hoy: string;
  },
): FacturaPlaneada | null => {
  const { ajustes, contrato, hoy } = contexto;
  const { data } = aviso;
  const cantidad = Number(data.excess_units);
  const centavos = Number(data.unit_price_amount);
  if (!Number.isFinite(cantidad) || cantidad <= 0) return null;
  if (!Number.isFinite(centavos) || centavos <= 0) return null;

  const inicio = data.period_start;
  const fin = finIncluido(inicio, data.period_end);
  const periodoTexto = textoDelPeriodo(inicio, fin);
  const producto = productoDelContrato(contrato);
  const concepto = data.description?.trim() || data.limit_key;

  // El precio de KontrolIA Auth se trata como los del contrato: antes de
  // IVA, salvo que el producto diga que sus precios ya lo incluyen.
  const precio = sinIva(centavos / 100, ajustes);
  const renglones = [
    {
      position: 0,
      description:
        `${producto} · Excedente de ${concepto} · ${periodoTexto}`.slice(
          0,
          1000,
        ),
      product_ref: `${contrato.application_slug ?? aviso.application.slug}:excedente:${data.limit_key}`,
      quantity: cantidad,
      unit_price: precio,
      amount: aCentavos(cantidad * precio),
      clave_prod_serv: ajustes.clave_prod_serv,
      clave_unidad: ajustes.clave_unidad,
      tax_rate: ajustes.tax_rate,
    },
  ];
  const totales = totalesDe(renglones);

  return {
    origin: "overage",
    contract_id: contrato.id,
    company_id: contrato.company_id,
    period_start: inicio,
    period_end: fin,
    due_on: sumarDias(hoy, DIAS_PARA_PAGAR_EXCEDENTE),
    currency: (data.currency || contrato.currency || "MXN")
      .toUpperCase()
      .slice(0, 3),
    payment_method: "PPD",
    payment_form: ajustes.forma_pago_transferencia,
    payment_status: "unpaid",
    paid_amount: 0,
    paid_at: null,
    source_ref: referenciaDelExcedente(aviso),
    ...totales,
    renglones,
    periodo_texto: periodoTexto,
    producto,
    notes: notaDelConsumo(data),
  };
};

export type ResultadoDeExcedente =
  | { registrada: true; factura: FacturaDeBandeja; creada: boolean }
  | {
      registrada: false;
      motivo: "no_contract" | "no_excess";
      mensaje: string;
    };

/**
 * Registra en la bandeja la factura del excedente que avisó KontrolIA Auth.
 * Se llama DESPUÉS de aplicar la foto del aviso, así que el contrato del
 * producto ya debería existir. Idempotente por el id del cierre.
 */
export const facturaDeExcedente = async (
  aviso: AvisoDeExcedente,
  org: string,
  db: Db = getServiceClient(),
  hoy: string = hoyEnMexico(),
): Promise<ResultadoDeExcedente> => {
  const aplicacion = aviso.application.slug;
  const contrato = exigir(
    await db
      .from("contracts")
      .select(COLUMNAS_DE_CONTRATO)
      .eq("organization_id", org)
      .eq("source", ORIGEN_KONTROLIA_AUTH)
      .eq("external_id", llaveDeContrato(aviso.organization_id, aplicacion))
      .maybeSingle(),
    "Buscar el contrato del excedente",
  ) as ContratoAFacturar | null;
  if (!contrato) {
    const mensaje =
      `Excedente ${referenciaDelExcedente(aviso)} sin facturar: no hay ` +
      `contrato de ${aplicacion} para la organización ${aviso.organization_id}.`;
    console.error("[facturación]", mensaje);
    return { registrada: false, motivo: "no_contract", mensaje };
  }

  const ajustes = ajustesDelProducto(
    await leerAjustes(db, org),
    contrato.application_slug ?? aplicacion,
  );
  if (!importeCuadra(aviso.data)) {
    console.warn(
      "[facturación] el importe del excedente no es unidades × precio; se factura unidades × precio",
      referenciaDelExcedente(aviso),
    );
  }
  const plan = planearFacturaDeExcedente(aviso, { ajustes, contrato, hoy });
  if (!plan) {
    return {
      registrada: false,
      motivo: "no_excess",
      mensaje: `Excedente ${referenciaDelExcedente(aviso)} sin importe: no hay nada que facturar.`,
    };
  }

  const empresa = await leerEmpresa(db, org, contrato.company_id);
  const { factura, creada } = await guardarFacturaPlaneada(db, org, plan, {
    empresa,
    timbrarSola: puedeTimbrarSola(ajustes, contrato),
    conector: await conectorDeFacturacion(db, org),
  });
  return { registrada: true, factura, creada };
};

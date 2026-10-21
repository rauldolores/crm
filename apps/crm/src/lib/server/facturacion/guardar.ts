import type { getServiceClient } from "../supabase-service";
import { ajustesDelProducto } from "./ajustes";
import {
  estadoInicial,
  listaDeProblemas,
  problemasFiscales,
} from "./planear";
import { textoDelPeriodo } from "./periodos";
import type {
  AjustesDeFacturacion,
  ContratoAFacturar,
  EmpresaFiscal,
  EstadoDeAcceso,
  EstadoDeBandeja,
  FacturaPlaneada,
  ProblemaFiscal,
} from "./tipos";

/**
 * Guardar en la base lo que la parte pura planeó: la factura con sus
 * renglones, en el estado de bandeja que le toca, y —si a la empresa le
 * faltan datos fiscales— una tarea para su responsable.
 *
 * Corre con la clave de servicio, que salta el RLS: TODA consulta lleva el
 * filtro de la organización (`org`).
 */

export type Db = ReturnType<typeof getServiceClient>;

export const exigir = <T>(
  resultado: { data: T; error: { message: string } | null },
  que: string,
): T => {
  if (resultado.error) throw new Error(`${que}: ${resultado.error.message}`);
  return resultado.data;
};

/** Las columnas de crm.invoices que usan el servidor y la bandeja. */
export const COLUMNAS_DE_FACTURA =
  "id, organization_id, connector_id, provider, quote_id, company_id, contract_id, external_id, uuid, serie, folio, status, total, subtotal, tax, currency, issued_at, error, origin, billing_status, payment_method, payment_form, payment_status, paid_amount, paid_at, due_on, period_start, period_end, source_ref, problems, approved_by, approved_at, discard_reason, stamp_attempts, access_status, access_renewed_until, access_error, access_attempts, access_updated_at, access_next_attempt_at, payment_reference, notes, created_at, updated_at";

export interface FacturaDeBandeja {
  id: number;
  organization_id: string;
  connector_id: number | null;
  provider: string;
  quote_id: number | null;
  company_id: number | null;
  contract_id: number | null;
  external_id: string | null;
  uuid: string | null;
  serie: string | null;
  folio: string | null;
  status: "stamped" | "draft" | "cancelled" | "error";
  total: number | string;
  subtotal: number | string | null;
  tax: number | string | null;
  currency: string;
  issued_at: string | null;
  error: string | null;
  origin: FacturaPlaneada["origin"] | "quote";
  billing_status: EstadoDeBandeja | null;
  payment_method: "PPD" | "PUE" | null;
  payment_form: string | null;
  payment_status: "unpaid" | "partial" | "paid" | null;
  paid_amount: number | string;
  paid_at: string | null;
  due_on: string | null;
  period_start: string | null;
  period_end: string | null;
  source_ref: string | null;
  problems: ProblemaFiscal[];
  approved_by: string | null;
  approved_at: string | null;
  discard_reason: string | null;
  stamp_attempts: number;
  access_status: EstadoDeAcceso | null;
  access_renewed_until: string | null;
  access_error: string | null;
  access_attempts: number;
  access_updated_at: string | null;
  access_next_attempt_at: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const COLUMNAS_DE_CONTRATO =
  "id, company_id, name, status, billing_period, amount, currency, renews_on, provider, application_slug, plan_name, addons, billing_enabled";

export const COLUMNAS_DE_EMPRESA =
  "id, name, tax_identifier, tax_regime, cfdi_use, zipcode, sales_id";

/** Las filas de ajustes de la organización (crudas: numeric como texto). */
export const leerAjustes = async (
  db: Db,
  org: string,
): Promise<Partial<Record<keyof AjustesDeFacturacion, unknown>>[]> =>
  (exigir(
    await db.from("billing_settings").select("*").eq("organization_id", org),
    "Leer los ajustes de facturación",
  ) ?? []) as Partial<Record<keyof AjustesDeFacturacion, unknown>>[];

export const leerEmpresa = async (
  db: Db,
  org: string,
  companyId: number | null,
): Promise<EmpresaFiscal | null> => {
  if (companyId == null) return null;
  return exigir(
    await db
      .from("companies")
      .select(COLUMNAS_DE_EMPRESA)
      .eq("organization_id", org)
      .eq("id", companyId)
      .maybeSingle(),
    "Leer la empresa",
  ) as EmpresaFiscal | null;
};

export const leerContrato = async (
  db: Db,
  org: string,
  contractId: number | null,
): Promise<ContratoAFacturar | null> => {
  if (contractId == null) return null;
  return exigir(
    await db
      .from("contracts")
      .select(COLUMNAS_DE_CONTRATO)
      .eq("organization_id", org)
      .eq("id", contractId)
      .maybeSingle(),
    "Leer el contrato",
  ) as ContratoAFacturar | null;
};

/**
 * ¿Puede timbrarse sin que nadie la revise? Solo si el producto está en
 * «timbrar sola», sus ajustes activos y el contrato tiene encendida la
 * facturación automática. Un cobro con tarjeta sin contrato, nunca.
 */
export const puedeTimbrarSola = (
  ajustes: AjustesDeFacturacion,
  contrato: Pick<ContratoAFacturar, "billing_enabled"> | null,
): boolean =>
  ajustes.mode === "auto" && ajustes.active && contrato?.billing_enabled === true;

/** El proveedor de facturación conectado (para anotarlo en la factura). */
export const conectorDeFacturacion = async (
  db: Db,
  org: string,
): Promise<{ id: number; provider: string } | null> =>
  exigir(
    await db
      .from("connectors")
      .select("id, provider")
      .eq("organization_id", org)
      .eq("family", "invoicing")
      .maybeSingle(),
    "Leer el conector de facturación",
  ) as { id: number; provider: string } | null;

/**
 * Una tarea para que el responsable de la cuenta complete los datos
 * fiscales. Una tarea pide un contacto: el primero sin archivar de la
 * empresa; si no tiene ninguno, no se crea (la factura sigue en la bandeja
 * con lo que falta a la vista).
 */
export const crearTareaDeDatosFaltantes = async (
  db: Db,
  org: string,
  empresa: EmpresaFiscal | null,
  plan: Pick<FacturaPlaneada, "producto" | "periodo_texto">,
  problemas: ProblemaFiscal[],
): Promise<boolean> => {
  if (!empresa || !problemas.length) return false;
  const contacto = exigir(
    await db
      .from("contacts")
      .select("id")
      .eq("organization_id", org)
      .eq("company_id", empresa.id)
      .is("archived_at", null)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "Buscar un contacto de la empresa",
  ) as { id: number } | null;
  if (!contacto) return false;

  const periodo = plan.periodo_texto ? ` (${plan.periodo_texto})` : "";
  const texto =
    `Completa ${listaDeProblemas(problemas)} de ${empresa.name ?? "la empresa"} ` +
    `para timbrar su factura de ${plan.producto}${periodo}. ` +
    `La factura espera en Por facturar → Falta información.`;
  exigir(
    await db.from("tasks").insert({
      organization_id: org,
      contact_id: contacto.id,
      type: "none",
      text: texto,
      due_date: new Date().toISOString(),
      sales_id: empresa.sales_id ?? null,
    }),
    "Crear la tarea de datos fiscales",
  );
  return true;
};

/** Busca la factura que ya existe con la misma llave de idempotencia. */
const facturaExistente = async (
  db: Db,
  org: string,
  plan: FacturaPlaneada,
): Promise<FacturaDeBandeja | null> => {
  let consulta = db
    .from("invoices")
    .select(COLUMNAS_DE_FACTURA)
    .eq("organization_id", org)
    .eq("origin", plan.origin);
  if (plan.source_ref) {
    consulta = consulta.eq("source_ref", plan.source_ref);
  } else if (plan.contract_id != null && plan.period_start) {
    consulta = consulta
      .eq("contract_id", plan.contract_id)
      .eq("period_start", plan.period_start);
  } else {
    return null;
  }
  return exigir(
    await consulta.limit(1).maybeSingle(),
    "Buscar la factura existente",
  ) as FacturaDeBandeja | null;
};

export interface ResultadoDeGuardado {
  factura: FacturaDeBandeja;
  creada: boolean;
  tarea: boolean;
}

/**
 * Guarda la factura planeada si no existe ya (por contrato + periodo +
 * origen, o por la referencia del cobro). Idempotente: dos corridas, o un
 * aviso repetido, devuelven la misma factura.
 */
export const guardarFacturaPlaneada = async (
  db: Db,
  org: string,
  plan: FacturaPlaneada,
  contexto: {
    empresa: EmpresaFiscal | null;
    timbrarSola: boolean;
    conector: { id: number; provider: string } | null;
  },
): Promise<ResultadoDeGuardado> => {
  const previa = await facturaExistente(db, org, plan);
  if (previa) return { factura: previa, creada: false, tarea: false };

  const problemas = problemasFiscales(contexto.empresa);
  const estado = estadoInicial(problemas, contexto.timbrarSola);
  const fila = {
    organization_id: org,
    connector_id: contexto.conector?.id ?? null,
    provider: contexto.conector?.provider ?? "faqturia",
    company_id: plan.company_id,
    contract_id: plan.contract_id,
    external_id: null,
    status: "draft",
    total: plan.total,
    subtotal: plan.subtotal,
    tax: plan.tax,
    currency: plan.currency,
    origin: plan.origin,
    billing_status: estado,
    payment_method: plan.payment_method,
    payment_form: plan.payment_form,
    payment_status: plan.payment_status,
    paid_amount: plan.paid_amount,
    paid_at: plan.paid_at,
    due_on: plan.due_on,
    period_start: plan.period_start,
    period_end: plan.period_end,
    source_ref: plan.source_ref,
    problems: problemas,
    notes: plan.notes ?? null,
    // Un cobro con tarjeta o de créditos ya renovó el acceso en KontrolIA
    // Auth al cobrarse, y un excedente no lo renueva nunca: no hay nada que
    // pedirle al pagar.
    access_status:
      plan.origin === "card" ||
      plan.origin === "credits" ||
      plan.origin === "overage"
        ? "not_applicable"
        : null,
  };

  let alta = await db
    .from("invoices")
    .insert(fila)
    .select(COLUMNAS_DE_FACTURA)
    .single();
  if (alta.error?.code === "23505") {
    // Otra corrida la creó entre la búsqueda y el alta: es esa.
    const existente = await facturaExistente(db, org, plan);
    if (existente) return { factura: existente, creada: false, tarea: false };
    // Un cobro con tarjeta del mismo periodo que otro (un cambio de plan a
    // mitad de periodo): la referencia es distinta pero el periodo choca.
    // Se guarda sin inicio de periodo; el periodo sigue en los renglones.
    if (plan.source_ref && plan.period_start) {
      alta = await db
        .from("invoices")
        .insert({ ...fila, period_start: null })
        .select(COLUMNAS_DE_FACTURA)
        .single();
    }
  }
  const factura = exigir(alta, "Guardar la factura") as FacturaDeBandeja;

  const renglones = await db.from("invoice_items").insert(
    plan.renglones.map((r) => ({
      ...r,
      organization_id: org,
      invoice_id: factura.id,
    })),
  );
  if (renglones.error) {
    // Una factura sin renglones no sirve y estorbaría a la siguiente
    // corrida (la llave de idempotencia ya estaría tomada): se quita.
    await db
      .from("invoices")
      .delete()
      .eq("organization_id", org)
      .eq("id", factura.id);
    throw new Error(`Guardar los renglones: ${renglones.error.message}`);
  }

  const tarea =
    estado === "missing_data"
      ? await crearTareaDeDatosFaltantes(
          db,
          org,
          contexto.empresa,
          plan,
          problemas,
        ).catch((error) => {
          console.error("[facturación] tarea no creada", error);
          return false;
        })
      : false;

  return { factura, creada: true, tarea };
};

/**
 * Vuelve a revisar las facturas que esperaban datos fiscales: si la empresa
 * ya los tiene, pasan a revisión o a la cola según su producto.
 */
export const revisarDatosFaltantes = async (
  db: Db,
  org: string,
): Promise<number> => {
  const pendientes = (exigir(
    await db
      .from("invoices")
      .select("id, company_id, contract_id, origin, problems")
      .eq("organization_id", org)
      .eq("billing_status", "missing_data")
      .neq("origin", "quote")
      .limit(200),
    "Leer las facturas sin datos fiscales",
  ) ?? []) as {
    id: number;
    company_id: number | null;
    contract_id: number | null;
    origin: string;
    problems: ProblemaFiscal[];
  }[];
  if (!pendientes.length) return 0;

  const filasDeAjustes = await leerAjustes(db, org);
  let movidas = 0;
  for (const factura of pendientes) {
    const empresa = await leerEmpresa(db, org, factura.company_id);
    const problemas = problemasFiscales(empresa);
    if (problemas.length) {
      if (JSON.stringify(problemas) !== JSON.stringify(factura.problems)) {
        await db
          .from("invoices")
          .update({ problems: problemas, updated_at: new Date().toISOString() })
          .eq("organization_id", org)
          .eq("id", factura.id);
      }
      continue;
    }
    const contrato = await leerContrato(db, org, factura.contract_id);
    const ajustes = ajustesDelProducto(
      filasDeAjustes,
      contrato?.application_slug ?? null,
    );
    const estado = estadoInicial([], puedeTimbrarSola(ajustes, contrato));
    await db
      .from("invoices")
      .update({
        billing_status: estado,
        problems: [],
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", org)
      .eq("id", factura.id)
      .eq("billing_status", "missing_data");
    movidas += 1;
  }
  return movidas;
};

/**
 * «Periodo: enero 2027», la nota que se imprime en la factura, seguida del
 * texto propio de la factura si lo tiene (el consumo de un excedente).
 */
export const notaDelPeriodo = (
  factura: Pick<FacturaDeBandeja, "period_start" | "period_end"> &
    Partial<Pick<FacturaDeBandeja, "notes">>,
): string | undefined => {
  const partes = [
    factura.period_start && factura.period_end
      ? `Periodo: ${textoDelPeriodo(factura.period_start, factura.period_end)}`
      : null,
    factura.notes?.trim() || null,
  ].filter(Boolean);
  return partes.length ? partes.join(". ") : undefined;
};

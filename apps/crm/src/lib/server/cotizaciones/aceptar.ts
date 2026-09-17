import type { DealPipeline, Quote, QuoteItem } from "@/components/crm/types";
import { getServiceClient } from "../supabase-service";
import {
  cotizacionPorToken,
  estaVencida,
  type CotizacionCompleta,
} from "./cotizaciones";

/**
 * Aceptar o rechazar una cotización desde su enlace público, y lo que pasa
 * después de aceptar:
 *
 * - La oportunidad pasa a la etapa ganada de su embudo, y toma el total de
 *   la cotización si no tenía importe.
 * - Con el módulo Clientes activo, nace un contrato (si la cotización lleva
 *   periodicidad) o una compra con sus líneas. Idempotente por el folio: la
 *   misma cotización aceptada dos veces no crea dos contratos.
 * - La empresa pasa a «cliente activo» si era prospecto.
 *
 * Nada de esto es la factura: eso lo hace Faqturia (u otro) al recibir el
 * webhook quotes.updated con status = accepted.
 */

export type ResultadoDeAceptacion =
  | { ok: true; cotizacion: Quote }
  | { ok: false; status: number; mensaje: string };

const MESES_POR_PERIODO = { monthly: 1, quarterly: 3, yearly: 12 } as const;

const hoy = () => new Date().toISOString().slice(0, 10);

const sumarMeses = (fechaIso: string, meses: number): string => {
  const fecha = new Date(`${fechaIso}T00:00:00Z`);
  fecha.setUTCMonth(fecha.getUTCMonth() + meses);
  return fecha.toISOString().slice(0, 10);
};

/** La etapa «ganada» del embudo de la oportunidad, según la configuración. */
const etapaGanada = (
  embudos: DealPipeline[] | undefined,
  embudo: string | null,
): string | null => {
  const elegido =
    embudos?.find((e) => e.value === embudo) ?? embudos?.[0] ?? null;
  return elegido?.pipelineStatuses?.[0] ?? null;
};

async function ganarOportunidad(cotizacion: Quote): Promise<void> {
  if (!cotizacion.deal_id) return;
  const supabase = getServiceClient();
  const organizacionId = cotizacion.organization_id as string;

  const [{ data: oportunidad }, { data: configuracion }] = await Promise.all([
    supabase
      .from("deals")
      .select("id, pipeline, amount")
      .eq("id", cotizacion.deal_id)
      .eq("organization_id", organizacionId)
      .maybeSingle(),
    supabase
      .from("configuration")
      .select("config")
      .eq("organization_id", organizacionId)
      .maybeSingle(),
  ]);
  if (!oportunidad) return;

  const config = (configuracion?.config ?? {}) as {
    dealPipelines?: DealPipeline[];
  };
  const etapa = etapaGanada(
    config.dealPipelines,
    (oportunidad.pipeline as string | null) ?? null,
  );

  await supabase
    .from("deals")
    .update({
      ...(etapa ? { stage: etapa } : {}),
      ...(!oportunidad.amount ? { amount: Math.round(cotizacion.total) } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", oportunidad.id);
}

async function registrarEnClientes(
  cotizacion: Quote,
  lineas: QuoteItem[],
): Promise<void> {
  if (!cotizacion.company_id) return;
  const supabase = getServiceClient();
  const organizacionId = cotizacion.organization_id as string;

  const { data: configuracion } = await supabase
    .from("configuration")
    .select("config")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const modulos = ((configuracion?.config ?? {}) as {
    modules?: Record<string, { active?: boolean }>;
  }).modules;
  if (!modulos?.customers?.active) return;

  const comun = {
    organization_id: organizacionId,
    company_id: cotizacion.company_id,
    currency: cotizacion.currency,
    source: "quote",
    external_id: cotizacion.number,
  };

  if (cotizacion.contract_period) {
    await supabase.from("contracts").upsert(
      {
        ...comun,
        name: cotizacion.title,
        status: "active",
        billing_period: cotizacion.contract_period,
        amount: cotizacion.total,
        started_on: hoy(),
        renews_on: sumarMeses(hoy(), MESES_POR_PERIODO[cotizacion.contract_period]),
        sales_id: cotizacion.sales_id,
        notes: `Nace de la cotización ${cotizacion.number}.`,
      },
      { onConflict: "organization_id,source,external_id", ignoreDuplicates: true },
    );
  } else {
    const { data: compra } = await supabase
      .from("purchases")
      .upsert(
        {
          ...comun,
          reference: cotizacion.number,
          purchased_on: hoy(),
          amount: cotizacion.total,
          status: "pending",
        },
        { onConflict: "organization_id,source,external_id", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();
    if (compra?.id && lineas.length > 0) {
      await supabase.from("purchase_items").insert(
        lineas.map((linea) => ({
          organization_id: organizacionId,
          purchase_id: compra.id,
          description: linea.description,
          product_ref: linea.product_ref,
          quantity: linea.quantity,
          unit_price: linea.unit_price,
          amount: linea.amount,
        })),
      );
    }
  }

  await supabase
    .from("companies")
    .update({ lifecycle_stage: "customer" })
    .eq("id", cotizacion.company_id)
    .eq("organization_id", organizacionId)
    .or("lifecycle_stage.is.null,lifecycle_stage.eq.prospect");
}

export async function aceptarCotizacion(
  token: string,
  aceptante: { nombre: string; correo: string },
): Promise<ResultadoDeAceptacion> {
  const completa = await cotizacionPorToken(token);
  if (!completa) return { ok: false, status: 404, mensaje: "No encontrada." };
  const { cotizacion, lineas } = completa;

  if (cotizacion.status === "accepted") return { ok: true, cotizacion };
  if (cotizacion.status === "rejected" || estaVencida(cotizacion)) {
    return {
      ok: false,
      status: 409,
      mensaje: "Esta cotización ya no se puede aceptar: pide una nueva.",
    };
  }

  const supabase = getServiceClient();
  const { data: aceptada, error } = await supabase
    .from("quotes")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_name: aceptante.nombre,
      accepted_by_email: aceptante.correo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cotizacion.id)
    .select("*")
    .single();
  if (error || !aceptada) {
    return { ok: false, status: 500, mensaje: "No se pudo registrar la aceptación." };
  }
  const resultado = aceptada as unknown as Quote;

  // Los efectos no bloquean la aceptación: si uno falla, la cotización ya
  // quedó aceptada y el webhook ya salió; se registra y se sigue.
  await Promise.all([
    ganarOportunidad(resultado).catch((e: unknown) =>
      console.error("[cotizaciones] no se pudo ganar la oportunidad", e),
    ),
    registrarEnClientes(resultado, lineas).catch((e: unknown) =>
      console.error("[cotizaciones] no se pudo registrar en Clientes", e),
    ),
  ]);

  return { ok: true, cotizacion: resultado };
}

export async function rechazarCotizacion(
  token: string,
  motivo: string,
): Promise<ResultadoDeAceptacion> {
  const completa = await cotizacionPorToken(token);
  if (!completa) return { ok: false, status: 404, mensaje: "No encontrada." };
  const { cotizacion } = completa;
  if (cotizacion.status === "accepted") {
    return {
      ok: false,
      status: 409,
      mensaje: "Esta cotización ya fue aceptada.",
    };
  }
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("quotes")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: motivo || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cotizacion.id)
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, status: 500, mensaje: "No se pudo registrar el rechazo." };
  }
  return { ok: true, cotizacion: data as unknown as Quote };
}

export type { CotizacionCompleta };

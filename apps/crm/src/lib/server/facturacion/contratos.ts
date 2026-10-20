import { ErrorDeConector } from "../conectores/tipos";
import { getServiceClient } from "../supabase-service";
import { ajustesDelProducto } from "./ajustes";
import {
  COLUMNAS_DE_CONTRATO,
  conectorDeFacturacion,
  exigir,
  guardarFacturaPlaneada,
  leerAjustes,
  leerContrato,
  leerEmpresa,
  puedeTimbrarSola,
  type Db,
  type FacturaDeBandeja,
} from "./guardar";
import { motivoParaNoFacturar, planearFacturaDeContrato } from "./planear";
import { hoyEnMexico } from "./periodos";
import type { ContratoAFacturar } from "./tipos";

/**
 * Facturas de los contratos por transferencia: cada contrato con la
 * facturación encendida recibe, `days_before` días antes de su renovación,
 * la factura (PPD) del periodo que sigue.
 */

export interface ResumenDePlaneacion {
  revisados: number;
  creadas: number;
  tareas: number;
}

export const planearFacturasDeContratos = async (
  org: string,
  hoy: string = hoyEnMexico(),
  db: Db = getServiceClient(),
): Promise<ResumenDePlaneacion> => {
  const contratos = (exigir(
    await db
      .from("contracts")
      .select(COLUMNAS_DE_CONTRATO)
      .eq("organization_id", org)
      .eq("billing_enabled", true)
      .eq("status", "active")
      .in("billing_period", ["monthly", "quarterly", "yearly"])
      .not("renews_on", "is", null)
      .or("provider.is.null,provider.neq.stripe")
      .limit(1000),
    "Leer los contratos a facturar",
  ) ?? []) as ContratoAFacturar[];

  const resumen: ResumenDePlaneacion = {
    revisados: contratos.length,
    creadas: 0,
    tareas: 0,
  };
  if (!contratos.length) return resumen;

  const filas = await leerAjustes(db, org);
  const conector = await conectorDeFacturacion(db, org);
  for (const contrato of contratos) {
    const ajustes = ajustesDelProducto(filas, contrato.application_slug);
    const plan = planearFacturaDeContrato(contrato, ajustes, hoy);
    if (!plan) continue;
    try {
      const empresa = await leerEmpresa(db, org, contrato.company_id);
      const { creada, tarea } = await guardarFacturaPlaneada(db, org, plan, {
        empresa,
        timbrarSola: puedeTimbrarSola(ajustes, contrato),
        conector,
      });
      if (creada) resumen.creadas += 1;
      if (tarea) resumen.tareas += 1;
    } catch (error) {
      // Un contrato con datos raros no detiene a los demás.
      console.error("[facturación] contrato", contrato.id, error);
    }
  }
  return resumen;
};

/**
 * «Facturar ahora»: la factura del periodo que sigue, sin esperar a la
 * fecha. La pide un administrador, así que no exige el interruptor del
 * contrato; sí que sea un contrato activo, con periodicidad, que no se cobre
 * con tarjeta y que tenga fecha de renovación. Idempotente: si la factura de
 * ese periodo ya existe, es esa (una descartada que nunca llegó al
 * proveedor se vuelve a armar).
 */
export const facturarContratoAhora = async (
  org: string,
  contractId: number,
  db: Db = getServiceClient(),
): Promise<{ factura: FacturaDeBandeja; creada: boolean }> => {
  const contrato = await leerContrato(db, org, contractId);
  if (!contrato) throw new ErrorDeConector("Contrato no encontrado.", 404);
  const ajustes = ajustesDelProducto(
    await leerAjustes(db, org),
    contrato.application_slug,
  );
  const hoy = hoyEnMexico();
  const motivo = motivoParaNoFacturar(contrato, ajustes, hoy, {
    forzar: true,
  });
  if (motivo) {
    const MENSAJES: Record<string, string> = {
      not_active: "Solo se factura un contrato activo.",
      not_recurring:
        "Este contrato no tiene periodicidad (mensual, trimestral o anual).",
      card: "Este contrato se cobra con tarjeta: su factura sale sola cuando se cobra.",
      no_renewal:
        "El contrato no tiene fecha de renovación: es la que dice qué periodo se factura.",
    };
    throw new ErrorDeConector(
      MENSAJES[motivo] ?? "Este contrato no se puede facturar.",
      409,
    );
  }
  const plan = planearFacturaDeContrato(contrato, ajustes, hoy, {
    forzar: true,
  });
  if (!plan) {
    throw new ErrorDeConector(
      "El contrato no tiene importe: no hay nada que facturar.",
      409,
    );
  }

  // Una descartada que nunca llegó al proveedor ocupa la llave del periodo;
  // se quita para poder armarla otra vez con los datos de hoy.
  await db
    .from("invoices")
    .delete()
    .eq("organization_id", org)
    .eq("contract_id", contrato.id)
    .eq("period_start", plan.period_start as string)
    .eq("origin", "contract")
    .eq("billing_status", "discarded")
    .is("external_id", null);

  const empresa = await leerEmpresa(db, org, contrato.company_id);
  const { factura, creada } = await guardarFacturaPlaneada(db, org, plan, {
    empresa,
    // La pidió una persona: no se timbra aquí sola; la ruta la aprueba y
    // la timbra en el mismo paso si los datos están completos.
    timbrarSola: false,
    conector: await conectorDeFacturacion(db, org),
  });
  return { factura, creada };
};

/** Enciende o apaga «Facturar automáticamente» en un contrato. */
export const cambiarFacturacionDelContrato = async (
  org: string,
  contractId: number,
  activo: boolean,
  db: Db = getServiceClient(),
): Promise<{ id: number; billing_enabled: boolean }> => {
  const fila = exigir(
    await db
      .from("contracts")
      .update({ billing_enabled: activo, updated_at: new Date().toISOString() })
      .eq("organization_id", org)
      .eq("id", contractId)
      .select("id, billing_enabled")
      .maybeSingle(),
    "Cambiar la facturación del contrato",
  ) as { id: number; billing_enabled: boolean } | null;
  if (!fila) throw new ErrorDeConector("Contrato no encontrado.", 404);
  return fila;
};

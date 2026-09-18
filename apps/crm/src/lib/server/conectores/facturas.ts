import { cotizacionPorId } from "../cotizaciones/cotizaciones";
import { getServiceClient } from "../supabase-service";
import { anotarEstado, conectorActivo } from "./almacen";
import { lineasAFacturar, validarReceptor } from "./conceptos";
import { esConectorDeFacturacion } from "./registro";
import {
  ErrorDeConector,
  type FacturaEmitida,
  type ReceptorFiscal,
} from "./tipos";

/**
 * Facturar una cotización aceptada con el proveedor conectado. El CRM manda
 * receptor y líneas, guarda la referencia que devuelve el proveedor en
 * crm.invoices y deja los datos fiscales del receptor en la empresa para
 * la próxima vez.
 */

export interface FacturaGuardada {
  id: number;
  provider: string;
  quote_id: number | null;
  company_id: number | null;
  external_id: string;
  uuid: string | null;
  serie: string | null;
  folio: string | null;
  status: FacturaEmitida["status"];
  total: number;
  currency: string;
  issued_at: string | null;
  error: string | null;
  created_at: string;
}

const COLUMNAS =
  "id, provider, quote_id, company_id, external_id, uuid, serie, folio, status, total, currency, issued_at, error, created_at";

export const facturasDeCotizacion = async (
  organizacionId: string,
  quoteId: number,
): Promise<FacturaGuardada[]> => {
  const { data, error } = await getServiceClient()
    .from("invoices")
    .select(COLUMNAS)
    .eq("organization_id", organizacionId)
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FacturaGuardada[];
};

export const facturarCotizacion = async (
  organizacionId: string,
  quoteId: number,
  receptorRecibido: Partial<ReceptorFiscal>,
  opciones: { formaPago?: string; metodoPago?: string } = {},
): Promise<FacturaGuardada> => {
  const activo = await conectorActivo(organizacionId, "invoicing");
  if (!activo || !esConectorDeFacturacion(activo.conector)) {
    throw new ErrorDeConector(
      "No hay un proveedor de facturación conectado. Conéctalo en Ajustes → Conectores.",
      404,
    );
  }
  const completa = await cotizacionPorId(organizacionId, quoteId);
  if (!completa) throw new ErrorDeConector("Cotización no encontrada.", 404);
  const { cotizacion, lineas } = completa;
  if (cotizacion.status !== "accepted") {
    throw new ErrorDeConector(
      "Solo se factura una cotización aceptada.",
      409,
    );
  }
  const previas = await facturasDeCotizacion(organizacionId, quoteId);
  if (previas.some((factura) => factura.status === "stamped")) {
    throw new ErrorDeConector("Esta cotización ya tiene factura.", 409);
  }
  const receptor = validarReceptor(receptorRecibido);

  let emitida: FacturaEmitida;
  try {
    emitida = await activo.conector.emitirFactura({
      receptor,
      lineas: lineasAFacturar(lineas),
      moneda: cotizacion.currency || "MXN",
      referencia: cotizacion.number,
      formaPago: opciones.formaPago,
      metodoPago: opciones.metodoPago,
    });
  } catch (error) {
    if (error instanceof ErrorDeConector && error.status >= 500) {
      await anotarEstado(activo.guardado.id, error.message);
    }
    throw error;
  }

  const supabase = getServiceClient();
  const ahora = new Date().toISOString();
  const { data, error } = await supabase
    .from("invoices")
    .upsert(
      {
        organization_id: organizacionId,
        connector_id: activo.guardado.id,
        provider: activo.guardado.provider,
        quote_id: cotizacion.id,
        company_id: cotizacion.company_id,
        external_id: emitida.externalId,
        uuid: emitida.uuid,
        serie: emitida.serie,
        folio: emitida.folio,
        status: emitida.status,
        total: emitida.total || Number(cotizacion.total),
        currency: emitida.currency,
        issued_at: emitida.issuedAt,
        error: emitida.error,
        updated_at: ahora,
      },
      { onConflict: "organization_id,provider,external_id" },
    )
    .select(COLUMNAS)
    .single();
  if (error) throw new Error(error.message);

  // Los datos fiscales que la persona acaba de confirmar se quedan en la
  // empresa: la siguiente factura sale sin volver a preguntarlos.
  if (cotizacion.company_id) {
    await supabase
      .from("companies")
      .update({
        tax_identifier: receptor.rfc,
        tax_regime: receptor.regimenFiscal,
        cfdi_use: receptor.usoCfdi,
        zipcode: receptor.codigoPostal,
      })
      .eq("id", cotizacion.company_id)
      .eq("organization_id", organizacionId);
  }

  await anotarEstado(activo.guardado.id, null);
  return data as FacturaGuardada;
};

/** Enlace temporal al PDF o XML de una factura de la organización. */
export const enlaceDeFactura = async (
  organizacionId: string,
  facturaId: number,
  formato: "pdf" | "xml",
): Promise<string> => {
  const { data: factura } = await getServiceClient()
    .from("invoices")
    .select("id, external_id, provider")
    .eq("organization_id", organizacionId)
    .eq("id", facturaId)
    .maybeSingle();
  if (!factura) throw new ErrorDeConector("Factura no encontrada.", 404);

  const activo = await conectorActivo(organizacionId, "invoicing");
  if (
    !activo ||
    !esConectorDeFacturacion(activo.conector) ||
    activo.guardado.provider !== factura.provider
  ) {
    throw new ErrorDeConector(
      "El proveedor que emitió esta factura ya no está conectado.",
      409,
    );
  }
  return activo.conector.enlaceDeDescarga(factura.external_id, formato);
};

/** Vuelve a preguntar al proveedor por una factura que quedó sin timbrar. */
export const refrescarFactura = async (
  organizacionId: string,
  facturaId: number,
): Promise<FacturaGuardada> => {
  const supabase = getServiceClient();
  const { data: factura } = await supabase
    .from("invoices")
    .select(COLUMNAS)
    .eq("organization_id", organizacionId)
    .eq("id", facturaId)
    .maybeSingle();
  if (!factura) throw new ErrorDeConector("Factura no encontrada.", 404);
  const activo = await conectorActivo(organizacionId, "invoicing");
  if (!activo || !esConectorDeFacturacion(activo.conector)) {
    throw new ErrorDeConector("No hay proveedor de facturación conectado.", 409);
  }
  const fresca = await activo.conector.recuperarFactura(factura.external_id);
  const { data, error } = await supabase
    .from("invoices")
    .update({
      uuid: fresca.uuid,
      serie: fresca.serie,
      folio: fresca.folio,
      status: fresca.status,
      total: fresca.total || factura.total,
      issued_at: fresca.issuedAt,
      error: fresca.status === "stamped" ? null : factura.error,
      updated_at: new Date().toISOString(),
    })
    .eq("id", facturaId)
    .select(COLUMNAS)
    .single();
  if (error) throw new Error(error.message);
  return data as FacturaGuardada;
};

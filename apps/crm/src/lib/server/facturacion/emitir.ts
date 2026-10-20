import { createHash } from "node:crypto";

import { anotarEstado, conectorActivo } from "../conectores/almacen";
import { validarReceptor } from "../conectores/conceptos";
import { esConectorDeFacturacion } from "../conectores/registro";
import {
  ErrorDeConector,
  type FacturaEmitida,
  type PeticionDeFactura,
} from "../conectores/tipos";
import { getServiceClient } from "../supabase-service";
import {
  COLUMNAS_DE_FACTURA,
  exigir,
  leerEmpresa,
  notaDelPeriodo,
  type Db,
  type FacturaDeBandeja,
} from "./guardar";
import { problemasFiscales } from "./planear";

/**
 * Timbrar una factura de la bandeja con el proveedor conectado.
 *
 * Nunca dos veces la misma:
 *   1. Se «toma» con un cambio condicional queued → stamping. Si otra corrida
 *      (o la otra pestaña) ya la tomó, este cambio no encuentra fila y aquí
 *      se detiene.
 *   2. A Faqturia se le manda una clave de idempotencia: si el proceso se
 *      cae a mitad y la factura se reintenta, Faqturia devuelve la misma en
 *      vez de timbrar otra (24 h). Cambia solo cuando una persona pide otro
 *      intento (stamp_attempts) o cuando cambian los datos.
 *   3. Si ya tiene id en el proveedor, no se crea: se le pregunta cómo va.
 */

export interface ResultadoDeEmision {
  factura: FacturaDeBandeja;
  /** Por qué no quedó timbrada, en palabras para la persona. */
  mensaje: string | null;
}

interface Renglon {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  tax_rate: number | string;
  product_ref: string | null;
  clave_prod_serv: string;
  clave_unidad: string;
}

const correoDeLaEmpresa = async (
  db: Db,
  org: string,
  companyId: number,
): Promise<string | null> => {
  const { data } = await db
    .from("contacts")
    .select("email_jsonb")
    .eq("organization_id", org)
    .eq("company_id", companyId)
    .is("archived_at", null)
    .order("id", { ascending: true })
    .limit(5);
  for (const contacto of (data ?? []) as {
    email_jsonb: { email?: string }[] | null;
  }[]) {
    const correo = contacto.email_jsonb?.find((e) => e?.email?.trim())?.email;
    if (correo) return correo.trim();
  }
  return null;
};

/** Clave de idempotencia: factura + intento + huella de lo que se pide. */
export const claveDeIdempotencia = (
  org: string,
  factura: Pick<FacturaDeBandeja, "id" | "stamp_attempts">,
  peticion: Omit<PeticionDeFactura, "claveDeIdempotencia">,
): string => {
  const huella = createHash("sha256")
    .update(JSON.stringify(peticion))
    .digest("hex")
    .slice(0, 16);
  // ≤ 128 caracteres: «vinqulia-» + uuid + id + intento + huella.
  return `vinqulia-${org}-${factura.id}-${factura.stamp_attempts}-${huella}`;
};

const estadoDeBandeja = (emitida: FacturaEmitida) =>
  emitida.status === "stamped"
    ? "stamped"
    : emitida.status === "cancelled"
      ? "cancelled"
      : "error";

export const emitirFactura = async (
  org: string,
  facturaId: number,
  db: Db = getServiceClient(),
): Promise<ResultadoDeEmision> => {
  const ahora = () => new Date().toISOString();
  const tomada = exigir(
    await db
      .from("invoices")
      .update({ billing_status: "stamping", updated_at: ahora() })
      .eq("organization_id", org)
      .eq("id", facturaId)
      .eq("billing_status", "queued")
      .select(COLUMNAS_DE_FACTURA)
      .maybeSingle(),
    "Tomar la factura",
  ) as FacturaDeBandeja | null;

  if (!tomada) {
    const actual = exigir(
      await db
        .from("invoices")
        .select(COLUMNAS_DE_FACTURA)
        .eq("organization_id", org)
        .eq("id", facturaId)
        .maybeSingle(),
      "Leer la factura",
    ) as FacturaDeBandeja | null;
    if (!actual) throw new ErrorDeConector("Factura no encontrada.", 404);
    if (actual.billing_status === "stamped") {
      return { factura: actual, mensaje: null };
    }
    throw new ErrorDeConector(
      actual.billing_status === "stamping"
        ? "Esta factura ya se está timbrando. Espera un momento y recarga."
        : "Esta factura no está lista para timbrarse: primero hay que aprobarla.",
      409,
    );
  }

  const guardar = async (cambios: Record<string, unknown>) =>
    exigir(
      await db
        .from("invoices")
        .update({ ...cambios, updated_at: ahora() })
        .eq("organization_id", org)
        .eq("id", facturaId)
        .select(COLUMNAS_DE_FACTURA)
        .single(),
      "Guardar el resultado del timbrado",
    ) as FacturaDeBandeja;

  let conectorId: number | null = null;
  try {
    const activo = await conectorActivo(org, "invoicing");
    if (!activo || !esConectorDeFacturacion(activo.conector)) {
      throw new ErrorDeConector(
        "No hay un proveedor de facturación conectado. Conéctalo en Ajustes → Conectores.",
        409,
      );
    }
    conectorId = activo.guardado.id;

    let emitida: FacturaEmitida;
    if (tomada.external_id) {
      emitida = await activo.conector.recuperarFactura(tomada.external_id);
    } else {
      const empresa = await leerEmpresa(db, org, tomada.company_id);
      const problemas = problemasFiscales(empresa);
      if (problemas.length || !empresa) {
        const factura = await guardar({
          billing_status: "missing_data",
          problems: problemas,
        });
        return {
          factura,
          mensaje:
            "A la empresa le faltan datos fiscales. Complétalos en su ficha y vuelve a aprobarla.",
        };
      }
      const receptor = validarReceptor({
        razonSocial: empresa.name ?? "",
        rfc: empresa.tax_identifier ?? "",
        regimenFiscal: empresa.tax_regime ?? "",
        usoCfdi: empresa.cfdi_use ?? "",
        codigoPostal: empresa.zipcode ?? "",
        email: await correoDeLaEmpresa(db, org, empresa.id),
      });
      const renglones = (exigir(
        await db
          .from("invoice_items")
          .select(
            "description, quantity, unit_price, tax_rate, product_ref, clave_prod_serv, clave_unidad",
          )
          .eq("organization_id", org)
          .eq("invoice_id", facturaId)
          .order("position"),
        "Leer los renglones",
      ) ?? []) as Renglon[];
      if (!renglones.length) {
        throw new ErrorDeConector("La factura no tiene renglones.", 422);
      }
      const peticion: Omit<PeticionDeFactura, "claveDeIdempotencia"> = {
        receptor,
        lineas: renglones.map((r) => ({
          descripcion: r.description,
          cantidad: Number(r.quantity),
          precioUnitario: Number(r.unit_price),
          descuento: 0,
          tasaIva: Number(r.tax_rate),
          sku: r.product_ref,
          claveProdServ: r.clave_prod_serv,
          claveUnidad: r.clave_unidad,
        })),
        moneda: tomada.currency || "MXN",
        referencia: `VNQ-${tomada.id}`,
        formaPago: tomada.payment_form ?? undefined,
        metodoPago: tomada.payment_method ?? undefined,
        notas: notaDelPeriodo(tomada),
        fechaDeVencimiento:
          tomada.payment_method === "PPD" && tomada.due_on
            ? tomada.due_on
            : undefined,
      };
      emitida = await activo.conector.emitirFactura({
        ...peticion,
        claveDeIdempotencia: claveDeIdempotencia(org, tomada, peticion),
      });
    }

    const factura = await guardar({
      connector_id: activo.guardado.id,
      provider: activo.guardado.provider,
      external_id: emitida.externalId,
      uuid: emitida.uuid,
      serie: emitida.serie,
      folio: emitida.folio,
      status: emitida.status,
      issued_at: emitida.issuedAt,
      total: emitida.total || Number(tomada.total),
      error: emitida.status === "stamped" ? null : emitida.error,
      billing_status: estadoDeBandeja(emitida),
    });
    await anotarEstado(activo.guardado.id, null);
    return {
      factura,
      mensaje:
        emitida.status === "stamped"
          ? null
          : (emitida.error ??
            "El proveedor recibió la factura pero todavía no la timbra."),
    };
  } catch (error) {
    const mensaje =
      error instanceof ErrorDeConector
        ? error.message
        : "Ocurrió un error inesperado al timbrar.";
    if (!(error instanceof ErrorDeConector)) {
      console.error("[facturación] timbrado", facturaId, error);
    }
    if (conectorId && error instanceof ErrorDeConector && error.status >= 500) {
      await anotarEstado(conectorId, mensaje);
    }
    const factura = await guardar({ billing_status: "error", error: mensaje });
    return { factura, mensaje };
  }
};

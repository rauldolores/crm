import { anotarEstado } from "../conectores/almacen";
import {
  ErrorDeConector,
  type ConectorDeFacturacion,
} from "../conectores/tipos";
import {
  COLUMNAS_DE_FACTURA,
  exigir,
  type Db,
  type FacturaDeBandeja,
} from "./guardar";
import { marcarAccesoAlPagar } from "./acceso";
import {
  cambiosDesdeFaqturia,
  DetalleDeFaqturia,
  type DetalleDeFaqturia as Detalle,
} from "./faqturiaEstado";

/**
 * Lo que pasa con la factura DESPUÉS de timbrarla vive en Faqturia: el
 * pago de una PPD (complemento de pago), la cancelación. Llega por dos
 * caminos que terminan aquí: el aviso de Faqturia (/api/integraciones/
 * faqturia) y, por si un aviso se perdió, la revisión de cada hora de las
 * facturas que siguen sin pagar.
 */

/** Aplica el detalle de Faqturia a la factura con ese id externo. */
export const actualizarDesdeFaqturia = async (
  db: Db,
  org: string,
  detalle: Detalle,
): Promise<FacturaDeBandeja | null> => {
  const actual = exigir(
    await db
      .from("invoices")
      .select(COLUMNAS_DE_FACTURA)
      .eq("organization_id", org)
      .eq("provider", "faqturia")
      .eq("external_id", detalle.id)
      .maybeSingle(),
    "Buscar la factura del aviso",
  ) as FacturaDeBandeja | null;
  if (!actual) return null;

  const cambios = cambiosDesdeFaqturia(detalle, actual);
  const nueva = exigir(
    await db
      .from("invoices")
      .update(cambios)
      .eq("organization_id", org)
      .eq("id", actual.id)
      .select(COLUMNAS_DE_FACTURA)
      .single(),
    "Actualizar la factura con el aviso",
  ) as FacturaDeBandeja;

  // Quedó pagada: si es de un contrato de KontrolIA Auth por transferencia,
  // su acceso queda «pendiente» de renovar (lo pide quien llamó, o el
  // proceso de cada hora).
  if (nueva.payment_status === "paid" && !nueva.access_status) {
    nueva.access_status = await marcarAccesoAlPagar(db, org, nueva);
  }
  return nueva;
};

/** Ventana de la revisión: más vieja que esto ya no se pregunta sola. */
const DIAS_A_REVISAR = 120;

/**
 * Pregunta al proveedor por las facturas timbradas que siguen sin pagar
 * (o pagadas en parte) de los últimos 120 días.
 */
export const conciliarAbiertas = async (
  db: Db,
  org: string,
  conector: ConectorDeFacturacion,
  conectorId: number,
  limite = 25,
): Promise<{ revisadas: number; cambiadas: number }> => {
  const desde = new Date(Date.now() - DIAS_A_REVISAR * 86_400_000).toISOString();
  const abiertas = (exigir(
    await db
      .from("invoices")
      .select("id, external_id, payment_status, billing_status")
      .eq("organization_id", org)
      .eq("provider", "faqturia")
      .eq("billing_status", "stamped")
      .in("payment_status", ["unpaid", "partial"])
      .not("external_id", "is", null)
      .gte("created_at", desde)
      .order("updated_at", { ascending: true })
      .limit(limite),
    "Leer las facturas sin pagar",
  ) ?? []) as {
    id: number;
    external_id: string;
    payment_status: string;
    billing_status: string;
  }[];

  let cambiadas = 0;
  for (const factura of abiertas) {
    try {
      const fresca = await conector.recuperarFactura(factura.external_id);
      const detalle = DetalleDeFaqturia.safeParse(fresca.detalle ?? {});
      if (!detalle.success) continue;
      const nueva = await actualizarDesdeFaqturia(db, org, detalle.data);
      if (
        nueva &&
        (nueva.payment_status !== factura.payment_status ||
          nueva.billing_status !== factura.billing_status)
      ) {
        cambiadas += 1;
      }
    } catch (error) {
      if (error instanceof ErrorDeConector && error.status >= 500) {
        await anotarEstado(conectorId, error.message);
        break;
      }
      // Una factura que ya no existe allá no detiene a las demás; sí se
      // marca como revisada para que la siguiente corrida empiece por otra.
      await db
        .from("invoices")
        .update({ updated_at: new Date().toISOString() })
        .eq("organization_id", org)
        .eq("id", factura.id);
    }
  }
  return { revisadas: abiertas.length, cambiadas };
};

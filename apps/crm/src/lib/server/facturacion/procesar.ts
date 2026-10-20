import { conectorActivo } from "../conectores/almacen";
import { esConectorDeFacturacion } from "../conectores/registro";
import { getServiceClient } from "../supabase-service";
import { renovarAccesosPendientes } from "./acceso";
import { conciliarAbiertas } from "./conciliar";
import { planearFacturasDeContratos } from "./contratos";
import { emitirFactura } from "./emitir";
import { exigir, revisarDatosFaltantes, type Db } from "./guardar";
import { hoyEnMexico } from "./periodos";

/**
 * El proceso de cada hora (POST /api/facturacion/procesar, lo despierta
 * pg_cron). Por cada organización con Faqturia conectada:
 *   1. arma las facturas de los contratos a los que ya les toca;
 *   2. revisa otra vez las que esperaban datos fiscales;
 *   3. regresa a la cola las que se quedaron «timbrando» por un corte;
 *   4. timbra las que están en la cola (con tope por corrida);
 *   5. pregunta a Faqturia por las timbradas que siguen sin pagar;
 *   6. pide a KontrolIA Auth renovar el acceso de las facturas de contrato
 *      ya pagadas (pendientes y con error que toca reintentar).
 * Una organización que falla no detiene a las demás.
 */

const TIMBRADAS_POR_CORRIDA = 10;
const REVISADAS_POR_CORRIDA = 25;
/** Una factura «timbrando» más de esto se quedó a medias: se reintenta. */
const MINUTOS_ATORADA = 15;

export interface ResumenDeOrganizacion {
  organizacion: string;
  creadas: number;
  tareas: number;
  liberadas: number;
  timbradas: number;
  con_error: number;
  conciliadas: number;
  accesos_renovados: number;
  accesos_con_error: number;
  error?: string;
}

const procesarOrganizacion = async (
  db: Db,
  org: string,
  hoy: string,
): Promise<ResumenDeOrganizacion> => {
  const resumen: ResumenDeOrganizacion = {
    organizacion: org,
    creadas: 0,
    tareas: 0,
    liberadas: 0,
    timbradas: 0,
    con_error: 0,
    conciliadas: 0,
    accesos_renovados: 0,
    accesos_con_error: 0,
  };

  const plan = await planearFacturasDeContratos(org, hoy, db);
  resumen.creadas = plan.creadas;
  resumen.tareas = plan.tareas;
  resumen.liberadas = await revisarDatosFaltantes(db, org);

  // Atoradas: la clave de idempotencia que se mandó a Faqturia es la misma,
  // así que si alcanzó a timbrarla, el reintento recibe esa misma factura.
  const limite = new Date(Date.now() - MINUTOS_ATORADA * 60_000).toISOString();
  await db
    .from("invoices")
    .update({ billing_status: "queued", updated_at: new Date().toISOString() })
    .eq("organization_id", org)
    .eq("billing_status", "stamping")
    .lt("updated_at", limite);

  const enCola = (exigir(
    await db
      .from("invoices")
      .select("id")
      .eq("organization_id", org)
      .eq("billing_status", "queued")
      .order("created_at", { ascending: true })
      .limit(TIMBRADAS_POR_CORRIDA),
    "Leer la cola de timbrado",
  ) ?? []) as { id: number }[];
  for (const { id } of enCola) {
    try {
      const { factura } = await emitirFactura(org, id, db);
      if (factura.billing_status === "stamped") resumen.timbradas += 1;
      else resumen.con_error += 1;
    } catch {
      // Otra corrida la tomó primero: no cuenta como error.
    }
  }

  const activo = await conectorActivo(org, "invoicing");
  if (activo && esConectorDeFacturacion(activo.conector)) {
    const { cambiadas } = await conciliarAbiertas(
      db,
      org,
      activo.conector,
      activo.guardado.id,
      REVISADAS_POR_CORRIDA,
    );
    resumen.conciliadas = cambiadas;
  }

  // Al final: lo que la revisión de arriba acaba de marcar pagado también
  // entra en esta misma corrida.
  const acceso = await renovarAccesosPendientes(db, org);
  resumen.accesos_renovados = acceso.renovadas;
  resumen.accesos_con_error = acceso.con_error;
  return resumen;
};

export const procesarFacturacion = async (
  db: Db = getServiceClient(),
  hoy: string = hoyEnMexico(),
): Promise<ResumenDeOrganizacion[]> => {
  const conectores = (exigir(
    await db
      .from("connectors")
      .select("organization_id")
      .eq("family", "invoicing")
      .eq("provider", "faqturia"),
    "Leer las organizaciones con Faqturia",
  ) ?? []) as { organization_id: string }[];

  const resultados: ResumenDeOrganizacion[] = [];
  for (const { organization_id: org } of conectores) {
    try {
      resultados.push(await procesarOrganizacion(db, org, hoy));
    } catch (error) {
      console.error("[facturación] organización", org, error);
      resultados.push({
        organizacion: org,
        creadas: 0,
        tareas: 0,
        liberadas: 0,
        timbradas: 0,
        con_error: 0,
        conciliadas: 0,
        accesos_renovados: 0,
        accesos_con_error: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return resultados;
};

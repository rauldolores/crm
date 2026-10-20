import { ErrorDeConector } from "../conectores/tipos";
import { getServiceClient } from "../supabase-service";
import { emitirFactura, type ResultadoDeEmision } from "./emitir";
import {
  COLUMNAS_DE_FACTURA,
  exigir,
  leerEmpresa,
  type Db,
  type FacturaDeBandeja,
} from "./guardar";
import { listaDeProblemas, problemasFiscales } from "./planear";

/**
 * Lo que una persona hace con una factura de la bandeja: aprobarla (y
 * timbrarla en el mismo paso), descartarla o reintentar una que falló.
 * Las rutas exigen administrador; aquí se comprueba la organización en cada
 * consulta y que la transición tenga sentido.
 */

const leer = async (
  db: Db,
  org: string,
  id: number,
): Promise<FacturaDeBandeja> => {
  const factura = exigir(
    await db
      .from("invoices")
      .select(COLUMNAS_DE_FACTURA)
      .eq("organization_id", org)
      .eq("id", id)
      .maybeSingle(),
    "Leer la factura",
  ) as FacturaDeBandeja | null;
  if (!factura) throw new ErrorDeConector("Factura no encontrada.", 404);
  if (factura.origin === "quote") {
    throw new ErrorDeConector(
      "Las facturas de cotización se gestionan desde su cotización.",
      409,
    );
  }
  return factura;
};

/**
 * Pasa la factura a la cola desde los estados permitidos, con un cambio
 * condicional: si otra persona la movió en el mismo instante, este no la
 * encuentra y avisa.
 */
const encolar = async (
  db: Db,
  org: string,
  factura: FacturaDeBandeja,
  desde: string[],
  extra: Record<string, unknown>,
): Promise<void> => {
  const movida = exigir(
    await db
      .from("invoices")
      .update({
        billing_status: "queued",
        problems: [],
        error: null,
        stamp_attempts: (factura.stamp_attempts ?? 0) + 1,
        updated_at: new Date().toISOString(),
        ...extra,
      })
      .eq("organization_id", org)
      .eq("id", factura.id)
      .in("billing_status", desde)
      .select("id")
      .maybeSingle(),
    "Poner la factura en la cola",
  );
  if (!movida) {
    throw new ErrorDeConector(
      "La factura cambió mientras tanto. Recarga la bandeja.",
      409,
    );
  }
};

/** Revisa los datos fiscales; si faltan, la deja en «falta información». */
const exigirDatosFiscales = async (
  db: Db,
  org: string,
  factura: FacturaDeBandeja,
): Promise<void> => {
  const problemas = problemasFiscales(
    await leerEmpresa(db, org, factura.company_id),
  );
  if (!problemas.length) return;
  await db
    .from("invoices")
    .update({
      billing_status: "missing_data",
      problems: problemas,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", org)
    .eq("id", factura.id)
    .in("billing_status", ["pending_review", "missing_data", "error"]);
  throw new ErrorDeConector(
    `Antes de timbrar falta ${listaDeProblemas(problemas)} en la ficha de la empresa.`,
    422,
  );
};

export const aprobarFactura = async (
  org: string,
  id: number,
  usuarioId: string,
  db: Db = getServiceClient(),
): Promise<ResultadoDeEmision> => {
  const factura = await leer(db, org, id);
  if (!["pending_review", "missing_data"].includes(factura.billing_status ?? "")) {
    throw new ErrorDeConector("Esta factura no está esperando revisión.", 409);
  }
  await exigirDatosFiscales(db, org, factura);
  await encolar(db, org, factura, ["pending_review", "missing_data"], {
    approved_by: usuarioId || null,
    approved_at: new Date().toISOString(),
  });
  return emitirFactura(org, id, db);
};

export const reintentarFactura = async (
  org: string,
  id: number,
  db: Db = getServiceClient(),
): Promise<ResultadoDeEmision> => {
  const factura = await leer(db, org, id);
  if (factura.billing_status !== "error") {
    throw new ErrorDeConector("Solo se reintenta una factura con error.", 409);
  }
  if (!factura.external_id) await exigirDatosFiscales(db, org, factura);
  await encolar(db, org, factura, ["error"], {});
  return emitirFactura(org, id, db);
};

export const descartarFactura = async (
  org: string,
  id: number,
  motivo: string,
  db: Db = getServiceClient(),
): Promise<FacturaDeBandeja> => {
  const factura = await leer(db, org, id);
  const motivoLimpio = motivo.trim().slice(0, 500);
  if (!motivoLimpio) {
    throw new ErrorDeConector("Escribe por qué se descarta.", 400);
  }
  const descartable = ["pending_review", "missing_data", "error", "queued"];
  if (!descartable.includes(factura.billing_status ?? "")) {
    throw new ErrorDeConector(
      "Una factura timbrada no se descarta: se cancela en el proveedor.",
      409,
    );
  }
  const fila = exigir(
    await db
      .from("invoices")
      .update({
        billing_status: "discarded",
        discard_reason: motivoLimpio,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", org)
      .eq("id", id)
      .in("billing_status", descartable)
      .select(COLUMNAS_DE_FACTURA)
      .maybeSingle(),
    "Descartar la factura",
  ) as FacturaDeBandeja | null;
  if (!fila) {
    throw new ErrorDeConector(
      "La factura cambió mientras tanto. Recarga la bandeja.",
      409,
    );
  }
  return fila;
};

/**
 * «Facturar ahora» desde la ficha: arma la del siguiente periodo y, si los
 * datos fiscales están completos, la aprueba y la timbra en el mismo paso
 * (el clic de un administrador es la aprobación).
 */
export const aprobarSiSePuede = async (
  org: string,
  factura: FacturaDeBandeja,
  usuarioId: string,
  db: Db = getServiceClient(),
): Promise<ResultadoDeEmision> => {
  if (factura.billing_status === "pending_review") {
    return aprobarFactura(org, factura.id, usuarioId, db);
  }
  if (factura.billing_status === "queued") {
    return emitirFactura(org, factura.id, db);
  }
  const mensajes: Record<string, string> = {
    missing_data: `A la empresa le falta ${listaDeProblemas(factura.problems ?? [])} para timbrar. La factura espera en Por facturar.`,
    stamped: "La factura de ese periodo ya está timbrada.",
    stamping: "La factura de ese periodo ya se está timbrando.",
    error: "La factura de ese periodo tuvo un error; reinténtala desde Por facturar.",
    cancelled: "La factura de ese periodo se canceló en el proveedor.",
  };
  return {
    factura,
    mensaje: mensajes[factura.billing_status ?? ""] ?? null,
  };
};

import { z } from "zod";

import { autenticarPuente } from "@/lib/server/autenticarPuente";
import { reconciliarEmpresa } from "@/lib/server/clientes/reconciliar";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Ingesta de compras desde un sistema externo (facturación, ERP, tienda).
 *
 * Un sistema ajeno no conoce los ids de Vinqulia: identifica al cliente con
 * lo que tiene —RFC, correo o su propio identificador— y esta ruta lo
 * resuelve a la empresa del CRM (ver reconciliarEmpresa). Si no la encuentra,
 * lo dice en vez de crear una a ciegas.
 *
 * Idempotente: reenviar la misma compra (mismo `origen` + `externalId`) la
 * actualiza en vez de duplicarla. Un reintento o una resincronización no
 * ensucian la base.
 *
 * Acepta clave de API (`Authorization: Bearer vnq_...`), que es como se
 * integra un sistema externo, o sesión.
 */

const Linea = z.object({
  descripcion: z.string().min(1).max(500),
  referenciaProducto: z.string().max(200).optional(),
  cantidad: z.number().positive().default(1),
  precioUnitario: z.number().optional(),
  importe: z.number().optional(),
});

const Compra = z.object({
  origen: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Solo minúsculas, números, guion y guion bajo."),
  externalId: z.string().min(1).max(200),
  cliente: z.object({
    externalId: z.string().max(200).optional(),
    rfc: z.string().max(50).optional(),
    email: z.string().email().optional(),
    nombre: z.string().max(200).optional(),
  }),
  referencia: z.string().max(100).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "aaaa-mm-dd"),
  importe: z.number(),
  moneda: z.string().length(3).default("MXN"),
  estado: z.enum(["paid", "pending", "cancelled", "refunded"]).default("paid"),
  /** externalId del contrato al que pertenece, si es una mensualidad. */
  contratoExternalId: z.string().max(200).optional(),
  lineas: z.array(Linea).max(200).default([]),
});

const esError = (estado: number, mensaje: string, extra?: object) =>
  Response.json({ message: mensaje, ...extra }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await autenticarPuente(peticion);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth;

  const cuerpo = await peticion.json().catch(() => null);
  const validado = Compra.safeParse(cuerpo);
  if (!validado.success) {
    return esError(400, "Datos de la compra no válidos.", {
      errores: validado.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      })),
    });
  }
  const compra = validado.data;

  const empresa = await reconciliarEmpresa(organizacionId, compra.origen, {
    externalId: compra.cliente.externalId,
    taxId: compra.cliente.rfc,
    email: compra.cliente.email,
    name: compra.cliente.nombre,
  });
  if (!empresa.ok) {
    // 422 y no 404: la petición está bien formada; es el CRM el que no
    // puede atribuirla. El sistema de origen debe guardarla para reintentar
    // cuando la empresa exista.
    return esError(422, empresa.motivo, { clienteSinIdentificar: true });
  }

  const supabase = getServiceClient();

  let contratoId: number | null = null;
  if (compra.contratoExternalId) {
    const { data } = await supabase
      .from("contracts")
      .select("id")
      .eq("organization_id", organizacionId)
      .eq("source", compra.origen)
      .eq("external_id", compra.contratoExternalId)
      .maybeSingle();
    contratoId = (data?.id as number | undefined) ?? null;
  }

  const { data: guardada, error } = await supabase
    .from("purchases")
    .upsert(
      {
        organization_id: organizacionId,
        company_id: empresa.companyId,
        contract_id: contratoId,
        reference: compra.referencia ?? null,
        purchased_on: compra.fecha,
        amount: compra.importe,
        currency: compra.moneda,
        status: compra.estado,
        source: compra.origen,
        external_id: compra.externalId,
      },
      { onConflict: "organization_id,source,external_id" },
    )
    .select("id")
    .single();

  if (error || !guardada) {
    return esError(500, error?.message ?? "No se pudo guardar la compra.");
  }
  const compraId = guardada.id as number;

  // Las líneas se reemplazan enteras: en una resincronización, lo que manda
  // el origen es la verdad, y mezclar líneas viejas con nuevas dejaría
  // fantasmas.
  await supabase.from("purchase_items").delete().eq("purchase_id", compraId);
  if (compra.lineas.length) {
    await supabase.from("purchase_items").insert(
      compra.lineas.map((linea) => ({
        organization_id: organizacionId,
        purchase_id: compraId,
        description: linea.descripcion,
        product_ref: linea.referenciaProducto ?? null,
        quantity: linea.cantidad,
        unit_price: linea.precioUnitario ?? null,
        amount:
          linea.importe ??
          (linea.precioUnitario != null
            ? linea.precioUnitario * linea.cantidad
            : null),
      })),
    );
  }

  // Un cliente que compra es un cliente activo: si estaba como prospecto (o
  // sin etapa), se promueve. Nunca se degrada desde aquí — bajar a «en
  // riesgo» o «perdido» es una decisión de una persona, no de una factura.
  await supabase
    .from("companies")
    .update({ lifecycle_stage: "customer" })
    .eq("id", empresa.companyId)
    .eq("organization_id", organizacionId)
    .or("lifecycle_stage.is.null,lifecycle_stage.eq.prospect");

  return Response.json({
    ok: true,
    compraId,
    empresaId: empresa.companyId,
    atribuidaPor: empresa.por,
  });
}

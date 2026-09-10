import { z } from "zod";

import { autenticarPuente } from "@/lib/server/autenticarPuente";
import { reconciliarEmpresa } from "@/lib/server/clientes/reconciliar";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Ingesta de contratos y suscripciones desde un sistema externo.
 *
 * Mismo contrato que /api/clientes/compras: el cliente se identifica con lo
 * que el origen tiene (RFC, correo, su propio id), la ruta lo resuelve, y
 * reenviar el mismo contrato (mismo `origen` + `externalId`) lo actualiza —
 * que es justo lo que pasa cuando cambia de importe o se renueva.
 */

const Contrato = z.object({
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
  nombre: z.string().min(1).max(200),
  estado: z
    .enum(["active", "paused", "cancelled", "expired"])
    .default("active"),
  periodicidad: z
    .enum(["monthly", "quarterly", "yearly", "one_time"])
    .optional(),
  importe: z.number().optional(),
  moneda: z.string().length(3).default("MXN"),
  inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  renuevaEl: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  renovacionAutomatica: z.boolean().default(true),
  notas: z.string().max(2000).optional(),
});

const esError = (estado: number, mensaje: string, extra?: object) =>
  Response.json({ message: mensaje, ...extra }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await autenticarPuente(peticion);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth;

  const cuerpo = await peticion.json().catch(() => null);
  const validado = Contrato.safeParse(cuerpo);
  if (!validado.success) {
    return esError(400, "Datos del contrato no válidos.", {
      errores: validado.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      })),
    });
  }
  const contrato = validado.data;

  const empresa = await reconciliarEmpresa(organizacionId, contrato.origen, {
    externalId: contrato.cliente.externalId,
    taxId: contrato.cliente.rfc,
    email: contrato.cliente.email,
    name: contrato.cliente.nombre,
  });
  if (!empresa.ok) {
    return esError(422, empresa.motivo, { clienteSinIdentificar: true });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("contracts")
    .upsert(
      {
        organization_id: organizacionId,
        company_id: empresa.companyId,
        name: contrato.nombre,
        status: contrato.estado,
        billing_period: contrato.periodicidad ?? null,
        amount: contrato.importe ?? null,
        currency: contrato.moneda,
        started_on: contrato.inicio ?? null,
        renews_on: contrato.renuevaEl ?? null,
        ended_on: contrato.fin ?? null,
        auto_renew: contrato.renovacionAutomatica,
        notes: contrato.notas ?? null,
        source: contrato.origen,
        external_id: contrato.externalId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,source,external_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    return esError(500, error?.message ?? "No se pudo guardar el contrato.");
  }

  if (contrato.estado === "active") {
    await supabase
      .from("companies")
      .update({ lifecycle_stage: "customer" })
      .eq("id", empresa.companyId)
      .eq("organization_id", organizacionId)
      .or("lifecycle_stage.is.null,lifecycle_stage.eq.prospect");
  }

  return Response.json({
    ok: true,
    contratoId: data.id,
    empresaId: empresa.companyId,
    atribuidaPor: empresa.por,
  });
}

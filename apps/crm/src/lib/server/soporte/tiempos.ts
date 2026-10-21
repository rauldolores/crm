import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CorreccionDeTiempo,
  RegistroDeTiempo,
} from "@/lib/soporteTiempos";

/**
 * Altas en crm.soporte_tiempos desde el servidor (clave de servicio).
 *
 * La clave de servicio salta el RLS, así que la organización se manda
 * siempre explícita: el disparador crm.preparar_soporte_tiempo la compara
 * con la del ticket y rechaza el alta si no coinciden. La empresa y el
 * contrato los copia la base del ticket; aquí no se mandan.
 */

export type ResultadoDeTiempo =
  | { ok: true; ids: number[] }
  | { ok: false; estado: number; mensaje: string };

/** Los mensajes de los disparadores ya están escritos para el usuario. */
const mensajeDeLaBase = (mensaje: string | undefined): string =>
  mensaje && !/violates|constraint|duplicate key/i.test(mensaje)
    ? mensaje
    : "No se pudo guardar el tiempo.";

export async function registrarTiempo(
  db: SupabaseClient,
  organizacionId: string,
  atendio: number | null,
  registro: RegistroDeTiempo,
): Promise<ResultadoDeTiempo> {
  const { data, error } = await db
    .from("soporte_tiempos")
    .insert({
      organization_id: organizacionId,
      ticket_id: registro.ticketId,
      atendio,
      minutos: registro.minutos,
      consume: registro.consume,
      motivo_no_consume: registro.motivoNoConsume,
      descripcion_cliente: registro.descripcionCliente,
      nota_interna: registro.notaInterna,
      ...(registro.fechaAtencion
        ? { fecha_atencion: registro.fechaAtencion }
        : {}),
      autorizado_por: registro.autorizadoPor,
      autorizado_en: registro.autorizadoEn,
    })
    .select("id");
  if (error) {
    return { ok: false, estado: 400, mensaje: mensajeDeLaBase(error.message) };
  }
  return { ok: true, ids: (data ?? []).map((fila) => fila.id as number) };
}

/**
 * Anula un registro con otro en contra y, si se indica la cifra buena, deja
 * un registro nuevo igual al original con esos minutos. Las dos filas van en
 * un solo INSERT: o quedan las dos o ninguna.
 */
export async function corregirTiempo(
  db: SupabaseClient,
  organizacionId: string,
  atendio: number | null,
  correccion: CorreccionDeTiempo,
): Promise<ResultadoDeTiempo> {
  const { data: original } = await db
    .from("soporte_tiempos")
    .select(
      "id, organization_id, ticket_id, atendio, consume, motivo_no_consume, descripcion_cliente, nota_interna, fecha_atencion, autorizado_por, autorizado_en, corrige_a",
    )
    .eq("id", correccion.id)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  if (!original) {
    return { ok: false, estado: 404, mensaje: "Registro no encontrado." };
  }
  if (original.corrige_a != null) {
    return {
      ok: false,
      estado: 400,
      mensaje: "Una corrección no se corrige: registra el tiempo de nuevo.",
    };
  }

  const filas: Record<string, unknown>[] = [
    {
      organization_id: organizacionId,
      ticket_id: original.ticket_id,
      atendio,
      // La base los pone del original; van solo para cumplir los NOT NULL.
      minutos: 0,
      descripcion_cliente: null,
      corrige_a: original.id,
      motivo_correccion: correccion.motivo,
    },
  ];
  if (correccion.minutosCorrectos) {
    filas.push({
      organization_id: organizacionId,
      ticket_id: original.ticket_id,
      atendio: original.atendio,
      minutos: correccion.minutosCorrectos,
      consume: original.consume,
      motivo_no_consume: original.motivo_no_consume,
      descripcion_cliente: original.descripcion_cliente,
      nota_interna: original.nota_interna,
      fecha_atencion: original.fecha_atencion,
      autorizado_por: original.autorizado_por,
      autorizado_en: original.autorizado_en,
    });
  }

  const { data, error } = await db
    .from("soporte_tiempos")
    .insert(filas)
    .select("id");
  if (error) {
    const yaCorregido = /soporte_tiempos_corrige_a_uk/.test(error.message);
    return {
      ok: false,
      estado: yaCorregido ? 409 : 400,
      mensaje: yaCorregido
        ? "Ese registro ya se corrigió."
        : mensajeDeLaBase(error.message),
    };
  }
  return { ok: true, ids: (data ?? []).map((fila) => fila.id as number) };
}

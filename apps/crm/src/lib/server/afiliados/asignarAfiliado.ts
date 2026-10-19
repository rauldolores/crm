import { getServiceClient } from "../supabase-service";

/**
 * Llamada a crm.asignar_afiliado, la única puerta para cambiar a qué
 * afiliado pertenece un cliente (ver la migración
 * 20261019032939_afiliados_fase_1.sql). La función recibe la organización
 * como parámetro y corre con la clave de servicio, así que quien llama aquí
 * ya debe haber validado la sesión: la organización sale del token, nunca
 * del cuerpo de la petición.
 */

export type OrigenDeAtribucion = "enlace" | "manual" | "importacion";

/** Lo que devuelve la función: qué pasó con la atribución. */
export type ResultadoDeAsignacion =
  | "asignada"
  | "reasignada"
  | "retirada"
  | "rechazada"
  | "sin_cambios";

export interface AsignacionDeAfiliado {
  organizacionId: string;
  empresaId: number;
  /** null para quitarle el afiliado (sólo manual, con motivo). */
  afiliadoId: number | null;
  origen: OrigenDeAtribucion;
  /** Ficha de `sales` de quien lo hace; null si es una integración. */
  actorId?: number | null;
  motivo?: string | null;
  /** Solución del ecosistema que capturó el enlace (kontrolia, facturacion…). */
  aplicacion?: string | null;
}

export type RespuestaDeAsignacion =
  | { ok: true; resultado: ResultadoDeAsignacion }
  | { ok: false; estado: number; mensaje: string };

/**
 * Traduce los errores de la función a respuestas HTTP. Los códigos los fija
 * la propia función: P0002 = no existe (o es de otra organización), 22023 =
 * petición inválida (falta el motivo, origen desconocido).
 */
export async function asignarAfiliado(
  datos: AsignacionDeAfiliado,
): Promise<RespuestaDeAsignacion> {
  const { data, error } = await getServiceClient().rpc("asignar_afiliado", {
    p_organizacion: datos.organizacionId,
    p_empresa: datos.empresaId,
    p_afiliado: datos.afiliadoId,
    p_origen: datos.origen,
    p_actor: datos.actorId ?? null,
    p_motivo: datos.motivo ?? null,
    p_aplicacion: datos.aplicacion ?? null,
  });

  if (error) {
    if (error.code === "P0002") {
      return { ok: false, estado: 404, mensaje: error.message };
    }
    if (error.code === "22023") {
      return { ok: false, estado: 400, mensaje: error.message };
    }
    console.error("[afiliados] asignar_afiliado falló:", error.message);
    return {
      ok: false,
      estado: 500,
      mensaje: "No se pudo guardar el afiliado del cliente.",
    };
  }

  return { ok: true, resultado: data as ResultadoDeAsignacion };
}

/** Normaliza un identificador numérico que llega en el cuerpo de la petición. */
export const idONulo = (valor: unknown): number | null | undefined => {
  if (valor === null) return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : undefined;
};

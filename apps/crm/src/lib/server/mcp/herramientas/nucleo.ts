import type { Pool } from "pg";
import { decodeJwt } from "jose";

export {
  acotarLimite,
  construirSet,
  LIMITE_MAXIMO,
  LIMITE_POR_DEFECTO,
  validarVencimiento,
} from "./consultas";

/**
 * Base común de las herramientas acotadas del MCP.
 *
 * Por qué existen estas herramientas además de `query`/`mutate`: con las
 * genéricas, el agente tiene que pedir primero el esquema completo —30 tablas
 * y 304 columnas, unos 4.000 tokens— y solo después puede consultar. Son dos
 * viajes y mucho contexto para responder «¿qué contactos tengo?». Cada
 * herramienta de aquí resuelve una tarea concreta en un solo viaje y sin
 * esquema. Las genéricas se quedan para lo que no esté cubierto.
 *
 * Aislamiento: la conexión se abre como `authenticated` con los claims del
 * usuario, así que **RLS decide qué filas se ven**, igual que en `query`. Una
 * herramienta no puede saltárselo aunque escriba mal su consulta, porque no
 * es el código el que filtra por organización: es la base.
 *
 * Todas las consultas van parametrizadas ($1, $2…). Los valores nunca se
 * interpolan en el texto del SQL: además de cerrar la puerta a la inyección,
 * evita tener que validar SQL que aquí escribimos nosotros, no el modelo.
 */

export interface ContextoDeHerramienta {
  pool: Pool | null;
  /** JWT del usuario: de él salen los claims que evalúa RLS. */
  token: string;
  /** Para el registro de auditoría. */
  userId: string;
}

export type Resultado =
  | { content: { type: "text"; text: string }[]; isError?: boolean }
  | { content: { type: "text"; text: string }[]; isError: true };

/**
 * Ejecuta SQL con la identidad del usuario, dentro de una transacción.
 *
 * Es el mismo procedimiento que usa `query`: rol `authenticated` y claims del
 * JWT, para que RLS acote las filas a la organización activa.
 */
export async function ejecutar<T = Record<string, unknown>>(
  ctx: ContextoDeHerramienta,
  sql: string,
  parametros: unknown[] = [],
): Promise<{ ok: true; filas: T[] } | { ok: false; error: string }> {
  if (!ctx.pool) {
    return { ok: false, error: "Falta configurar SUPABASE_DB_URL." };
  }

  const client = await ctx.pool.connect();
  try {
    const claims = JSON.stringify(decodeJwt(ctx.token));

    await client.query("BEGIN");
    await client.query("SET LOCAL search_path TO crm, public");
    await client.query("SELECT set_config('role', 'authenticated', true)");
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [
      claims,
    ]);

    const resultado = await client.query(sql, parametros);
    await client.query("COMMIT");
    return { ok: true, filas: resultado.rows as T[] };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Da igual: la conexión se descarta igualmente.
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    client.release();
  }
}

/** Respuesta de texto plano para el agente. */
export const texto = (mensaje: string): Resultado => ({
  content: [{ type: "text" as const, text: mensaje }],
});

export const error = (mensaje: string): Resultado => ({
  content: [{ type: "text" as const, text: `Error: ${mensaje}` }],
  isError: true,
});

/**
 * Devuelve filas como JSON. Sin sangrado: el agente lo lee igual y con 25
 * filas la diferencia son cientos de tokens por respuesta.
 */
export const filas = (datos: unknown[]): Resultado =>
  texto(
    datos.length === 0
      ? "Sin resultados."
      : JSON.stringify(datos),
  );

/**
 * Organización activa del token, para los límites del plan: el contador de
 * KontrolIA Auth se lleva por organización, no por usuario.
 */
export const organizacionDelContexto = (
  ctx: ContextoDeHerramienta,
): string | null => {
  try {
    const claims = decodeJwt(ctx.token) as { organization_id?: string };
    return claims.organization_id ?? null;
  } catch {
    return null;
  }
};

/** Ejecuta y devuelve las filas, o el error, en el formato del MCP. */
export async function responder<T = Record<string, unknown>>(
  ctx: ContextoDeHerramienta,
  sql: string,
  parametros: unknown[] = [],
): Promise<Resultado> {
  const resultado = await ejecutar<T>(ctx, sql, parametros);
  return resultado.ok ? filas(resultado.filas) : error(resultado.error);
}

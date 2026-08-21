import { requirePermission } from "@kontrolia/auth/server";

import { kontroliaAuthConfig } from "@/lib/kontrolia-auth/config";
import { getServiceClient } from "./supabase-service";

/**
 * Autenticación, permiso y tenencia para las rutas /api del CRM.
 *
 * Réplica del patrón de Faqturia (`requireFaqturiaPermission`): el servidor
 * valida el token contra el proyecto de KontrolIA Auth —nunca contra la base
 * propia— y saca de sus claims la organización activa, los roles y los
 * permisos.
 *
 * La comprobación de tenencia es la parte que no se puede omitir. Como el
 * servidor consulta con la clave de servicio, que salta el RLS, saber que
 * "hay sesión válida" no basta: hay que comprobar además que el recurso
 * solicitado pertenece a la organización de quien pregunta. Sin eso,
 * cambiar un identificador en la URL devolvería datos de otra empresa.
 *
 * Uso en una ruta:
 *
 *   const auth = await requireKontroliaPermission(request, "crm.contactos.ver", {
 *     tabla: "contacts",
 *     id: params.id,
 *   });
 *   if (!auth.ok) return auth.response;
 *   // ... usando auth.organizacionId
 */

export interface ComprobacionDeTenencia {
  /** Tabla del CRM donde vive el recurso (por ejemplo `contacts`). */
  tabla: string;
  /** Identificador del recurso solicitado. */
  id: string | number;
  /** Columna que guarda la organización. Por defecto `organization_id`. */
  columnaOrganizacion?: string;
}

export interface SesionDelCrm {
  usuarioId: string;
  organizacionId: string;
  roles: string[];
  permisos: string[];
}

export type ResultadoDeAutorizacion =
  | { ok: true; sesion: SesionDelCrm }
  | { ok: false; response: Response };

const respuestaDeError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

/**
 * Comprueba que cada recurso indicado pertenece a la organización dada.
 * Devuelve null si todo está en orden, o la respuesta de error si no.
 *
 * Se responde 404 y no 403 cuando el recurso no existe, para no revelar la
 * existencia de identificadores de otras organizaciones.
 */
export async function verificarTenencia(
  organizacionId: string,
  tenencia?: ComprobacionDeTenencia | ComprobacionDeTenencia[],
): Promise<Response | null> {
  const comprobaciones = tenencia
    ? Array.isArray(tenencia)
      ? tenencia
      : [tenencia]
    : [];
  if (comprobaciones.length === 0) return null;

  const supabase = getServiceClient();

  for (const comprobacion of comprobaciones) {
    const columna = comprobacion.columnaOrganizacion ?? "organization_id";
    const { data, error } = await supabase
      .from(comprobacion.tabla)
      .select(columna)
      .eq("id", comprobacion.id)
      .maybeSingle();

    if (error || !data) return respuestaDeError(404, "No encontrado.");
    const fila = data as unknown as Record<string, unknown>;
    if (fila[columna] !== organizacionId) {
      return respuestaDeError(403, "Sin acceso a este recurso.");
    }
  }

  return null;
}

export async function requireKontroliaPermission(
  peticion: Request,
  permiso: string | string[],
  tenencia?: ComprobacionDeTenencia | ComprobacionDeTenencia[],
): Promise<ResultadoDeAutorizacion> {
  let claims: Record<string, unknown>;

  try {
    const resultado = await requirePermission(
      peticion,
      { supabaseUrl: kontroliaAuthConfig.supabaseUrl },
      permiso,
    );
    claims = resultado.claims as Record<string, unknown>;
  } catch (e) {
    // requirePermission lanza una Response real (401 o 403) en lugar de un
    // Error, así que se devuelve tal cual cuando lo es.
    if (e instanceof Response) return { ok: false, response: e };
    return {
      ok: false,
      response: respuestaDeError(401, "Sesión no válida."),
    };
  }

  const organizacionId = (claims.organization_id as string | null) ?? null;
  if (!organizacionId) {
    return {
      ok: false,
      response: respuestaDeError(
        403,
        "Tu cuenta no tiene una organización activa con acceso a Vinqulia. Pídele acceso a quien la administre.",
      ),
    };
  }

  const errorDeTenencia = await verificarTenencia(organizacionId, tenencia);
  if (errorDeTenencia) return { ok: false, response: errorDeTenencia };

  return {
    ok: true,
    sesion: {
      usuarioId: String(claims.sub ?? ""),
      organizacionId,
      roles: Array.isArray(claims.roles) ? (claims.roles as string[]) : [],
      permisos: Array.isArray(claims.permissions)
        ? (claims.permissions as string[])
        : [],
    },
  };
}

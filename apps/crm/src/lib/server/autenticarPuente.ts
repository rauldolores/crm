import { organizacionDeClaveDeApi, PREFIJO_CLAVE_DE_API } from "./apiKeys";
import { requireKontroliaPermission } from "./requireKontroliaPermission";

/**
 * Autenticación compartida por las rutas /api que aceptan tanto sesión de
 * KontrolIA Auth como clave de API (`Authorization: Bearer vnq_...`).
 *
 * Usada por /api/datos (el puente genérico hacia PostgREST) y por cualquier
 * otra ruta que deba dar el mismo acceso a una integración externa que a una
 * sesión normal, como /api/attachments.
 */

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export type Autenticacion =
  | { ok: true; organizacionId: string; viaClaveDeApi: boolean }
  | { ok: false; response: Response };

export async function autenticarPuente(
  peticion: Request,
): Promise<Autenticacion> {
  const encabezado = peticion.headers.get("authorization") ?? "";
  const token = encabezado.startsWith("Bearer ") ? encabezado.slice(7) : "";

  if (token.startsWith(PREFIJO_CLAVE_DE_API)) {
    const organizacionId = await organizacionDeClaveDeApi(token);
    if (!organizacionId) {
      return {
        ok: false,
        response: esError(401, "Clave de API inválida o revocada."),
      };
    }
    return { ok: true, organizacionId, viaClaveDeApi: true };
  }

  // El permiso fino por recurso llegará cuando se declare en cada ruta; aquí
  // se exige sesión con organización activa, que es lo que decide qué datos
  // son visibles.
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return { ok: false, response: auth.response };
  return {
    ok: true,
    organizacionId: auth.sesion.organizacionId,
    viaClaveDeApi: false,
  };
}

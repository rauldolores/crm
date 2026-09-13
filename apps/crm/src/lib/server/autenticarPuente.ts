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
  | {
      ok: true;
      organizacionId: string;
      viaClaveDeApi: boolean;
      /**
       * Quien actúa, cuando hay sesión. Una clave de API no representa a
       * nadie, así que ahí es null y lo que escriba queda sin responsable.
       */
      usuarioId: string | null;
    }
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
    return {
      ok: true,
      organizacionId,
      viaClaveDeApi: true,
      usuarioId: null,
    };
  }

  // El permiso fino por recurso queda por declarar en cada ruta; lo que
  // requireKontroliaPermission ya exige sin excepción, pase lo que pase
  // aquí, es que el token traiga algún permiso de esta aplicación — ver el
  // comentario ahí sobre por qué una sesión válida en KontrolIA Auth no
  // basta por sí sola.
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return { ok: false, response: auth.response };
  return {
    ok: true,
    organizacionId: auth.sesion.organizacionId,
    viaClaveDeApi: false,
    usuarioId: auth.sesion.usuarioId,
  };
}

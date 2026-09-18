import { esAdministradorDeOrganizacion } from "../apiKeys";
import {
  requireKontroliaPermission,
  type SesionDelCrm,
} from "../requireKontroliaPermission";
import { ErrorDeConector } from "./tipos";

/**
 * Lo común a las rutas /api/conectores: sesión válida y, para configurar,
 * ser administrador. Un error de conector se convierte en la respuesta
 * con su mensaje para la persona; cualquier otro, en un 500 sin detalle.
 */

export const responderError = (error: unknown): Response => {
  if (error instanceof ErrorDeConector) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  console.error("[conectores]", error);
  return Response.json(
    { message: "Ocurrió un error inesperado con el conector." },
    { status: 500 },
  );
};

export const sesionDeConectores = async (
  peticion: Request,
  opciones: { admin: boolean },
): Promise<
  { ok: true; sesion: SesionDelCrm } | { ok: false; response: Response }
> => {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth;
  if (
    opciones.admin &&
    !(await esAdministradorDeOrganizacion(
      auth.sesion.organizacionId,
      auth.sesion.usuarioId,
    ))
  ) {
    return {
      ok: false,
      response: Response.json(
        { message: "Solo un administrador puede configurar los conectores." },
        { status: 403 },
      ),
    };
  }
  return auth;
};

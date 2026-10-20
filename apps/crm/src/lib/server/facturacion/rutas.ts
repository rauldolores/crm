import { esAdministradorDeOrganizacion } from "../apiKeys";
import { responderError as responderErrorDeConector } from "../conectores/rutas";
import {
  requireKontroliaPermission,
  type SesionDelCrm,
} from "../requireKontroliaPermission";

/**
 * Lo común a las rutas /api/facturacion que usa la pantalla: sesión válida
 * y, para lo que mueve dinero (aprobar, timbrar, encender la facturación de
 * un contrato, cambiar ajustes), ser administrador de la organización.
 */

export const responderError = responderErrorDeConector;

export const sesionDeFacturacion = async (
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
        {
          message:
            "Solo un administrador puede aprobar, timbrar o cambiar la facturación.",
        },
        { status: 403 },
      ),
    };
  }
  return auth;
};

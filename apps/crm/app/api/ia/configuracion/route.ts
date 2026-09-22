import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import {
  configuracionDeIaVisible,
  cuentaDeIaDelEntorno,
} from "@/lib/server/ia/configuracion";
import { esProveedorDeIa } from "@/lib/server/ia/proveedores";

/**
 * Proveedor de IA de la organización.
 *
 * La clave normal es la del despliegue (AI_API_KEY): aquí la organización
 * solo enciende o apaga la función y, si quiere, elige modelo. Una
 * instalación con clave propia puede seguir mandándola, y entonces se
 * guarda y se prefiere.
 *
 * Fuera de /api/datos por lo mismo que el correo saliente: la tabla guarda la
 * clave y ese puente la serviría a cualquiera que la pidiese. GET devuelve
 * metadatos, nunca la clave.
 */

const MAX_MODELO = 100;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function GET(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(
      403,
      "Solo un administrador puede ver la configuración de IA.",
    );
  }

  return Response.json(await configuracionDeIaVisible(organizacionId));
}

export async function PUT(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(403, "Solo un administrador puede configurar la IA.");
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    provider?: string;
    apiKey?: string;
    model?: string;
    active?: boolean;
  } | null;

  const apiKey = (cuerpo?.apiKey ?? "").trim();
  const model = (cuerpo?.model ?? "").trim().slice(0, MAX_MODELO) || null;
  const entorno = cuentaDeIaDelEntorno();

  // El proveedor solo se elige cuando el cliente trae su propia clave; si
  // trabaja con la del despliegue, es la que manda.
  const provider = apiKey
    ? cuerpo?.provider
    : (cuerpo?.provider ?? entorno?.provider);
  if (!esProveedorDeIa(provider)) {
    return esError(400, "Elige un proveedor de IA válido.");
  }
  if (!apiKey && !entorno) {
    return esError(
      400,
      "Esta instalación no tiene configurada la clave de IA. Escribe la de tu proveedor o pide que se configure en el servidor.",
    );
  }

  const fila: Record<string, unknown> = {
    organization_id: organizacionId,
    provider,
    model,
    active: cuerpo?.active ?? true,
    updated_at: new Date().toISOString(),
  };
  // La clave solo se escribe cuando llega una nueva: la pantalla no la recibe
  // nunca, así que un guardado sin tocarla borraría la que ya estaba.
  if (apiKey) fila.api_key = apiKey;

  const { error } = await getServiceClient()
    .from("ai_settings")
    .upsert(fila, { onConflict: "organization_id" });

  if (error) return esError(500, error.message);

  return Response.json(await configuracionDeIaVisible(organizacionId));
}

export async function DELETE(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(
      403,
      "Solo un administrador puede borrar la configuración de IA.",
    );
  }

  const { error } = await getServiceClient()
    .from("ai_settings")
    .delete()
    .eq("organization_id", organizacionId);

  if (error) return esError(500, error.message);
  return Response.json(await configuracionDeIaVisible(organizacionId));
}

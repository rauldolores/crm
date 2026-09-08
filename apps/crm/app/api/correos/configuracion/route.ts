import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import { configuracionVisible } from "@/lib/server/correo/configuracion";
import { esProveedorDeCorreo } from "@/lib/server/correo/proveedores";

/**
 * Servidor de correo saliente de la organización.
 *
 * Fuera de /api/datos a propósito, por dos motivos: la tabla guarda la clave
 * del proveedor en claro —hay que presentarla en cada envío, así que no puede
 * ser un hash— y ese puente serviría la fila entera a cualquiera que la
 * pidiese; y estas operaciones exigen ser administrador, algo que el puente
 * no comprueba. GET devuelve metadatos, nunca la clave.
 */

const MAX_TEXTO = 200;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

const esCorreoValido = (valor: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

export async function GET(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(
      403,
      "Solo un administrador puede ver la configuración de correo.",
    );
  }

  return Response.json(await configuracionVisible(organizacionId));
}

export async function PUT(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(
      403,
      "Solo un administrador puede configurar el correo saliente.",
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    provider?: string;
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
    active?: boolean;
  } | null;

  if (!esProveedorDeCorreo(cuerpo?.provider)) {
    return esError(400, "Elige un proveedor de correo válido.");
  }

  const fromEmail = (cuerpo?.fromEmail ?? "").trim().slice(0, MAX_TEXTO);
  if (!esCorreoValido(fromEmail)) {
    return esError(400, "Escribe una dirección de remitente válida.");
  }

  const fromName = (cuerpo?.fromName ?? "").trim().slice(0, MAX_TEXTO) || null;
  const apiKey = (cuerpo?.apiKey ?? "").trim();

  const supabase = getServiceClient();

  // La clave solo se escribe cuando llega una nueva: la pantalla no la
  // recibe nunca, así que un guardado sin tocarla mandaría el campo vacío y
  // borraría la que ya estaba.
  const fila: Record<string, unknown> = {
    organization_id: organizacionId,
    provider: cuerpo.provider,
    from_email: fromEmail,
    from_name: fromName,
    active: cuerpo?.active ?? true,
    updated_at: new Date().toISOString(),
  };
  if (apiKey) fila.api_key = apiKey;

  if (!apiKey) {
    const { data: existente } = await supabase
      .from("email_settings")
      .select("organization_id")
      .eq("organization_id", organizacionId)
      .maybeSingle();
    if (!existente) {
      return esError(400, "Escribe la clave de API de tu proveedor de correo.");
    }
  }

  const { error } = await supabase
    .from("email_settings")
    .upsert(fila, { onConflict: "organization_id" });

  if (error) return esError(500, error.message);

  return Response.json(await configuracionVisible(organizacionId));
}

export async function DELETE(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(
      403,
      "Solo un administrador puede borrar la configuración de correo.",
    );
  }

  const { error } = await getServiceClient()
    .from("email_settings")
    .delete()
    .eq("organization_id", organizacionId);

  if (error) return esError(500, error.message);
  return Response.json(await configuracionVisible(organizacionId));
}

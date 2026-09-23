import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import {
  configuracionDeIaVisible,
  cuentaIncluida,
} from "@/lib/server/ia/configuracion";
import { esProveedorDeIa } from "@/lib/server/ia/proveedores";

/**
 * Proveedor de IA de la organización.
 *
 * Por defecto trabaja con la IA incluida (nuestra llave, modelo fijo): aquí
 * solo se enciende o se apaga. Quien quiera otro proveedor u otro modelo
 * manda su propia clave y entonces sí elige las dos cosas; mandar
 * `usarIncluida: true` vuelve a la nuestra y borra la suya.
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
    /** Volver a la IA incluida y olvidar la clave propia. */
    usarIncluida?: boolean;
  } | null;

  const apiKey = (cuerpo?.apiKey ?? "").trim();
  const model = (cuerpo?.model ?? "").trim().slice(0, MAX_MODELO) || null;
  const incluida = cuentaIncluida();
  const supabase = getServiceClient();

  const { data: actual } = await supabase
    .from("ai_settings")
    .select("provider, api_key")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const teniaClave = Boolean(actual?.api_key);

  const volverALaIncluida = cuerpo?.usarIncluida === true;
  if (volverALaIncluida && !incluida) {
    return esError(
      400,
      "Esta instalación no tiene IA incluida: configura la clave de tu proveedor.",
    );
  }

  // Con clave propia (la nueva o la que ya estaba) se elige proveedor; con la
  // incluida, el proveedor es el nuestro y el modelo también.
  const conClavePropia = !volverALaIncluida && (Boolean(apiKey) || teniaClave);
  const provider = conClavePropia
    ? cuerpo?.provider
    : (incluida?.provider ?? cuerpo?.provider);
  if (!esProveedorDeIa(provider)) {
    return esError(400, "Elige un proveedor de IA válido.");
  }
  if (!conClavePropia && !incluida) {
    return esError(
      400,
      "Esta instalación no tiene configurada la clave de IA. Escribe la de tu proveedor o pide que se configure en el servidor.",
    );
  }
  // Cambiar de proveedor exige la clave de ESE proveedor: la anterior no
  // sirve para hablar con otro, y guardarla dejaría la IA muda sin decirlo.
  if (conClavePropia && !apiKey && provider !== actual?.provider) {
    return esError(
      400,
      "Para cambiar de proveedor hace falta la clave de ese proveedor.",
    );
  }

  const fila: Record<string, unknown> = {
    organization_id: organizacionId,
    provider,
    // El modelo solo es del cliente cuando paga su cuenta; con la incluida
    // manda el nuestro y no se guarda nada que haga creer lo contrario.
    model: conClavePropia ? model : null,
    active: cuerpo?.active ?? true,
    updated_at: new Date().toISOString(),
  };
  if (volverALaIncluida) {
    fila.api_key = null;
  } else if (apiKey) {
    // La clave solo se escribe cuando llega una nueva: la pantalla no la
    // recibe nunca, así que un guardado sin tocarla borraría la que estaba.
    fila.api_key = apiKey;
  }

  const { error } = await supabase
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

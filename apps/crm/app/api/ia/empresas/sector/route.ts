import type { Opcion } from "@/lib/server/companies/sector";
import { sugerirSector } from "@/lib/server/companies/sector";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Sector propuesto para una empresa a partir de su nombre y su sitio web, de
 * entre los sectores de Ajustes.
 *
 * Lo pide el formulario de la empresa, que todavía no está guardada — de ahí
 * que el nombre y el sitio vengan en el cuerpo y no de la base de datos. La
 * organización siempre sale del token, nunca del cliente.
 */

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  const cuerpo = (await peticion.json().catch(() => null)) as {
    name?: string;
    website?: string;
  } | null;
  const nombre = (cuerpo?.name ?? "").trim();
  if (!nombre) return esError(400, "Escribe el nombre de la empresa primero.");

  const { data: configuracion } = await getServiceClient()
    .from("configuration")
    .select("config")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const config = (configuracion?.config ?? {}) as {
    companySectors?: Opcion[];
  };
  const sectores = Array.isArray(config.companySectors)
    ? config.companySectors
    : [];

  return Response.json(
    await sugerirSector(
      organizacionId,
      { nombre, sitio: cuerpo?.website ?? "" },
      sectores,
    ),
  );
}

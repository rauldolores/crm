import { getServiceClient } from "../supabase-service";

/**
 * Resuelve los valores reales de los campos de fusión de una plantilla para
 * un contacto concreto: su ficha, la empresa a la que pertenece y, si se
 * indica, la oportunidad de la que salió el envío.
 *
 * Las claves que devuelve son exactamente las de `camposDeFusion` (el
 * catálogo que ve el editor). Si divergieran, el editor ofrecería campos que
 * al destinatario le llegan vacíos.
 */

interface ValoresYDestino {
  valores: Record<string, string | number | null | undefined>;
  /** Primer correo del contacto, o null si no tiene ninguno registrado. */
  correoDelContacto: string | null;
}

type FilaConCampos = {
  custom_fields?: Record<string, unknown> | null;
} & Record<string, unknown>;

/** Añade los campos personalizados de una fila con su prefijo de entidad. */
const volcarPersonalizados = (
  destino: Record<string, string | number | null | undefined>,
  prefijo: string,
  fila: FilaConCampos | null,
) => {
  for (const [clave, valor] of Object.entries(fila?.custom_fields ?? {})) {
    destino[`${prefijo}.campo.${clave}`] =
      valor === null || valor === undefined
        ? null
        : (String(valor) as string);
  }
};

export async function valoresDeFusion(
  organizacionId: string,
  contactoId: number,
  oportunidadId?: number | null,
): Promise<ValoresYDestino | null> {
  const supabase = getServiceClient();

  const { data: contacto } = await supabase
    .from("contacts")
    .select(
      "id, organization_id, first_name, last_name, title, email_jsonb, phone_jsonb, company_id, custom_fields",
    )
    .eq("id", contactoId)
    .maybeSingle();

  // La organización se comprueba aquí y no se confía en el llamante: esta
  // función se usa desde rutas que ya la conocen, pero un id de otra empresa
  // no debe poder acabar en un correo.
  if (!contacto || contacto.organization_id !== organizacionId) return null;

  const correos = (contacto.email_jsonb ?? []) as { email?: string }[];
  const telefonos = (contacto.phone_jsonb ?? []) as { number?: string }[];
  const correoDelContacto = correos[0]?.email ?? null;

  const nombre = (contacto.first_name as string | null) ?? "";
  const apellidos = (contacto.last_name as string | null) ?? "";

  const valores: Record<string, string | number | null | undefined> = {
    "contacto.nombre": nombre,
    "contacto.apellidos": apellidos,
    "contacto.nombre_completo": `${nombre} ${apellidos}`.trim(),
    "contacto.correo": correoDelContacto,
    "contacto.telefono": telefonos[0]?.number ?? null,
    "contacto.puesto": (contacto.title as string | null) ?? null,
  };
  volcarPersonalizados(valores, "contacto", contacto as FilaConCampos);

  if (contacto.company_id) {
    const { data: empresa } = await supabase
      .from("companies")
      .select("name, website, phone_number, city, custom_fields")
      .eq("id", contacto.company_id)
      .eq("organization_id", organizacionId)
      .maybeSingle();

    if (empresa) {
      valores["empresa.nombre"] = (empresa.name as string | null) ?? null;
      valores["empresa.sitio_web"] = (empresa.website as string | null) ?? null;
      valores["empresa.telefono"] =
        (empresa.phone_number as string | null) ?? null;
      valores["empresa.ciudad"] = (empresa.city as string | null) ?? null;
      volcarPersonalizados(valores, "empresa", empresa as FilaConCampos);
    }
  }

  if (oportunidadId) {
    const { data: oportunidad } = await supabase
      .from("deals")
      .select("name, stage, amount, custom_fields")
      .eq("id", oportunidadId)
      .eq("organization_id", organizacionId)
      .maybeSingle();

    if (oportunidad) {
      valores["oportunidad.nombre"] = (oportunidad.name as string) ?? null;
      valores["oportunidad.etapa"] = (oportunidad.stage as string) ?? null;
      valores["oportunidad.importe"] =
        (oportunidad.amount as number | null) ?? null;
      volcarPersonalizados(valores, "oportunidad", oportunidad as FilaConCampos);
    }
  }

  return { valores, correoDelContacto };
}

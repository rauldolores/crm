import { getServiceClient } from "../supabase-service";

/**
 * Resuelve los valores reales de los campos de fusión de una plantilla para
 * un contacto concreto: su ficha, la empresa a la que pertenece y, si se
 * indica, la oportunidad o el contrato de los que salió el envío.
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

/** Fechas y dinero como los leería el destinatario, no como los guarda la base. */
const LOCALE = "es-MX";
const fechaLegible = (valor: string | null): string | null =>
  valor
    ? new Date(`${valor}T00:00:00`).toLocaleDateString(LOCALE, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
const importeLegible = (
  valor: number | null,
  moneda: string | null,
): string | null =>
  valor === null
    ? null
    : valor.toLocaleString(LOCALE, {
        style: "currency",
        currency: moneda ?? "MXN",
      });
const PERIODICIDAD: Record<string, string> = {
  monthly: "mensual",
  quarterly: "trimestral",
  yearly: "anual",
  one_time: "pago único",
};

export async function valoresDeFusion(
  organizacionId: string,
  contactoId: number,
  oportunidadId?: number | null,
  contratoId?: number | null,
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

  if (contratoId) {
    const { data: contrato } = await supabase
      .from("contracts")
      .select("name, billing_period, amount, currency, started_on, renews_on")
      .eq("id", contratoId)
      .eq("organization_id", organizacionId)
      .maybeSingle();

    if (contrato) {
      valores["contrato.nombre"] = (contrato.name as string) ?? null;
      valores["contrato.periodicidad"] =
        PERIODICIDAD[contrato.billing_period as string] ??
        (contrato.billing_period as string | null);
      valores["contrato.importe"] = importeLegible(
        contrato.amount as number | null,
        contrato.currency as string | null,
      );
      valores["contrato.inicio"] = fechaLegible(
        contrato.started_on as string | null,
      );
      valores["contrato.renueva_el"] = fechaLegible(
        contrato.renews_on as string | null,
      );
    }
  }

  return { valores, correoDelContacto };
}

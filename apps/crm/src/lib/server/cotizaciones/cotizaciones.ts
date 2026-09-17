import type {
  Quote,
  QuoteIssuer,
  QuoteItem,
} from "@/components/crm/types";
import { getServiceClient } from "../supabase-service";

/**
 * Lo que hace falta para pintar una cotización, esté quien esté mirando: la
 * cabecera, sus líneas, el emisor (de la configuración de la organización)
 * y, si existen, la empresa y el contacto a los que va dirigida.
 *
 * Se consulta con la clave de servicio porque la página pública no tiene
 * sesión: el token es la única llave, y con él solo se llega a ESTA
 * cotización, nunca a una lista.
 */

export interface CotizacionCompleta {
  cotizacion: Quote;
  lineas: QuoteItem[];
  emisor: QuoteIssuer;
  empresa: { name: string } | null;
  contacto: {
    first_name: string;
    last_name: string | null;
    email: string | null;
  } | null;
}

const COLUMNAS_DE_COTIZACION =
  "id, organization_id, number, deal_id, company_id, contact_id, title, status, currency, valid_until, notes, subtotal, tax_total, total, contract_period, public_token, sent_at, viewed_at, accepted_at, accepted_by_name, accepted_by_email, rejected_at, rejection_reason, sales_id, created_at, updated_at";

/** Una cotización vencida se marca al leerla, no con un cron. */
export const estaVencida = (cotizacion: Quote, hoy = new Date()): boolean =>
  cotizacion.valid_until !== null &&
  !["accepted", "rejected"].includes(cotizacion.status) &&
  new Date(`${cotizacion.valid_until}T23:59:59`) < hoy;

async function completar(cotizacion: Quote): Promise<CotizacionCompleta> {
  const supabase = getServiceClient();
  const organizacionId = cotizacion.organization_id as string;

  const [lineas, configuracion, empresa, contacto] = await Promise.all([
    supabase
      .from("quote_items")
      .select(
        "id, quote_id, position, description, product_ref, quantity, unit_price, discount_pct, tax_rate, amount",
      )
      .eq("quote_id", cotizacion.id)
      .order("position")
      .order("id"),
    supabase
      .from("configuration")
      .select("config")
      .eq("organization_id", organizacionId)
      .maybeSingle(),
    cotizacion.company_id
      ? supabase
          .from("companies")
          .select("name")
          .eq("id", cotizacion.company_id)
          .eq("organization_id", organizacionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    cotizacion.contact_id
      ? supabase
          .from("contacts")
          .select("first_name, last_name, email_jsonb")
          .eq("id", cotizacion.contact_id)
          .eq("organization_id", organizacionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const config = (configuracion.data?.config ?? {}) as {
    quoteIssuer?: QuoteIssuer;
  };
  const datosDeContacto = contacto.data as {
    first_name: string;
    last_name: string | null;
    email_jsonb: { email?: string }[] | null;
  } | null;

  return {
    cotizacion,
    lineas: (lineas.data ?? []) as QuoteItem[],
    emisor: config.quoteIssuer ?? { name: "" },
    empresa: (empresa.data as { name: string } | null) ?? null,
    contacto: datosDeContacto
      ? {
          first_name: datosDeContacto.first_name,
          last_name: datosDeContacto.last_name,
          email: datosDeContacto.email_jsonb?.[0]?.email ?? null,
        }
      : null,
  };
}

/** Por token público. Marca la primera vista si venía como «enviada». */
export async function cotizacionPorToken(
  token: string,
  opciones: { marcarVista?: boolean } = {},
): Promise<CotizacionCompleta | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("quotes")
    .select(COLUMNAS_DE_COTIZACION)
    .eq("public_token", token)
    .maybeSingle();
  if (!data) return null;

  let cotizacion = data as unknown as Quote;

  if (estaVencida(cotizacion) && cotizacion.status !== "expired") {
    const { data: vencida } = await supabase
      .from("quotes")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", cotizacion.id)
      .select(COLUMNAS_DE_COTIZACION)
      .single();
    if (vencida) cotizacion = vencida as unknown as Quote;
  } else if (opciones.marcarVista && cotizacion.status === "sent") {
    const { data: vista } = await supabase
      .from("quotes")
      .update({
        status: "viewed",
        viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", cotizacion.id)
      .select(COLUMNAS_DE_COTIZACION)
      .single();
    if (vista) cotizacion = vista as unknown as Quote;
  }

  return completar(cotizacion);
}

/** Por id, dentro de una organización (rutas con sesión). */
export async function cotizacionPorId(
  organizacionId: string,
  id: number | string,
): Promise<CotizacionCompleta | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("quotes")
    .select(COLUMNAS_DE_COTIZACION)
    .eq("id", id)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  if (!data) return null;
  return completar(data as unknown as Quote);
}

/** El enlace público, a partir del origen de la petición que lo pide. */
export const enlacePublico = (origen: string, token: string): string =>
  `${origen.replace(/\/$/, "")}/cotizacion/${token}`;

/** Dinero como lo lee una persona en México. */
export const importeLegible = (valor: number, moneda: string): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda || "MXN",
  }).format(valor);

export const fechaLegible = (iso: string | null): string =>
  iso
    ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

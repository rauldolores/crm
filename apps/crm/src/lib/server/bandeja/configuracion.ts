import { getServiceClient } from "../supabase-service";

/**
 * Dónde recibe correo una organización (crm.inbox_settings): la dirección
 * de la bandeja, el secreto con que Resend firma sus avisos y, si hace
 * falta, una clave para leer lo recibido. Solo servidor: guarda secretos.
 */

export interface AjustesDeBandeja {
  inboxEmail: string;
  webhookSecret: string | null;
  apiKey: string | null;
  active: boolean;
}

/** Lo que ve la pantalla de Ajustes: nunca los secretos, solo si están. */
export interface AjustesVisibles {
  inboxEmail: string | null;
  active: boolean;
  tieneSecreto: boolean;
  tieneClavePropia: boolean;
  /** El correo saliente es de Resend: su clave puede servir para leer. */
  salienteEsResend: boolean;
  lastReceivedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

export async function ajustesDeBandeja(
  organizacionId: string,
): Promise<AjustesDeBandeja | null> {
  const { data } = await getServiceClient()
    .from("inbox_settings")
    .select("inbox_email, webhook_secret, api_key, active")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  if (!data) return null;
  return {
    inboxEmail: data.inbox_email as string,
    webhookSecret: (data.webhook_secret as string | null) ?? null,
    apiKey: (data.api_key as string | null) ?? null,
    active: Boolean(data.active),
  };
}

export async function ajustesVisibles(
  organizacionId: string,
): Promise<AjustesVisibles> {
  const db = getServiceClient();
  const [{ data }, { data: saliente }] = await Promise.all([
    db
      .from("inbox_settings")
      .select(
        "inbox_email, webhook_secret, api_key, active, last_received_at, last_error, last_error_at",
      )
      .eq("organization_id", organizacionId)
      .maybeSingle(),
    db
      .from("email_settings")
      .select("provider, active")
      .eq("organization_id", organizacionId)
      .maybeSingle(),
  ]);
  return {
    inboxEmail: (data?.inbox_email as string | undefined) ?? null,
    active: Boolean(data?.active),
    tieneSecreto: Boolean(data?.webhook_secret),
    tieneClavePropia: Boolean(data?.api_key),
    salienteEsResend: saliente?.provider === "resend" && Boolean(saliente.active),
    lastReceivedAt: (data?.last_received_at as string | null) ?? null,
    lastError: (data?.last_error as string | null) ?? null,
    lastErrorAt: (data?.last_error_at as string | null) ?? null,
  };
}

/**
 * Clave con la que se lee el correo recibido en Resend: la propia de la
 * bandeja o, si no hay, la del correo saliente cuando también es de Resend.
 */
export async function claveParaLeer(
  organizacionId: string,
  ajustes: AjustesDeBandeja,
): Promise<string | null> {
  if (ajustes.apiKey) return ajustes.apiKey;
  const { data } = await getServiceClient()
    .from("email_settings")
    .select("provider, api_key")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  return data?.provider === "resend" ? (data.api_key as string) : null;
}

/** Deja constancia del último aviso, bueno o malo, para la pantalla. */
export async function anotarRecepcion(
  organizacionId: string,
  error: string | null,
): Promise<void> {
  const ahora = new Date().toISOString();
  await getServiceClient()
    .from("inbox_settings")
    .update(
      error
        ? { last_error: error.slice(0, 500), last_error_at: ahora }
        : { last_received_at: ahora, last_error: null, last_error_at: null },
    )
    .eq("organization_id", organizacionId);
}

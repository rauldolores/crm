import { getServiceClient } from "../supabase-service";
import type { CuentaDeEnvio } from "./proveedores";
import { esProveedorDeCorreo } from "./proveedores";

/**
 * Con qué cuenta sale el correo de una organización.
 *
 * Se busca primero su configuración propia (Ajustes → Correo saliente). Si no
 * la tiene, se cae a las variables de entorno de Postmark, que es como
 * funcionaba el CRM antes de que esto fuera configurable: una instalación ya
 * en marcha sigue enviando igual hasta que su administrador configure lo suyo.
 */

const desdeElEntorno = (): CuentaDeEnvio | null => {
  const apiKey = process.env.POSTMARK_SERVER_TOKEN;
  const fromEmail = process.env.POSTMARK_FROM_EMAIL;
  if (!apiKey || !fromEmail) return null;
  return { provider: "postmark", apiKey, fromEmail };
};

export async function cuentaDeEnvioDeOrganizacion(
  organizacionId: string,
): Promise<CuentaDeEnvio | null> {
  const { data } = await getServiceClient()
    .from("email_settings")
    .select("provider, api_key, from_email, from_name, active")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  if (!data?.active || !esProveedorDeCorreo(data.provider)) {
    return desdeElEntorno();
  }

  return {
    provider: data.provider,
    apiKey: data.api_key as string,
    fromEmail: data.from_email as string,
    fromName: (data.from_name as string | null) ?? undefined,
  };
}

/**
 * Metadatos de la configuración, para la pantalla de Ajustes. NUNCA incluye
 * la clave: solo si hay una guardada, para poder decir «configurado» sin
 * enseñarla ni devolverla al navegador.
 */
export interface ConfiguracionVisible {
  provider: string | null;
  fromEmail: string | null;
  fromName: string | null;
  active: boolean;
  /** Hay una clave guardada para este proveedor. */
  tieneClave: boolean;
  /** Está enviando por las variables de entorno, sin configuración propia. */
  heredadaDelEntorno: boolean;
}

export async function configuracionVisible(
  organizacionId: string,
): Promise<ConfiguracionVisible> {
  const { data } = await getServiceClient()
    .from("email_settings")
    .select("provider, from_email, from_name, active, api_key")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  if (!data) {
    const entorno = desdeElEntorno();
    return {
      provider: entorno?.provider ?? null,
      fromEmail: entorno?.fromEmail ?? null,
      fromName: null,
      active: Boolean(entorno),
      tieneClave: Boolean(entorno),
      heredadaDelEntorno: Boolean(entorno),
    };
  }

  return {
    provider: data.provider as string,
    fromEmail: data.from_email as string,
    fromName: (data.from_name as string | null) ?? null,
    active: Boolean(data.active),
    tieneClave: Boolean(data.api_key),
    heredadaDelEntorno: false,
  };
}

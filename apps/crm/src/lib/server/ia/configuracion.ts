import { getServiceClient } from "../supabase-service";
import type { CuentaDeIa, ProveedorDeIa } from "./proveedores";
import { esProveedorDeIa, MODELO_POR_DEFECTO } from "./proveedores";

/**
 * Con qué cuenta de IA trabaja una organización.
 *
 * La clave es del DESPLIEGUE (`AI_API_KEY`), no de cada cliente: pedirle a
 * una pyme que abra cuenta en Anthropic o en OpenAI y pegue una clave para
 * poder redactar un correo era pedirle demasiado. Quien instala el CRM la
 * pone una vez y todas sus organizaciones la usan; en la pantalla solo se
 * enciende o se apaga.
 *
 * `crm.ai_settings.api_key` se conserva para las instalaciones que ya la
 * habían configurado a mano y no tienen la variable de entorno —una
 * instalación en servidores del cliente, por ejemplo—, pero deja de pedirse.
 * Si el despliegue tiene clave, es la que manda.
 */

const proveedorDelEntorno = (): ProveedorDeIa | null => {
  const valor = process.env.AI_PROVIDER ?? "claude";
  return esProveedorDeIa(valor) ? valor : null;
};

/** La cuenta del despliegue, si la instalación la configuró. */
export const cuentaDeIaDelEntorno = (): CuentaDeIa | null => {
  const apiKey = process.env.AI_API_KEY;
  const provider = proveedorDelEntorno();
  if (!apiKey || !provider) return null;
  return { provider, apiKey, model: process.env.AI_MODEL || null };
};

export async function cuentaDeIaDeOrganizacion(
  organizacionId: string,
): Promise<CuentaDeIa | null> {
  const entorno = cuentaDeIaDelEntorno();
  const { data } = await getServiceClient()
    .from("ai_settings")
    .select("provider, api_key, model, active")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  // Sin fila, vale lo del despliegue: es lo que encuentra una organización
  // nueva sin configurar nada.
  if (!data) return entorno;

  // Con fila, el interruptor manda: apagada es apagada.
  if (!data.active) return null;

  if (entorno) {
    // El modelo sí lo elige la organización, mientras hable del mismo
    // proveedor que la clave del despliegue.
    const model =
      data.provider === entorno.provider
        ? ((data.model as string | null) ?? entorno.model ?? null)
        : (entorno.model ?? null);
    return { ...entorno, model };
  }

  // Instalación sin variable de entorno: su propia clave, como antes.
  const propia = data.api_key as string | null;
  if (!propia || !esProveedorDeIa(data.provider)) return null;
  return {
    provider: data.provider,
    apiKey: propia,
    model: (data.model as string | null) ?? null,
  };
}

/** Metadatos para la pantalla. NUNCA incluye la clave. */
export interface ConfiguracionDeIaVisible {
  provider: string | null;
  model: string | null;
  modeloPorDefecto: string | null;
  active: boolean;
  tieneClave: boolean;
  /** La IA funciona con la clave del despliegue: aquí no se pide ninguna. */
  incluida: boolean;
}

export async function configuracionDeIaVisible(
  organizacionId: string,
): Promise<ConfiguracionDeIaVisible> {
  const entorno = cuentaDeIaDelEntorno();
  const { data } = await getServiceClient()
    .from("ai_settings")
    .select("provider, model, active, api_key")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  // El proveedor que se va a usar de verdad, que es el que decide qué
  // modelos ofrece la pantalla.
  const provider = entorno?.provider ?? (data?.provider as string) ?? null;
  const tieneClave = Boolean(entorno) || Boolean(data?.api_key);

  return {
    provider,
    model: (data?.model as string | null) ?? entorno?.model ?? null,
    modeloPorDefecto:
      provider && esProveedorDeIa(provider) ? MODELO_POR_DEFECTO[provider] : null,
    active: data ? Boolean(data.active) : Boolean(entorno),
    tieneClave,
    incluida: Boolean(entorno),
  };
}

import { getServiceClient } from "../supabase-service";
import type { CuentaDeIa, ProveedorDeIa } from "./proveedores";
import { esProveedorDeIa, MODELO_POR_DEFECTO } from "./proveedores";

/**
 * Con qué cuenta de IA trabaja una organización.
 *
 * La clave es del DESPLIEGUE, no de cada cliente: pedirle a una pyme que
 * abra una cuenta en Anthropic o en OpenAI y pegue una clave para poder
 * redactar un correo era pedirle demasiado, así que la pone quien instala el
 * CRM (`AI_API_KEY`) y el cliente solo enciende o apaga la función.
 *
 * Una organización que ya tenía la suya la conserva y se sigue prefiriendo:
 * paga su propio consumo, que es lo que eligió. Y el interruptor manda en
 * ambos casos — apagada es apagada, aunque el despliegue tenga clave.
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
  const { data } = await getServiceClient()
    .from("ai_settings")
    .select("provider, api_key, model, active")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  // Sin fila, la IA está disponible si el despliegue tiene clave: es lo que
  // encuentra una organización nueva, sin tener que configurar nada.
  if (!data) return cuentaDeIaDelEntorno();

  // Con fila, el interruptor decide primero.
  if (!data.active) return null;

  const claveDelCliente = data.api_key as string | null;
  if (claveDelCliente && esProveedorDeIa(data.provider)) {
    return {
      provider: data.provider,
      apiKey: claveDelCliente,
      model: (data.model as string | null) ?? null,
    };
  }

  const entorno = cuentaDeIaDelEntorno();
  if (!entorno) return null;
  // El modelo sí puede elegirlo la organización, siempre que no haya
  // cambiado de proveedor respecto al del despliegue.
  const model =
    data.provider === entorno.provider
      ? ((data.model as string | null) ?? entorno.model ?? null)
      : (entorno.model ?? null);
  return { ...entorno, model };
}

/** Metadatos para la pantalla. NUNCA incluye la clave. */
export interface ConfiguracionDeIaVisible {
  provider: string | null;
  model: string | null;
  modeloPorDefecto: string | null;
  active: boolean;
  tieneClave: boolean;
  /** La IA funciona con la clave del despliegue, no con una del cliente. */
  incluida: boolean;
  /** Hay una clave propia guardada (instalaciones anteriores). */
  claveDelCliente: boolean;
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

  if (!data) {
    return {
      provider: entorno?.provider ?? null,
      model: entorno?.model ?? null,
      modeloPorDefecto: entorno ? MODELO_POR_DEFECTO[entorno.provider] : null,
      active: Boolean(entorno),
      tieneClave: Boolean(entorno),
      incluida: Boolean(entorno),
      claveDelCliente: false,
    };
  }

  const claveDelCliente = Boolean(data.api_key);
  const provider = (data.provider as string) || (entorno?.provider ?? "");
  return {
    provider,
    model: (data.model as string | null) ?? null,
    modeloPorDefecto: esProveedorDeIa(provider)
      ? MODELO_POR_DEFECTO[provider]
      : null,
    active: Boolean(data.active),
    tieneClave: claveDelCliente || Boolean(entorno),
    incluida: !claveDelCliente && Boolean(entorno),
    claveDelCliente,
  };
}

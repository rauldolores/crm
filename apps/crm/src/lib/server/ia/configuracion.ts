import { getServiceClient } from "../supabase-service";
import type { CuentaDeIa } from "./proveedores";
import { esProveedorDeIa, MODELO_POR_DEFECTO } from "./proveedores";

/**
 * Con qué proveedor de IA trabaja una organización.
 *
 * No hay respaldo por variables de entorno, a diferencia del correo: aquí
 * cada cliente pone su propia clave y paga su propio consumo. Sin
 * configuración, la generación con IA simplemente no está disponible y la
 * pantalla lo dice.
 */

export async function cuentaDeIaDeOrganizacion(
  organizacionId: string,
): Promise<CuentaDeIa | null> {
  const { data } = await getServiceClient()
    .from("ai_settings")
    .select("provider, api_key, model, active")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  if (!data?.active || !esProveedorDeIa(data.provider)) return null;

  return {
    provider: data.provider,
    apiKey: data.api_key as string,
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
}

export async function configuracionDeIaVisible(
  organizacionId: string,
): Promise<ConfiguracionDeIaVisible> {
  const { data } = await getServiceClient()
    .from("ai_settings")
    .select("provider, model, active, api_key")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  if (!data) {
    return {
      provider: null,
      model: null,
      modeloPorDefecto: null,
      active: false,
      tieneClave: false,
    };
  }

  const provider = data.provider as string;
  return {
    provider,
    model: (data.model as string | null) ?? null,
    modeloPorDefecto: esProveedorDeIa(provider)
      ? MODELO_POR_DEFECTO[provider]
      : null,
    active: Boolean(data.active),
    tieneClave: Boolean(data.api_key),
  };
}

import { getServiceClient } from "../supabase-service";
import type { CuentaDeIa, ProveedorDeIa } from "./proveedores";
import { esProveedorDeIa, MODELO_POR_DEFECTO } from "./proveedores";

/**
 * Con qué cuenta de IA trabaja una organización.
 *
 * Hay dos caminos, y el primero es el normal:
 *
 * 1. **La IA incluida** — nuestra llave (`OPENAI_API_KEY`), con el modelo
 *    mini más barato de OpenAI y SIN posibilidad de cambiarlo. Pedirle a una
 *    pyme que abra cuenta en OpenAI y pegue una clave para poder redactar un
 *    correo era pedirle demasiado; y como la consumen todas las
 *    organizaciones, el modelo lo fijamos nosotros: es lo que hace que salga
 *    a cuenta regalarla.
 * 2. **Su propia cuenta** — la organización elige proveedor, pega su clave y
 *    entonces sí elige el modelo que quiera, incluido uno caro: lo paga
 *    ella. Es también el camino de una instalación en servidores del cliente.
 *
 * `AI_API_KEY` + `AI_PROVIDER` + `AI_MODEL` siguen valiendo como «la cuenta
 * de este despliegue» para quien ya los tenía configurados: entonces esa es
 * la cuenta incluida, con el modelo que diga el despliegue.
 */

/** El modelo de la IA incluida: el mini más barato de OpenAI. */
export const MODELO_INCLUIDO = "gpt-4o-mini";

type Entorno = Record<string, string | undefined>;

/**
 * La cuenta que el producto regala. El modelo va FIJO: quien quiera otro
 * trae su propia clave (ver arriba).
 */
export const cuentaIncluida = (
  entorno: Entorno = process.env,
): CuentaDeIa | null => {
  // Despliegue con cuenta propia declarada (instalación del cliente, o una
  // nuestra que prefiera otro proveedor).
  const propiaDelDespliegue = entorno.AI_API_KEY;
  if (propiaDelDespliegue) {
    const provider = entorno.AI_PROVIDER || "claude";
    if (!esProveedorDeIa(provider)) return null;
    return {
      provider,
      apiKey: propiaDelDespliegue,
      model: entorno.AI_MODEL || MODELO_POR_DEFECTO[provider],
    };
  }

  // Lo habitual: nuestra llave de OpenAI con el modelo barato.
  const nuestra = entorno.OPENAI_API_KEY;
  if (!nuestra) return null;
  return {
    provider: "openai",
    apiKey: nuestra,
    model: entorno.AI_INCLUDED_MODEL || MODELO_INCLUIDO,
  };
};

/** Lo que guarda `crm.ai_settings` de una organización. */
export interface FilaDeIa {
  provider: string | null;
  api_key: string | null;
  model: string | null;
  active: boolean | null;
}

/**
 * Qué cuenta se usa de verdad. Pura a propósito: es la regla del producto y
 * se prueba sin base de datos.
 */
export const resolverCuentaDeIa = (
  incluida: CuentaDeIa | null,
  fila: FilaDeIa | null,
): CuentaDeIa | null => {
  // Sin fila vale la incluida: es lo que encuentra una organización nueva
  // sin configurar nada.
  if (!fila) return incluida;

  // Con fila, el interruptor manda: apagada es apagada.
  if (!fila.active) return null;

  // Su propia cuenta: proveedor y modelo a su gusto.
  if (fila.api_key && esProveedorDeIa(fila.provider)) {
    return {
      provider: fila.provider,
      apiKey: fila.api_key,
      model: fila.model || MODELO_POR_DEFECTO[fila.provider],
    };
  }

  // La incluida, con NUESTRO modelo: `fila.model` se ignora a propósito,
  // porque el modelo de la cuenta que pagamos no lo elige el cliente.
  return incluida;
};

export async function cuentaDeIaDeOrganizacion(
  organizacionId: string,
): Promise<CuentaDeIa | null> {
  const { data } = await getServiceClient()
    .from("ai_settings")
    .select("provider, api_key, model, active")
    .eq("organization_id", organizacionId)
    .maybeSingle();

  return resolverCuentaDeIa(cuentaIncluida(), (data as FilaDeIa | null) ?? null);
}

/** Metadatos para la pantalla. NUNCA incluye la clave. */
export interface ConfiguracionDeIaVisible {
  provider: string | null;
  model: string | null;
  modeloPorDefecto: string | null;
  active: boolean;
  tieneClave: boolean;
  /** Hay IA incluida en este despliegue (nuestra llave). */
  hayIncluida: boolean;
  /** La organización está trabajando con su propia clave. */
  clavePropia: boolean;
  /** El modelo de la IA incluida, para decirlo en pantalla. */
  modeloIncluido: string | null;
  /** El proveedor de la IA incluida. */
  proveedorIncluido: string | null;
}

export async function configuracionDeIaVisible(
  organizacionId: string,
): Promise<ConfiguracionDeIaVisible> {
  const incluida = cuentaIncluida();
  const { data } = await getServiceClient()
    .from("ai_settings")
    .select("provider, api_key, model, active")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const fila = (data as FilaDeIa | null) ?? null;

  const clavePropia = Boolean(
    fila?.api_key && esProveedorDeIa(fila.provider),
  );
  // El proveedor que se va a usar de verdad, que es el que decide qué
  // modelos ofrece la pantalla.
  const provider = clavePropia
    ? (fila?.provider as string)
    : (incluida?.provider ?? null);

  return {
    provider,
    model: clavePropia
      ? (fila?.model ?? null)
      : (incluida?.model ?? null),
    modeloPorDefecto:
      provider && esProveedorDeIa(provider)
        ? MODELO_POR_DEFECTO[provider]
        : null,
    active: fila ? Boolean(fila.active) : Boolean(incluida),
    tieneClave: clavePropia || Boolean(incluida),
    hayIncluida: Boolean(incluida),
    clavePropia,
    modeloIncluido: incluida?.model ?? null,
    proveedorIncluido: incluida?.provider ?? null,
  };
}

/** Proveedor de la cuenta incluida, para la pantalla y las rutas. */
export const proveedorIncluido = (): ProveedorDeIa | null =>
  cuentaIncluida()?.provider ?? null;

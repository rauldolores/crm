/**
 * Cliente mínimo de los proveedores de IA soportados, para uso EXCLUSIVO en
 * servidor: aquí se maneja la clave, que nunca debe llegar al navegador.
 *
 * Se llaman con `fetch`, sin SDK: cada uno sería otra dependencia que
 * auditar y mantener, para un POST con un prompt.
 *
 * DeepSeek habla el mismo dialecto que OpenAI (mismo formato de cuerpo y de
 * respuesta), así que comparten armador; solo cambian la dirección y el
 * modelo por defecto.
 */

export const PROVEEDORES_DE_IA = ["claude", "openai", "deepseek"] as const;

export type ProveedorDeIa = (typeof PROVEEDORES_DE_IA)[number];

export const esProveedorDeIa = (valor: unknown): valor is ProveedorDeIa =>
  typeof valor === "string" &&
  (PROVEEDORES_DE_IA as readonly string[]).includes(valor);

export const MODELO_POR_DEFECTO: Record<ProveedorDeIa, string> = {
  claude: "claude-sonnet-5",
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
};

export interface CuentaDeIa {
  provider: ProveedorDeIa;
  apiKey: string;
  /** Vacío = el modelo por defecto del proveedor. */
  model?: string | null;
}

export interface ResultadoDeIa {
  ok: boolean;
  texto?: string;
  mensaje?: string;
}

const MAX_TOKENS = 4000;

const puntoFinal: Record<ProveedorDeIa, string> = {
  claude: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/chat/completions",
};

const cabeceras = (cuenta: CuentaDeIa): Record<string, string> =>
  cuenta.provider === "claude"
    ? {
        "x-api-key": cuenta.apiKey,
        "anthropic-version": "2023-06-01",
      }
    : { Authorization: `Bearer ${cuenta.apiKey}` };

const cuerpo = (
  cuenta: CuentaDeIa,
  instrucciones: string,
  peticion: string,
): unknown => {
  const model = cuenta.model || MODELO_POR_DEFECTO[cuenta.provider];

  if (cuenta.provider === "claude") {
    return {
      model,
      max_tokens: MAX_TOKENS,
      system: instrucciones,
      messages: [{ role: "user", content: peticion }],
    };
  }

  return {
    model,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: instrucciones },
      { role: "user", content: peticion },
    ],
  };
};

/** Cada proveedor devuelve el texto en un sitio distinto. */
const textoDeLaRespuesta = (
  proveedor: ProveedorDeIa,
  datos: unknown,
): string | null => {
  if (proveedor === "claude") {
    const c = datos as { content?: { type?: string; text?: string }[] };
    return c.content?.find((parte) => parte.type === "text")?.text ?? null;
  }
  const c = datos as { choices?: { message?: { content?: string } }[] };
  return c.choices?.[0]?.message?.content ?? null;
};

const mensajeDeError = (estado: number, datos: unknown): string => {
  const c = datos as
    | { error?: { message?: string }; message?: string }
    | null
    | undefined;
  return (
    c?.error?.message ||
    c?.message ||
    `El proveedor de IA respondió ${estado}.`
  );
};

export async function generarConIa(
  cuenta: CuentaDeIa,
  instrucciones: string,
  peticion: string,
): Promise<ResultadoDeIa> {
  const respuesta = await fetch(puntoFinal[cuenta.provider], {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...cabeceras(cuenta),
    },
    body: JSON.stringify(cuerpo(cuenta, instrucciones, peticion)),
    // Generar un correo entero puede tardar; el timeout corto de una llamada
    // normal cortaría respuestas legítimas a medias.
    signal: AbortSignal.timeout(60000),
  }).catch(() => null);

  if (!respuesta) {
    return { ok: false, mensaje: "No se pudo contactar con el proveedor de IA." };
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    return { ok: false, mensaje: mensajeDeError(respuesta.status, datos) };
  }

  const texto = textoDeLaRespuesta(cuenta.provider, datos);
  if (!texto) {
    return { ok: false, mensaje: "El proveedor de IA no devolvió contenido." };
  }

  return { ok: true, texto };
}

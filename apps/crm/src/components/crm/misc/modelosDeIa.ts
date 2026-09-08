/**
 * Modelos que se ofrecen para elegir en Ajustes → Inteligencia artificial.
 *
 * Es una lista de conveniencia, no una restricción: los proveedores sacan
 * modelos nuevos cada pocos meses y una lista cerrada dejaría al cliente sin
 * poder usar el que acaba de salir. Por eso la pantalla ofrece además
 * «Otro», que abre un campo para escribir el identificador a mano, y el
 * servidor no valida contra esta lista.
 *
 * El modelo recomendado de cada proveedor NO se repite aquí: lo devuelve el
 * servidor en la configuración (`modeloPorDefecto`), que es donde está
 * definido de verdad. Duplicarlo sería tener dos sitios que se contradicen.
 */

export interface ModeloDeIa {
  /** Identificador exacto que espera la API del proveedor. */
  value: string;
  label: string;
  /** Para qué conviene, en cristiano. */
  descripcion: string;
}

export const MODELOS_POR_PROVEEDOR: Record<string, ModeloDeIa[]> = {
  claude: [
    {
      value: "claude-sonnet-5",
      label: "Sonnet 5",
      descripcion: "Equilibrado. La opción recomendada para redactar correos.",
    },
    {
      value: "claude-opus-5",
      label: "Opus 5",
      descripcion: "El más capaz, y el más caro por uso.",
    },
    {
      value: "claude-haiku-4-5-20251001",
      label: "Haiku 4.5",
      descripcion: "El más rápido y barato.",
    },
  ],
  openai: [
    {
      value: "gpt-4o-mini",
      label: "GPT-4o mini",
      descripcion: "Rápido y económico. Suficiente para redactar correos.",
    },
    {
      value: "gpt-4o",
      label: "GPT-4o",
      descripcion: "Más capaz, y más caro por uso.",
    },
  ],
  deepseek: [
    {
      value: "deepseek-chat",
      label: "DeepSeek Chat",
      descripcion: "El de propósito general.",
    },
    {
      value: "deepseek-reasoner",
      label: "DeepSeek Reasoner",
      descripcion: "Razona más antes de responder; tarda más.",
    },
  ],
};

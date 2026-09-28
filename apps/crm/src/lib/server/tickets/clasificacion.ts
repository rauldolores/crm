import { cuentaDeIaDeOrganizacion } from "../ia/configuracion";
import type { PreguntaDeJev } from "../ia/clasificador";
import {
  hayClasificador,
  preguntarAlClasificador,
} from "../ia/clasificador";
import { generarConIa } from "../ia/proveedores";

/**
 * Prioridad y categoría sugeridas para un ticket a partir de su asunto y su
 * descripción, siempre con valores de las listas que la organización
 * configuró en Ajustes.
 *
 * Dos caminos, por orden:
 *
 * 1. El modelo de decisión (Jev), si el despliegue tiene clave. Es lo suyo:
 *    devuelve una opción de la lista por construcción — no hay JSON que
 *    parsear ni valores inventados que descartar — y cuesta una fracción de
 *    lo que cuesta preguntárselo a un modelo de lenguaje.
 * 2. El proveedor de texto de la organización, como se hacía antes. Se
 *    queda como respaldo para que un despliegue sin `TYPESAFE_API_KEY` no
 *    pierda la función de un día para otro.
 *
 * Lo que decide una persona manda: esto rellena campos que quedan
 * editables.
 */

export interface Opcion {
  value: string;
  label: string;
}

export interface TextoDelTicket {
  subject: string;
  description: string;
}

export interface SugerenciaDeTicket {
  priority: string | null;
  category: string | null;
  /** De 0 a 1, solo cuando la sugerencia viene del modelo de decisión. */
  confianza: number | null;
  /** Una frase, solo cuando viene del proveedor de texto. */
  motivo: string | null;
}

/**
 * Confianza mínima para escribir la clasificación SIN que una persona la
 * vea: la del formulario público, el agente de voz o la API.
 *
 * Cuando una persona pulsa «Sugerir con IA» no hace falta umbral — ve el
 * valor y lo corrige. Aquí no hay nadie mirando y la prioridad arranca el
 * plazo del SLA, así que una corazonada floja haría algo peor que no
 * clasificar: dejaría el ticket con un plazo equivocado sin que nadie se
 * enterase. Por debajo de esto se deja el campo vacío, que es visible y
 * cualquiera puede llenar.
 */
export const CONFIANZA_MINIMA_AUTOMATICA = 0.7;

export const PRIORIDADES_DE_FABRICA: Opcion[] = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

/** Valor reservado: «ninguna de las categorías encaja». */
const SIN_CATEGORIA = "_ninguna";

/**
 * Cuándo elegir cada prioridad de fábrica. Una organización puede renombrar
 * las suyas o añadir otras desde Ajustes, y entonces lo único que se sabe de
 * ellas es su etiqueta: se usa tal cual, que como criterio es tan válida
 * como cualquier frase.
 */
const CRITERIO_DE_PRIORIDAD: Record<string, string> = {
  urgent: "El cliente no puede operar o está perdiendo dinero ahora mismo",
  high: "Algo importante no funciona, pero tiene una alternativa mientras tanto",
  normal: "Duda o petición habitual, sin prisa especial",
  low: "Mejora o consulta que puede esperar",
};

const criteriosDePrioridad = (opciones: Opcion[]): Record<string, string> =>
  Object.fromEntries(
    opciones.map((o) => [o.value, CRITERIO_DE_PRIORIDAD[o.value] ?? o.label]),
  );

/**
 * De las categorías no hay nada escrito de fábrica — las inventa cada
 * organización —, así que su propia etiqueta es el criterio.
 */
const criteriosDeCategoria = (opciones: Opcion[]): Record<string, string> =>
  Object.fromEntries(opciones.map((o) => [o.value, o.label]));

const enLaLista = (opciones: Opcion[], valor: unknown): string | null =>
  typeof valor === "string" && opciones.some((o) => o.value === valor)
    ? valor
    : null;

const textoDelEstado = ({ subject, description }: TextoDelTicket) => ({
  asunto: subject,
  descripcion: description,
});

/**
 * Camino 1: el modelo de decisión. `null` si no está disponible o falla.
 *
 * Exportado aparte del respaldo porque el formulario público lo quiere solo
 * a él: al otro lado hay un visitante esperando, y un modelo de lenguaje
 * tarda segundos y lo paga el cliente por cada envío, spam incluido.
 */
export async function sugerirConModeloDeDecision(
  texto: TextoDelTicket,
  prioridades: Opcion[],
  categorias: Opcion[],
  /**
   * Confianza mínima por respuesta. Lo que no la alcance vuelve como `null`.
   * Sin umbral (el botón manual) vuelve tal cual: ahí hay una persona.
   */
  umbral?: number,
): Promise<SugerenciaDeTicket | null> {
  if (!hayClasificador()) return null;

  const preguntas: Record<string, PreguntaDeJev> = {
    prioridad: {
      type: "choice",
      instructions: "Con qué urgencia hay que atender este ticket de soporte",
      criteria: criteriosDePrioridad(prioridades),
    },
  };
  if (categorias.length) {
    preguntas.categoria = {
      type: "choice",
      instructions: "De qué trata este ticket de soporte",
      criteria: {
        ...criteriosDeCategoria(categorias),
        [SIN_CATEGORIA]: "Ninguna de las categorías anteriores lo describe",
      },
    };
  }

  const resultado = await preguntarAlClasificador(
    textoDelEstado(texto),
    preguntas,
  );
  if (!resultado.ok || !resultado.respuestas) return null;

  const prioridad = resultado.respuestas.prioridad;
  const categoria = resultado.respuestas.categoria;

  // Una respuesta sin `confidence` con umbral puesto se descarta: no se
  // puede afirmar que pase el corte, y el silencio es el lado seguro.
  const bastante = (respuesta?: { confidence?: number }) =>
    umbral === undefined ||
    (typeof respuesta?.confidence === "number" && respuesta.confidence >= umbral);

  return {
    priority: bastante(prioridad)
      ? enLaLista(prioridades, prioridad?.choice)
      : null,
    category: bastante(categoria)
      ? enLaLista(categorias, categoria?.choice)
      : null,
    confianza:
      typeof prioridad?.confidence === "number" ? prioridad.confidence : null,
    motivo: null,
  };
}

const instrucciones = (prioridades: Opcion[], categorias: Opcion[]) =>
  [
    "Eres el asistente de un equipo de soporte. Clasificas tickets de clientes.",
    "",
    "Prioridades posibles (valor = etiqueta), de menor a mayor urgencia:",
    ...prioridades.map((p) => `${p.value} = ${p.label}`),
    "",
    "Categorías posibles (valor = etiqueta):",
    ...(categorias.length
      ? categorias.map((c) => `${c.value} = ${c.label}`)
      : ["(ninguna: deja la categoría vacía)"]),
    "",
    "Devuelve SOLO un JSON válido con esta forma exacta:",
    '{"priority": "<valor de la lista>", "category": "<valor de la lista o cadena vacía>", "motivo": "<una frase en español de México, con tuteo>"}',
    "",
    "Criterio de prioridad: urgente si el cliente no puede operar o hay pérdida de dinero en curso; alta si algo importante no funciona pero hay alternativa; normal para dudas y peticiones habituales; baja para mejoras y consultas sin prisa. Usa SOLO valores de las listas.",
  ].join("\n");

function extraerJson(
  texto: string,
): { priority: string; category: string; motivo: string } | null {
  const sinCerca = texto
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const inicio = sinCerca.indexOf("{");
  const fin = sinCerca.lastIndexOf("}");
  if (inicio === -1 || fin <= inicio) return null;
  try {
    const datos = JSON.parse(sinCerca.slice(inicio, fin + 1)) as Record<
      string,
      unknown
    >;
    return {
      priority: typeof datos.priority === "string" ? datos.priority : "",
      category: typeof datos.category === "string" ? datos.category : "",
      motivo: typeof datos.motivo === "string" ? datos.motivo : "",
    };
  } catch {
    return null;
  }
}

/** Camino 2: el proveedor de texto de la organización. */
async function conProveedorDeTexto(
  organizacionId: string,
  texto: TextoDelTicket,
  prioridades: Opcion[],
  categorias: Opcion[],
): Promise<SugerenciaDeTicket | null> {
  const cuenta = await cuentaDeIaDeOrganizacion(organizacionId);
  if (!cuenta) return null;

  const resultado = await generarConIa(
    cuenta,
    instrucciones(prioridades, categorias),
    `Asunto: ${texto.subject}\n\nDescripción:\n${texto.description}`,
  );
  if (!resultado.ok || !resultado.texto) return null;

  const sugerencia = extraerJson(resultado.texto);
  if (!sugerencia) return null;

  // Un valor inventado no existiría en Ajustes, así que se descarta.
  return {
    priority: enLaLista(prioridades, sugerencia.priority),
    category: enLaLista(categorias, sugerencia.category),
    confianza: null,
    motivo: sugerencia.motivo || null,
  };
}

export async function clasificarTicket(
  organizacionId: string,
  texto: TextoDelTicket,
  prioridades: Opcion[],
  categorias: Opcion[],
): Promise<SugerenciaDeTicket | null> {
  return (
    (await sugerirConModeloDeDecision(texto, prioridades, categorias)) ??
    (await conProveedorDeTexto(organizacionId, texto, prioridades, categorias))
  );
}

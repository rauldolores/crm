/**
 * Modelo del contenido del centro de ayuda.
 *
 * La documentación se escribe como datos (no como JSX) para que sea fácil
 * de leer, revisar y ampliar sin tocar la maquetación: cada sección es una
 * lista de bloques simples que AyudaPage sabe pintar.
 */

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | { tipo: "pasos"; titulo?: string; pasos: string[] }
  | { tipo: "ejemplo"; titulo: string; texto: string }
  | { tipo: "consejo"; texto: string }
  | { tipo: "tabla"; cabeceras: string[]; filas: string[][] };

export interface Seccion {
  /** Identificador estable: es lo que se usa en la URL (?seccion=…). */
  id: string;
  titulo: string;
  /** Una frase: qué es y para qué sirve. Se muestra bajo el título. */
  resumen: string;
  /** Ruta de la pantalla que documenta, si la hay, para abrirla desde la guía. */
  ruta?: string;
  bloques: Bloque[];
}

export interface Grupo {
  id: string;
  titulo: string;
  secciones: Seccion[];
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
  /** Sección relacionada, para enlazar «Leer más». */
  seccion?: string;
}

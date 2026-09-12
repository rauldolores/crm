import { AVANZADO, MODULOS } from "./guias-avanzadas";
import { PANTALLAS, PRIMEROS_PASOS } from "./guias-basicas";
import type { Grupo, Seccion } from "./tipos";

export { PREGUNTAS_FRECUENTES } from "./faq";

/** Todos los grupos de la guía, en el orden en que se leen. */
export const GRUPOS: Grupo[] = [PRIMEROS_PASOS, PANTALLAS, MODULOS, AVANZADO];

export const TODAS_LAS_SECCIONES: Seccion[] = GRUPOS.flatMap(
  (grupo) => grupo.secciones,
);

/**
 * Qué sección abrir desde el botón «?» de la cabecera según la pantalla en
 * la que esté el usuario. Se compara por prefijo de ruta, de la más
 * específica a la más general; lo que no encaja cae en «Primeros pasos».
 */
const SECCION_POR_RUTA: Array<[prefijo: string, seccion: string]> = [
  ["/contacts", "contactos"],
  ["/companies", "empresas"],
  ["/deals", "oportunidades"],
  ["/tasks", "tareas"],
  ["/tickets", "tickets"],
  ["/sales", "usuarios"],
  ["/informes", "informes"],
  ["/email_templates", "plantillas-de-correo"],
  ["/import", "importar-datos"],
  ["/profile", "perfil"],
  ["/customer_summary", "clientes"],
  ["/affiliates", "afiliados"],
  ["/modulos", "catalogo-de-modulos"],
  ["/automatizaciones", "automatizaciones"],
  ["/formularios", "formularios-web"],
  ["/correo", "correo-saliente"],
  ["/inteligencia-artificial", "inteligencia-artificial"],
  ["/integraciones", "api-y-claves"],
  ["/facturacion", "plan-y-facturacion"],
  ["/settings", "ajustes"],
];

export const seccionParaRuta = (pathname: string): string => {
  if (pathname === "/" || pathname === "") return "panel";
  const encontrada = SECCION_POR_RUTA.find(([prefijo]) =>
    pathname.startsWith(prefijo),
  );
  return encontrada ? encontrada[1] : "que-es-un-crm";
};

/** Quita acentos y mayúsculas para que «automatizacion» encuentre «Automatización». */
export const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Todo el texto de una sección en una sola cadena, para buscar. */
export const textoDeSeccion = (seccion: Seccion): string =>
  normalizar(
    [
      seccion.titulo,
      seccion.resumen,
      ...seccion.bloques.map((bloque) => {
        switch (bloque.tipo) {
          case "parrafo":
          case "consejo":
            return bloque.texto;
          case "lista":
            return bloque.items.join(" ");
          case "pasos":
            return [bloque.titulo ?? "", ...bloque.pasos].join(" ");
          case "ejemplo":
            return `${bloque.titulo} ${bloque.texto}`;
          case "tabla":
            return [bloque.cabeceras, ...bloque.filas].flat().join(" ");
        }
      }),
    ].join(" "),
  );

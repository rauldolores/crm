import type { CustomFieldDefinition } from "../types";

/**
 * Campos que una plantilla de correo puede insertar y que se rellenan solos
 * al enviar: `{{contacto.nombre}}`, `{{empresa.nombre}}`…
 *
 * Este módulo es la única fuente: de aquí salen tanto los botones que ofrece
 * el editor como la sustitución que hace el servidor al enviar. Si divergieran,
 * el editor ofrecería campos que luego llegan vacíos al destinatario.
 *
 * Los campos personalizados de la organización se suman a los fijos, porque
 * son justamente los que más se quieren meter en un correo (el enlace de un
 * diagnóstico, un número de póliza…). Ver `camposDeFusion`.
 */

export type EntidadDeFusion = "contacto" | "empresa" | "oportunidad";

export interface CampoDeFusion {
  /** El token tal cual se escribe: "contacto.nombre". */
  clave: string;
  etiqueta: string;
  entidad: EntidadDeFusion;
}

/** Campos fijos, los que existen en toda organización. */
const CAMPOS_FIJOS: CampoDeFusion[] = [
  { clave: "contacto.nombre", etiqueta: "Nombre", entidad: "contacto" },
  { clave: "contacto.apellidos", etiqueta: "Apellidos", entidad: "contacto" },
  {
    clave: "contacto.nombre_completo",
    etiqueta: "Nombre completo",
    entidad: "contacto",
  },
  { clave: "contacto.correo", etiqueta: "Correo", entidad: "contacto" },
  { clave: "contacto.telefono", etiqueta: "Teléfono", entidad: "contacto" },
  { clave: "contacto.puesto", etiqueta: "Puesto", entidad: "contacto" },
  { clave: "empresa.nombre", etiqueta: "Nombre", entidad: "empresa" },
  { clave: "empresa.sitio_web", etiqueta: "Sitio web", entidad: "empresa" },
  { clave: "empresa.telefono", etiqueta: "Teléfono", entidad: "empresa" },
  { clave: "empresa.ciudad", etiqueta: "Ciudad", entidad: "empresa" },
  {
    clave: "oportunidad.nombre",
    etiqueta: "Nombre",
    entidad: "oportunidad",
  },
  { clave: "oportunidad.etapa", etiqueta: "Etapa", entidad: "oportunidad" },
  { clave: "oportunidad.importe", etiqueta: "Importe", entidad: "oportunidad" },
];

/** El prefijo del token para los campos personalizados de cada entidad. */
const PREFIJO_PERSONALIZADO: Record<EntidadDeFusion, string> = {
  contacto: "contacto.campo",
  empresa: "empresa.campo",
  oportunidad: "oportunidad.campo",
};

/**
 * Todos los campos disponibles: los fijos más los personalizados que haya
 * definido la organización.
 */
export const camposDeFusion = (personalizados: {
  contacto?: CustomFieldDefinition[];
  empresa?: CustomFieldDefinition[];
  oportunidad?: CustomFieldDefinition[];
}): CampoDeFusion[] => {
  const extra = (
    ["contacto", "empresa", "oportunidad"] as EntidadDeFusion[]
  ).flatMap((entidad) =>
    (personalizados[entidad] ?? []).map((campo) => ({
      clave: `${PREFIJO_PERSONALIZADO[entidad]}.${campo.value}`,
      etiqueta: campo.label,
      entidad,
    })),
  );
  return [...CAMPOS_FIJOS, ...extra];
};

/** El token tal como se escribe dentro de una plantilla. */
export const tokenDeCampo = (clave: string): string => `{{${clave}}}`;

/**
 * Sustituye los tokens de una plantilla por sus valores.
 *
 * Un token sin valor se sustituye por cadena vacía, no se deja escrito: al
 * destinatario le llegaría un «Hola {{contacto.nombre}}», que es peor que un
 * saludo escueto. Un token que no existe en el catálogo se deja intacto, para
 * que se note al revisar la plantilla en vez de desaparecer en silencio.
 */
export const rellenarCampos = (
  texto: string,
  valores: Record<string, string | number | null | undefined>,
): string =>
  texto.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (original, clave) => {
    if (!(clave in valores)) return original;
    const valor = valores[clave as string];
    return valor === null || valor === undefined ? "" : String(valor);
  });

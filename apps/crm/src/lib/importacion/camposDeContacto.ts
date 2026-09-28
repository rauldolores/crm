/**
 * Las columnas que entiende la importación de contactos, con lo que hay que
 * saber de cada una para reconocerla en el CSV de otro sistema.
 *
 * Hasta ahora la importación leía las cabeceras del archivo tal cual: si el
 * CSV venía de otro CRM o de un Excel en español («Nombre», «Correo»,
 * «Teléfono celular»), cada fila entraba con todos los campos vacíos y sin
 * avisar. Este catálogo es lo que permite mapear una cabecera cualquiera a su
 * columna, y es el mismo que ve el modelo de decisión y el que rellena el
 * desplegable de la pantalla — para que no puedan desincronizarse.
 *
 * `pista` está escrita para quien no conoce el CRM (persona o modelo): dice
 * qué contiene la columna, no cómo se llama.
 */

export interface CampoDeImportacion {
  /** La cabecera que espera la importación. */
  value: string;
  /** Cómo se llama para una persona. */
  label: string;
  /** Qué contiene, con ejemplos. */
  pista: string;
}

export const CAMPOS_DE_CONTACTO: CampoDeImportacion[] = [
  {
    value: "first_name",
    label: "Nombre",
    pista: "El nombre de pila de la persona, sin apellidos. Ej. «Laura»",
  },
  {
    value: "last_name",
    label: "Apellidos",
    pista: "Los apellidos de la persona, sin el nombre. Ej. «Méndez Ruiz»",
  },
  {
    value: "full_name",
    label: "Nombre completo",
    pista:
      "Nombre y apellidos juntos en la misma columna. Ej. «Laura Méndez Ruiz»",
  },
  {
    value: "company",
    label: "Empresa",
    pista:
      "El nombre de la empresa donde trabaja. Ej. «Automóviles Tecnilenio»",
  },
  {
    value: "title",
    label: "Puesto",
    pista: "Su cargo en la empresa. Ej. «Gerente de compras», «Director»",
  },
  {
    value: "email_work",
    label: "Correo del trabajo",
    pista:
      "Una dirección de correo electrónico, la del trabajo o la única que haya",
  },
  {
    value: "email_home",
    label: "Correo personal",
    pista:
      "Otra dirección de correo distinta de la del trabajo: personal o particular",
  },
  {
    value: "email_other",
    label: "Otro correo",
    pista: "Una tercera dirección de correo, de cualquier tipo",
  },
  {
    value: "phone_work",
    label: "Teléfono del trabajo",
    // Sin «o el único que haya»: el modelo juzga cada columna por separado y
    // no puede saber cuántas trae la hoja, así que esa pista solo lo confundía.
    pista: "El teléfono de la oficina o del trabajo",
  },
  {
    value: "phone_home",
    label: "Teléfono personal",
    pista:
      "Otro teléfono distinto del de la oficina: celular, móvil o el de casa",
  },
  {
    value: "phone_other",
    label: "Otro teléfono",
    pista: "Un tercer número de teléfono, de cualquier tipo",
  },
  {
    value: "gender",
    label: "Género",
    pista: "Ej. «hombre», «mujer», «masculino», «F», «M»",
  },
  {
    value: "background",
    label: "Notas",
    pista:
      "Texto libre sobre la persona: antecedentes, comentarios, observaciones",
  },
  {
    value: "tags",
    label: "Etiquetas",
    pista:
      "Etiquetas o categorías, varias separadas por comas. Ej. «cliente, vip»",
  },
  {
    value: "status",
    label: "Temperatura",
    pista: "Lo caliente que está el contacto. Ej. «caliente», «frío», «hot»",
  },
  {
    value: "linkedin_url",
    label: "LinkedIn",
    pista: "La dirección de su perfil de LinkedIn",
  },
  {
    value: "has_newsletter",
    label: "Recibe el boletín",
    pista: "Sí o no: si está suscrito al boletín o a la lista de correo",
  },
  {
    value: "first_seen",
    label: "Primer contacto",
    pista: "La fecha en que se le conoció o se dio de alta",
  },
  {
    value: "last_seen",
    label: "Último contacto",
    pista: "La fecha de la última interacción con esa persona",
  },
  {
    value: "avatar",
    label: "Foto",
    pista: "La dirección de una imagen o foto de la persona",
  },
];

/** Valor reservado: esta columna del archivo no se importa. */
export const SIN_COLUMNA = "_ninguna";

const CONOCIDAS = new Set(CAMPOS_DE_CONTACTO.map((c) => c.value));

/**
 * Si la cabecera ya es una de las nuestras. Un archivo exportado del propio
 * CRM entra sin pasar por el mapeo, que es el caso más común.
 */
export const esCabeceraConocida = (cabecera: string): boolean =>
  CONOCIDAS.has(cabecera.trim());

/**
 * Las cabeceras que no reconocemos. Vacío = el archivo se puede importar tal
 * cual y no hace falta preguntar nada.
 *
 * Las de campos personalizados se excluyen aparte por quien llama, que es el
 * único que conoce la configuración de esa organización.
 */
export const cabecerasDesconocidas = (cabeceras: string[]): string[] =>
  cabeceras.filter((c) => c.trim() !== "" && !esCabeceraConocida(c));

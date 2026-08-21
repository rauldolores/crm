/**
 * Catálogo de permisos de la aplicación "crm" en Kontrolia Auth.
 *
 * Fuente única de verdad: la consume el registro de la aplicación en el
 * auth-server, y el frontend comprueba estas mismas claves contra el claim
 * `permissions` del token.
 *
 * Cada permiso se registra con la clave `crm.<recurso>.<accion>`, que es el
 * formato que construye `registerApplication()` de @kontrolia/db.
 *
 * Convenciones, siguiendo el catálogo de Faqturia:
 * - `recurso` y `accion` van en español y en minúsculas, sin acentos, porque
 *   forman parte de la clave que viaja en el token.
 * - `administrar` agrupa crear, editar y eliminar cuando no tiene sentido
 *   separarlos; cuando sí lo tiene (una oportunidad se puede ver sin poder
 *   borrarla), se desglosa.
 * - La descripción sí lleva acentos: es texto para personas.
 */

/**
 * Equivalente a `PermissionInput` de @kontrolia/db. Se declara aquí en lugar de
 * importarlo para no añadir esa dependencia al CRM: son tres campos estables y
 * el paquete solo hace falta en el lado del registro.
 */
export interface PermissionInput {
  resource: string;
  action: string;
  description?: string;
}

export const CRM_PERMISSIONS: PermissionInput[] = [
  // Contactos
  { resource: "contactos", action: "ver", description: "Consultar la lista y la ficha de contactos" },
  { resource: "contactos", action: "crear", description: "Dar de alta contactos" },
  { resource: "contactos", action: "editar", description: "Modificar los datos de un contacto" },
  { resource: "contactos", action: "eliminar", description: "Eliminar contactos" },
  { resource: "contactos", action: "importar", description: "Importar contactos desde un archivo CSV" },
  { resource: "contactos", action: "exportar", description: "Exportar contactos a CSV o vCard" },
  { resource: "contactos", action: "fusionar", description: "Fusionar dos contactos duplicados en uno" },
  { resource: "contactos", action: "etiquetar", description: "Aplicar etiquetas de forma masiva a varios contactos" },

  // Empresas
  { resource: "empresas", action: "ver", description: "Consultar la lista y la ficha de empresas" },
  { resource: "empresas", action: "crear", description: "Dar de alta empresas" },
  { resource: "empresas", action: "editar", description: "Modificar los datos de una empresa" },
  { resource: "empresas", action: "eliminar", description: "Eliminar empresas" },
  { resource: "empresas", action: "exportar", description: "Exportar empresas a CSV" },

  // Oportunidades (el embudo de ventas)
  { resource: "oportunidades", action: "ver", description: "Consultar el embudo y la ficha de oportunidades" },
  { resource: "oportunidades", action: "crear", description: "Crear oportunidades" },
  { resource: "oportunidades", action: "editar", description: "Modificar una oportunidad y moverla de etapa" },
  { resource: "oportunidades", action: "eliminar", description: "Eliminar oportunidades" },
  { resource: "oportunidades", action: "archivar", description: "Archivar y desarchivar oportunidades" },

  // Notas
  { resource: "notas", action: "ver", description: "Leer las notas de contactos y oportunidades" },
  { resource: "notas", action: "crear", description: "Añadir notas, con archivos adjuntos" },
  { resource: "notas", action: "editar", description: "Modificar notas existentes" },
  { resource: "notas", action: "eliminar", description: "Eliminar notas y sus archivos adjuntos" },

  // Tareas
  { resource: "tareas", action: "ver", description: "Consultar las tareas propias y del equipo" },
  { resource: "tareas", action: "administrar", description: "Crear, editar, completar, aplazar y eliminar tareas" },

  // Etiquetas
  { resource: "etiquetas", action: "administrar", description: "Crear, renombrar, recolorear y eliminar etiquetas" },

  // Equipo comercial (tabla sales)
  { resource: "equipo", action: "ver", description: "Consultar los miembros del equipo comercial" },
  { resource: "equipo", action: "administrar", description: "Dar de alta, editar y desactivar miembros del equipo" },

  // Panel y actividad
  { resource: "panel", action: "ver", description: "Ver el panel de inicio, sus indicadores y el registro de actividad" },

  // Configuración de la organización
  { resource: "configuracion", action: "ver", description: "Consultar los ajustes de la organización" },
  { resource: "configuracion", action: "editar", description: "Editar marca, etapas, categorías, sectores, moneda y tipos" },

  // Integraciones
  { resource: "correo_entrante", action: "configurar", description: "Configurar la captura de correo entrante como notas" },
  { resource: "mcp", action: "usar", description: "Conectar un asistente de IA a los datos del CRM vía MCP" },
  { resource: "importaciones", action: "administrar", description: "Ejecutar y revisar importaciones masivas de datos" },
];

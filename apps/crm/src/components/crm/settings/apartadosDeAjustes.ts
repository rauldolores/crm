/**
 * El menú de Ajustes: todo lo que administra la organización, agrupado por
 * tarea y no por tabla.
 *
 * Antes era una página larguísima con un solo «Guardar» al final y, encima,
 * una cuadrícula de enlaces a pantallas sueltas (automatizaciones, correo,
 * IA…) que te sacaban de Ajustes sin forma de volver. Usuarios, Plantillas,
 * Bandeja y Afiliados vivían cada uno en otra parte.
 *
 * Ahora cada entrada es una dirección propia. Las pantallas que ya existían
 * conservan la suya (no se rompe ningún enlace): solo se pintan dentro del
 * marco de Ajustes (ver MarcoDeAjustes). Las que salen de la antigua página
 * larga viven en /settings/<apartado>.
 */

export interface EntradaDeAjustes {
  /** Clave de traducción del nombre. */
  etiqueta: string;
  ruta: string;
  /** Módulo que tiene que estar activo para que la entrada aparezca. */
  modulo?: string;
}

export interface GrupoDeAjustes {
  /** Clave de traducción del encabezado. */
  titulo: string;
  entradas: EntradaDeAjustes[];
}

/** Los apartados de la configuración que se editan en SettingsPage. */
export type ApartadoDeConfiguracion =
  | "proyectos"
  | "embudos"
  | "reglas"
  | "renovaciones"
  | "riesgo"
  | "campos"
  | "listas"
  | "tickets";

export const APARTADO_INICIAL: ApartadoDeConfiguracion = "proyectos";

export const rutaDeApartado = (apartado: ApartadoDeConfiguracion) =>
  `/settings/${apartado}`;

const n = (clave: string) => `crm.settings.nav.${clave}`;

export const GRUPOS_DE_AJUSTES: GrupoDeAjustes[] = [
  {
    titulo: n("organization"),
    entradas: [
      { etiqueta: n("projects"), ruta: rutaDeApartado("proyectos") },
      { etiqueta: n("users"), ruta: "/sales" },
      { etiqueta: n("modules"), ruta: "/modulos/catalogo" },
      { etiqueta: n("plan"), ruta: "/facturacion" },
    ],
  },
  {
    titulo: n("sales"),
    entradas: [
      { etiqueta: n("pipelines"), ruta: rutaDeApartado("embudos") },
      { etiqueta: n("rules"), ruta: rutaDeApartado("reglas") },
      { etiqueta: n("quotes"), ruta: "/cotizaciones" },
      {
        etiqueta: n("renewals"),
        ruta: rutaDeApartado("renovaciones"),
        modulo: "customers",
      },
      {
        etiqueta: n("risk"),
        ruta: rutaDeApartado("riesgo"),
        modulo: "customers",
      },
      {
        etiqueta: n("affiliates"),
        ruta: "/affiliates/configuracion",
        modulo: "affiliates",
      },
    ],
  },
  {
    titulo: n("data"),
    entradas: [
      { etiqueta: n("custom_fields"), ruta: rutaDeApartado("campos") },
      { etiqueta: n("lists"), ruta: rutaDeApartado("listas") },
      { etiqueta: n("import"), ruta: "/import" },
    ],
  },
  {
    titulo: n("support"),
    entradas: [{ etiqueta: n("tickets"), ruta: rutaDeApartado("tickets") }],
  },
  {
    titulo: n("communication"),
    entradas: [
      { etiqueta: n("email"), ruta: "/correo" },
      { etiqueta: n("email_templates"), ruta: "/email_templates" },
      { etiqueta: n("inbox"), ruta: "/bandeja/configurar", modulo: "inbox" },
      { etiqueta: n("forms"), ruta: "/formularios" },
    ],
  },
  {
    titulo: n("automation"),
    entradas: [
      { etiqueta: n("automations"), ruta: "/automatizaciones" },
      { etiqueta: n("ai"), ruta: "/inteligencia-artificial" },
    ],
  },
  {
    titulo: n("integrations"),
    entradas: [
      { etiqueta: n("api"), ruta: "/integraciones" },
      { etiqueta: n("connectors"), ruta: "/modulos/conectores" },
      {
        etiqueta: n("invoicing"),
        ruta: "/modulos/facturacion",
        modulo: "invoicing",
      },
    ],
  },
];

/** Si la ruta es la de la entrada o una de sus subpáginas (/sales/3…). */
export const rutaPerteneceA = (pathname: string, ruta: string) =>
  pathname === ruta || pathname.startsWith(`${ruta}/`);

/** Si la pantalla actual es de Ajustes (y se pinta con su menú). */
export const esPantallaDeAjustes = (pathname: string) =>
  pathname === "/settings" ||
  GRUPOS_DE_AJUSTES.some((grupo) =>
    grupo.entradas.some((entrada) => rutaPerteneceA(pathname, entrada.ruta)),
  );

/** Los grupos con solo las entradas cuyo módulo está activo. */
export const gruposVisibles = (
  modulos: Record<string, { active?: boolean } | undefined>,
): GrupoDeAjustes[] =>
  GRUPOS_DE_AJUSTES.map((grupo) => ({
    ...grupo,
    entradas: grupo.entradas.filter(
      (entrada) => !entrada.modulo || modulos[entrada.modulo]?.active,
    ),
  })).filter((grupo) => grupo.entradas.length > 0);

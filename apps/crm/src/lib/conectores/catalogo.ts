/**
 * Catálogo de conectores: qué proveedores existen para cada familia y qué
 * necesita cada uno para conectarse. Es la única fuente para la pantalla de
 * Ajustes → Conectores y para las rutas del servidor que validan lo que
 * llega. No contiene código de red ni secretos: eso vive en
 * src/lib/server/conectores.
 *
 * Dos familias, y en cada una el cliente elige a SU proveedor:
 * - products: de dónde salen los productos que se eligen en una cotización.
 * - invoicing: quién timbra la factura cuando una cotización se acepta.
 *
 * Los textos de aquí (nombre, pasos) son contenido del proveedor, no
 * interfaz: van en español directamente.
 */

export type FamiliaDeConector = "products" | "invoicing";

export interface CampoDeConector {
  key: string;
  label: string;
  /** Una línea debajo del campo, en el lenguaje de quien no es técnico. */
  help?: string;
  placeholder?: string;
  type: "text" | "url" | "secret" | "select";
  options?: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}

export interface ProveedorDeConector {
  key: string;
  family: FamiliaDeConector;
  name: string;
  /** Qué hace conectarlo, en una frase. */
  description: string;
  website: string;
  /** El campo `secret` es la credencial; solo puede haber uno por proveedor. */
  fields: CampoDeConector[];
  /** Pasos para conseguir la credencial, tal cual los sigue la persona. */
  steps: string[];
}

export const FAMILIAS: {
  key: FamiliaDeConector;
  name: string;
  description: string;
}[] = [
  {
    key: "products",
    name: "Catálogo de productos",
    description:
      "Tus productos y precios se traen de donde ya los tienes, para elegirlos al armar una cotización en vez de escribirlos a mano.",
  },
  {
    key: "invoicing",
    name: "Facturación",
    description:
      "Cuando una cotización se acepta, la factura se timbra con tu proveedor de facturación y queda ligada a la oportunidad, con su PDF y XML.",
  },
];

/** Formas de pago del SAT que una pyme usa de verdad. */
export const FORMAS_DE_PAGO = [
  { value: "03", label: "Transferencia electrónica" },
  { value: "01", label: "Efectivo" },
  { value: "04", label: "Tarjeta de crédito" },
  { value: "28", label: "Tarjeta de débito" },
  { value: "02", label: "Cheque nominativo" },
  { value: "99", label: "Por definir" },
];

export const METODOS_DE_PAGO = [
  { value: "PUE", label: "Pago en una sola exhibición (PUE)" },
  { value: "PPD", label: "Pago en parcialidades o diferido (PPD)" },
];

const UNIDADES = [
  { value: "E48", label: "Unidad de servicio (E48)" },
  { value: "H87", label: "Pieza (H87)" },
  { value: "ACT", label: "Actividad (ACT)" },
  { value: "MON", label: "Mes (MON)" },
];

export const PROVEEDORES: ProveedorDeConector[] = [
  {
    key: "shopify",
    family: "products",
    name: "Shopify",
    description:
      "Los productos de tu tienda Shopify, con su SKU y su precio, listos para elegir en las cotizaciones.",
    website: "https://www.shopify.com",
    fields: [
      {
        key: "shop_domain",
        label: "Dirección de tu tienda",
        placeholder: "mitienda.myshopify.com",
        help: "La dirección que termina en .myshopify.com. La ves en la barra del navegador cuando entras a la administración de tu tienda.",
        type: "text",
        required: true,
      },
      {
        key: "access_token",
        label: "Token de acceso de la aplicación",
        placeholder: "shpat_…",
        help: "Empieza por «shpat_». Shopify lo enseña una sola vez; si lo perdiste, genera otro con los mismos pasos.",
        type: "secret",
        required: true,
      },
    ],
    steps: [
      "Entra a la administración de tu tienda Shopify y ve a Configuración → Aplicaciones y canales de venta.",
      "Pulsa «Desarrollar aplicaciones» (si es la primera vez, acepta habilitar el desarrollo de aplicaciones).",
      "Pulsa «Crear una aplicación», ponle de nombre «Vinqulia CRM» y créala.",
      "En «Configurar permisos de la API de administración» marca solo «read_products» y guarda.",
      "Pulsa «Instalar aplicación» y luego «Revelar token una vez». Copia el token (empieza por shpat_) y pégalo aquí.",
    ],
  },
  {
    key: "faqturia",
    family: "invoicing",
    name: "Faqturia",
    description:
      "Timbra facturas CFDI 4.0 desde la cotización aceptada. El PDF y el XML se descargan desde el CRM.",
    website: "https://faqturia.com",
    fields: [
      {
        key: "base_url",
        label: "Dirección de tu Faqturia",
        placeholder: "https://app.faqturia.com",
        help: "Si Faqturia está instalado en tus propios servidores, la dirección con la que entras a él.",
        type: "url",
        defaultValue: "https://app.faqturia.com",
        required: true,
      },
      {
        key: "api_key",
        label: "Clave de API",
        placeholder: "ktrl_live_…",
        help: "Se crea en Faqturia, en Ajustes → Claves de API. Necesita permiso para leer y crear clientes y facturas.",
        type: "secret",
        required: true,
      },
      {
        key: "serie",
        label: "Serie de las facturas",
        placeholder: "A",
        help: "La serie que Faqturia usará para las facturas que salgan del CRM.",
        type: "text",
        defaultValue: "A",
      },
      {
        key: "forma_pago",
        label: "Forma de pago habitual",
        type: "select",
        options: FORMAS_DE_PAGO,
        defaultValue: "03",
        help: "Se puede cambiar factura por factura.",
      },
      {
        key: "metodo_pago",
        label: "Método de pago",
        type: "select",
        options: METODOS_DE_PAGO,
        defaultValue: "PUE",
      },
      {
        key: "clave_prod_serv",
        label: "Clave de producto o servicio del SAT",
        placeholder: "81112100",
        help: "La clave del catálogo del SAT que mejor describe lo que vendes (por ejemplo 81112100 para servicios de internet, 43232408 para software). Si no la sabes, tu contador la tiene.",
        type: "text",
        required: true,
      },
      {
        key: "clave_unidad",
        label: "Unidad",
        type: "select",
        options: UNIDADES,
        defaultValue: "E48",
      },
    ],
    steps: [
      "Entra a tu Faqturia y ve a Ajustes → Claves de API.",
      "Crea una clave nueva con nombre «Vinqulia CRM» y con permisos de clientes (leer y escribir) y facturas (leer y escribir).",
      "Copia la clave (empieza por ktrl_live_) y pégala aquí. Faqturia la enseña una sola vez.",
      "Elige la serie y la clave del SAT con la que quieres que salgan las facturas del CRM. Si tienes duda con la clave del SAT, pregúntale a tu contador.",
    ],
  },
];

export const proveedorPorClave = (
  clave: string,
): ProveedorDeConector | undefined =>
  PROVEEDORES.find((proveedor) => proveedor.key === clave);

export const proveedoresDe = (
  familia: FamiliaDeConector,
): ProveedorDeConector[] =>
  PROVEEDORES.filter((proveedor) => proveedor.family === familia);

export const esFamilia = (valor: unknown): valor is FamiliaDeConector =>
  valor === "products" || valor === "invoicing";

/** El campo que guarda la credencial: va aparte del resto de ajustes. */
export const campoSecreto = (
  proveedor: ProveedorDeConector,
): CampoDeConector | undefined =>
  proveedor.fields.find((campo) => campo.type === "secret");

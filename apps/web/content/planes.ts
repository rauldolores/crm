/**
 * Planes y precios de Vinqulia.
 *
 * La fuente de verdad es el catálogo de planes de KontrolIA Auth para la
 * aplicación `crm` (lo que la propia aplicación muestra en Plan y
 * facturación). Ese catálogo exige sesión, así que la web pública no lo
 * consulta en vivo: se copia aquí. Si cambia un precio o un límite allí,
 * hay que reflejarlo aquí. Última sincronización: 2026-09-17.
 */

export interface Plan {
  slug: string;
  nombre: string;
  /** Adónde lleva el botón cuando el plan no se compra con tarjeta. */
  enlace?: string;
  /** Una frase: para quién es. */
  para: string;
  /** Precio mensual en MXN; null cuando se cotiza a medida. */
  precioMensual: number | null;
  /**
   * Precio del mismo plan pagando el año entero, en MXN; null si el plan
   * no tiene opción anual (Enterprise). Es un intervalo de cobro del mismo
   * plan, no un plan aparte.
   */
  precioAnual: number | null;
  diasDePrueba: number;
  usuarios: string;
  /** Lo que incluye, en orden de venta. */
  incluye: string[];
  destacado?: boolean;
}

export const MONEDA = "MXN";

export const PLANES: Plan[] = [
  {
    slug: "plan-inicio",
    nombre: "Impulso",
    para: "Para empezar a ordenar clientes y ventas hoy mismo.",
    precioMensual: 499,
    precioAnual: 4990,
    diasDePrueba: 30,
    usuarios: "Hasta 3 usuarios",
    incluye: [
      "Contactos, empresas y oportunidades (hasta 100 contactos)",
      "Un embudo de ventas con tablero Kanban",
      "Tareas, notas y panel de inicio",
      "Formularios web para captar contactos",
      "Importación desde CSV",
      "Aplicación móvil y centro de ayuda",
      "Soporte estándar",
    ],
  },
  {
    slug: "plan-pro",
    nombre: "Pro",
    para: "Para equipos que ya venden en serio y quieren que el CRM trabaje solo.",
    precioMensual: 999,
    precioAnual: 9990,
    diasDePrueba: 0,
    usuarios: "Hasta 10 usuarios",
    incluye: [
      "Todo lo de Impulso, sin límite de contactos",
      "Varios embudos (ventas, renovaciones, cobranza…)",
      "WhatsApp y correo desde la ficha, con tu propio dominio",
      "Automatizaciones: tareas, responsables y correos solos",
      "Plantillas de correo con campos que se rellenan solos",
      "Informes de conversión, vendedores y motivos de pérdida",
      "Vistas guardadas y campos personalizados",
      "Tickets de soporte y módulo Clientes (contratos y renovaciones)",
      "API REST, claves de API y webhooks firmados",
      "Asistente de IA conectado a tus datos (MCP)",
      "Migración básica de tu base actual",
    ],
    destacado: true,
  },
  {
    slug: "plan-max",
    nombre: "Max",
    para: "Para operaciones grandes o con procesos propios.",
    precioMensual: 1999,
    precioAnual: 19990,
    diasDePrueba: 0,
    usuarios: "Hasta 25 usuarios",
    incluye: [
      "Todo lo de Pro",
      "Personalización avanzada de pantallas y procesos",
      "Automatizaciones avanzadas",
      "Integración con tu facturación, ERP o tienda",
      "Configuración guiada por el equipo de Kontrolia",
      "Mayor control de usuarios y permisos",
      "Despliegue especial según el proyecto",
      "Soporte prioritario",
    ],
  },
  {
    slug: "enterprise",
    nombre: "Enterprise",
    enlace: "/enterprise",
    para: "Para operaciones grandes o que necesitan el dato en casa.",
    precioMensual: null,
    precioAnual: null,
    diasDePrueba: 0,
    usuarios: "De 50 usuarios a ilimitados",
    incluye: [
      "Instancia solo para ti: tu base, tu dominio, tus respaldos",
      "En nuestra nube o instalado en tus servidores",
      "Todos los módulos, sin límite de contactos ni embudos",
      "Implementación acompañada y migración de tus datos",
      "SLA y soporte con responsable asignado",
      "Integraciones a medida y SSO",
    ],
  },
];

export const formatearPrecio = (precio: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: MONEDA,
    maximumFractionDigits: 0,
  }).format(precio);

/**
 * Porcentaje que se ahorra al año frente a doce mensualidades — la misma
 * fórmula que usa la aplicación. null si el plan no tiene precio anual.
 */
export const ahorroAnual = (plan: Plan): number | null =>
  plan.precioMensual === null || plan.precioAnual === null
    ? null
    : Math.max(
        0,
        Math.round((1 - plan.precioAnual / (plan.precioMensual * 12)) * 100),
      );

/** Lo que sale al mes pagando el año entero. */
export const equivalenteMensual = (plan: Plan): number | null =>
  plan.precioAnual === null ? null : Math.round(plan.precioAnual / 12);

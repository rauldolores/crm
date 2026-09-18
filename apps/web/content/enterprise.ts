/**
 * Plan Enterprise: la única fuente de sus precios, bandas y textos.
 *
 * Enterprise no es un plan de KontrolIA Auth ni pasa por Stripe: se cotiza
 * en una conversación y se asigna a mano. Lo que vive aquí es lo que el
 * prospecto necesita para entender qué es y hacer sus propias cuentas antes
 * de esa conversación. La calculadora y la ruta /api/lead usan las mismas
 * funciones, así que la estimación que ve en pantalla es la que llega al
 * CRM.
 *
 * Si cambian los precios, cambian aquí y en la tarjeta del propio CRM
 * (apps/crm, «crm.billing.enterprise»), que solo muestra el «desde».
 */

export type Modalidad = "nube" | "onpremise";

export interface Banda {
  /** Tope de usuarios de la banda; null = sin tope. */
  hastaUsuarios: number | null;
  etiqueta: string;
  /** Licencia anual en MXN por modalidad. */
  licencia: Record<Modalidad, number>;
}

export const BANDAS: Banda[] = [
  {
    hastaUsuarios: 50,
    etiqueta: "Hasta 50 usuarios",
    licencia: { nube: 79_000, onpremise: 99_000 },
  },
  {
    hastaUsuarios: 150,
    etiqueta: "Hasta 150 usuarios",
    licencia: { nube: 129_000, onpremise: 159_000 },
  },
  {
    hastaUsuarios: null,
    etiqueta: "Usuarios ilimitados",
    licencia: { nube: 199_000, onpremise: 249_000 },
  },
];

/** Implementación base, pago único. */
export const IMPLEMENTACION_BASE = 45_000;
/** Trabajo fuera del alcance base: integraciones a medida. */
export const TARIFA_HORA = 1_500;
/** Descuento por compromiso plurianual, en porcentaje. */
export const DESCUENTO_2_ANIOS = 10;
export const DESCUENTO_3_ANIOS = 15;
/** Para las primeras empresas Enterprise, a cambio de ser caso de éxito. */
export const DESCUENTO_FUNDADOR = 20;
export const CUPOS_FUNDADOR = 3;

/** El «desde» que se muestra en las tarjetas de precios. */
export const DESDE = {
  nube: BANDAS[0].licencia.nube,
  onpremise: BANDAS[0].licencia.onpremise,
};

export const MODALIDADES: Record<
  Modalidad,
  {
    nombre: string;
    frase: string;
    paraQuien: string;
    queNecesitas: string[];
    queTeToca: string[];
    tiempoDeArranque: string;
  }
> = {
  nube: {
    nombre: "Nube dedicada",
    frase: "Nosotros la operamos; tú entras y trabajas.",
    paraQuien:
      "Para quien quiere una instancia solo suya —su base de datos, su dominio, sus respaldos— sin tener que administrar servidores.",
    queNecesitas: [
      "Un dominio o subdominio para la aplicación (p. ej. crm.tuempresa.com)",
      "Quién será el administrador de la cuenta",
      "Tus datos actuales, si los hay, para migrarlos",
    ],
    queTeToca: [
      "Nada de infraestructura: alojamiento, respaldos y actualizaciones van por nuestra cuenta",
      "Dar de alta a tu equipo y definir tus embudos con nosotros",
    ],
    tiempoDeArranque: "2 a 4 semanas",
  },
  onpremise: {
    nombre: "En tus servidores",
    frase: "El dato nunca sale de tu casa.",
    paraQuien:
      "Para quien tiene una política de datos, un área de sistemas o un requisito regulatorio que exige que la información viva en su propia infraestructura.",
    queNecesitas: [
      "Un servidor Linux con Docker (4 vCPU, 8 GB de RAM y 50 GB es suficiente para empezar)",
      "PostgreSQL 15 o superior, propio o gestionado",
      "Dominio, certificado TLS y salida de correo (SMTP o un proveedor como Resend)",
      "Una persona de sistemas como contraparte durante la instalación",
    ],
    queTeToca: [
      "Operar el servidor: disponibilidad, respaldos diarios y seguridad del entorno",
      "Aplicar las actualizaciones que te entregamos (te acompañamos en cada una el primer año)",
    ],
    tiempoDeArranque: "4 a 8 semanas",
  },
};

export const INCLUYE = [
  "Instancia aislada: tu base de datos, tu dominio, tus respaldos",
  "Usuarios según tu banda; contactos y embudos sin límite",
  "Todos los módulos: Clientes, Afiliados y los que vengan",
  "WhatsApp, correo, plantillas con IA, automatizaciones, API y asistente de IA (MCP)",
  "Actualizaciones incluidas durante la vigencia de la licencia",
  "Soporte prioritario: respuesta en 4 horas hábiles",
  "Disponibilidad garantizada de 99.9 % en nube dedicada",
  "Gestor de cuenta asignado",
  "Un entorno de pruebas además del productivo",
];

export const NO_INCLUYE = [
  "La infraestructura en la modalidad en tus servidores (servidor, base de datos, dominio)",
  "Integraciones a medida con tu ERP, telefonía o sistemas propios: se cotizan aparte por hora o por proyecto",
  "Licencias de terceros que decidas usar: WhatsApp (Twilio), correo transaccional, proveedor de IA",
];

export const IMPLEMENTACION_INCLUYE = [
  "Instalación y puesta en marcha en la modalidad elegida",
  "Migración de tus datos actuales, hasta 50,000 registros (contactos, empresas, oportunidades)",
  "Configuración de embudos, campos personalizados y automatizaciones contigo",
  "Tres sesiones de capacitación para tu equipo",
  "Treinta días de acompañamiento después del arranque",
];

export const PROCESO = [
  {
    paso: "Llamada de diagnóstico",
    duracion: "30 minutos",
    texto:
      "Entendemos tu operación: cuánta gente vende, qué usan hoy, qué tiene que integrarse y dónde quieres que viva el dato.",
  },
  {
    paso: "Propuesta formal",
    duracion: "5 días hábiles",
    texto:
      "Modalidad, banda, alcance de la implementación, cronograma y condiciones. Sin letra chica: lo que ves aquí, con tus números.",
  },
  {
    paso: "Piloto con un equipo",
    duracion: "30 días",
    texto:
      "Arrancamos con un equipo real y datos reales. Si al final del piloto no funciona para ustedes, no se paga el resto.",
  },
  {
    paso: "Arranque general",
    duracion: "según la modalidad",
    texto:
      "Migración completa, capacitación al resto del equipo y un mes de acompañamiento.",
  },
];

export const PREGUNTAS = [
  {
    pregunta: "¿Qué pasa cuando termina el año?",
    respuesta:
      "Se renueva la licencia por otro año al mismo precio de tu banda, salvo que hayas crecido de banda. Si decides no renovar, en nube dedicada te entregamos una exportación completa de tus datos; en tus servidores, la aplicación sigue en tu poder pero deja de recibir actualizaciones y soporte.",
  },
  {
    pregunta: "¿Puedo empezar en nube dedicada y pasar después a mis servidores?",
    respuesta:
      "Sí. Es el camino que recomendamos cuando el área de sistemas todavía no tiene lista la infraestructura: arrancas en semanas y migras después. La migración entre modalidades se cotiza como implementación reducida.",
  },
  {
    pregunta: "¿De quién son los datos?",
    respuesta:
      "Tuyos, siempre. Nosotros no los usamos, no los vendemos y no entrenamos nada con ellos. El contrato lo dice con esas palabras y firmamos acuerdo de confidencialidad si lo necesitas.",
  },
  {
    pregunta: "¿Cómo se factura?",
    respuesta:
      "La licencia se factura anual y por adelantado, con CFDI. La implementación, al firmar. Precios en pesos mexicanos más IVA.",
  },
  {
    pregunta: "¿Y si somos más de 150 usuarios?",
    respuesta:
      "La banda de usuarios ilimitados existe justo para eso. Si además necesitan varias instancias (una por país o por unidad de negocio), se cotiza como proyecto.",
  },
  {
    pregunta: "¿Puedo pagar en dólares?",
    respuesta:
      "Sí, para empresas fuera de México. Se cotiza al tipo de cambio del día de la propuesta y se mantiene durante la vigencia de la licencia.",
  },
];

/** La banda que corresponde a un número de usuarios. */
export const bandaPara = (usuarios: number): Banda =>
  BANDAS.find(
    (banda) => banda.hastaUsuarios === null || usuarios <= banda.hastaUsuarios,
  ) ?? BANDAS[BANDAS.length - 1];

export interface Estimacion {
  modalidad: Modalidad;
  usuarios: number;
  banda: Banda;
  licenciaAnual: number;
  implementacion: number;
  totalPrimerAnio: number;
  /** Licencia dividida en doce, sin la implementación. */
  mensualEquivalente: number;
  /** Licencia mensual entre los usuarios indicados. */
  porUsuarioAlMes: number;
}

/**
 * Estimación del primer año. Es lo que ve la persona en la calculadora y lo
 * que se guarda en el CRM al pedir la propuesta, calculado en el servidor
 * con los mismos números.
 */
export const estimar = (modalidad: Modalidad, usuarios: number): Estimacion => {
  const usuariosValidos = Math.max(1, Math.min(10_000, Math.round(usuarios)));
  const banda = bandaPara(usuariosValidos);
  const licenciaAnual = banda.licencia[modalidad];
  return {
    modalidad,
    usuarios: usuariosValidos,
    banda,
    licenciaAnual,
    implementacion: IMPLEMENTACION_BASE,
    totalPrimerAnio: licenciaAnual + IMPLEMENTACION_BASE,
    mensualEquivalente: Math.round(licenciaAnual / 12),
    porUsuarioAlMes: Math.round(licenciaAnual / 12 / usuariosValidos),
  };
};

/**
 * Clave de la plantilla de cotización del CRM que corresponde a cada
 * modalidad (Ajustes → Cotizaciones). Si existe, la cotización automática
 * toma de ella el título y las condiciones; si no, usa el texto de abajo.
 */
export const PLANTILLA_DE_COTIZACION: Record<Modalidad, string> = {
  nube: "enterprise-nube-dedicada",
  onpremise: "enterprise-en-tus-servidores",
};

/** Condiciones de la cotización cuando no hay plantilla en el CRM. */
export const condicionesPorDefecto = (modalidad: Modalidad): string =>
  [
    `Licencia anual de Vinqulia Enterprise (${MODALIDADES[modalidad].nombre.toLowerCase()}). Incluye: ${INCLUYE.join("; ").toLowerCase()}.`,
    `La implementación incluye: ${IMPLEMENTACION_INCLUYE.join("; ").toLowerCase()}.`,
    `No incluye: ${NO_INCLUYE.join("; ").toLowerCase()}.`,
    `Licencia anual pagada por adelantado con CFDI; ${DESCUENTO_2_ANIOS} % de descuento a 2 años y ${DESCUENTO_3_ANIOS} % a 3. Precios en MXN más IVA.`,
  ].join("\n\n");

/** Las dos líneas de una cotización Enterprise, con los precios de la estimación. */
export const lineasDeCotizacion = (
  estimacion: Estimacion,
): { description: string; quantity: number; unit_price: number }[] => [
  {
    description: `Licencia anual Vinqulia Enterprise · ${MODALIDADES[estimacion.modalidad].nombre.toLowerCase()} · ${estimacion.banda.etiqueta.toLowerCase()}`,
    quantity: 1,
    unit_price: estimacion.licenciaAnual,
  },
  {
    description:
      "Implementación: puesta en marcha, migración, configuración y capacitación",
    quantity: 1,
    unit_price: estimacion.implementacion,
  },
];

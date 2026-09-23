import { NextResponse } from "next/server";

import { CONTACTO } from "../../../lib/sitio";

import {
  MODALIDADES,
  PLANTILLA_DE_COTIZACION,
  condicionesPorDefecto,
  estimar,
  lineasDeCotizacion,
  type Estimacion,
  type Modalidad,
} from "../../../content/enterprise";

/**
 * Captura de leads del formulario de demo, en dos pasos.
 *
 * Paso 1: datos básicos (nombre, empresa, correo, teléfono). Crea en el CRM,
 *         vía su API de datos (/api/datos), la empresa, el contacto y la
 *         oportunidad (deal) que representa al lead. Si el visitante abandona
 *         aquí, ya hay un lead registrado al que dar seguimiento.
 *
 * Paso 2: datos de calificación (equipo, gestión actual, problema,
 *         necesidades, modalidad…). Actualiza la MISMA oportunidad: los datos
 *         que no son campos del CRM se guardan en su descripción; los que sí
 *         existen (p. ej. tamaño de empresa) se escriben en su campo.
 *
 * Paso "enterprise": la solicitud de /enterprise, en un solo envío. Crea
 *         empresa, contacto y oportunidad con la estimación del primer año
 *         como importe (recalculada aquí, no se confía en la del navegador),
 *         una tarea de llamada para el día siguiente y la cotización en
 *         borrador con las mismas cifras que vio el prospecto: quien atiende
 *         abre la oportunidad, revisa y envía. Este formulario ES Vinqulia:
 *         lo que el prospecto llena cae en el CRM de Kontrolia.
 *
 * Configuración (ver .env.example):
 *   CRM_API_BASE_URL  — base de la API del CRM (local o producción)
 *   CRM_API_KEY       — clave de API externa del CRM (formato vnq_...)
 *   CRM_DEAL_STAGE    — etapa de las oportunidades nuevas (por defecto "propuesta")
 *   CRM_SALES_ID      — (opcional) responsable fijo de las oportunidades
 */

export const runtime = "nodejs";

const BASE = (
  process.env.CRM_API_BASE_URL ?? "http://localhost:3001/api/datos/rest/v1"
).replace(/\/$/, "");
const CLAVE = process.env.CRM_API_KEY ?? "";
const ETAPA = process.env.CRM_DEAL_STAGE ?? "propuesta";
const RESPONSABLE = process.env.CRM_SALES_ID
  ? Number(process.env.CRM_SALES_ID)
  : undefined;

const limpiar = (v: unknown, max = 500) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

/**
 * Freno por IP, en memoria y por instancia: suficiente para que un script
 * no llene el CRM de leads falsos en un minuto, sin añadir infraestructura.
 * En serverless cada instancia lleva su propio contador, así que el tope
 * real es «por instancia»; para un formulario de demo es de sobra.
 */
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 8;
const intentosPorIp = new Map<string, { desde: number; cuenta: number }>();

const excedeElFreno = (ip: string): boolean => {
  const ahora = Date.now();
  const registro = intentosPorIp.get(ip);
  if (!registro || ahora - registro.desde > VENTANA_MS) {
    intentosPorIp.set(ip, { desde: ahora, cuenta: 1 });
    return false;
  }
  registro.cuenta += 1;
  return registro.cuenta > MAX_POR_VENTANA;
};

const ipDe = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
  request.headers.get("x-real-ip") ||
  "desconocida";

const GESTION_LABEL: Record<string, string> = {
  excel: "Excel u hojas de cálculo",
  whatsapp: "WhatsApp",
  correo: "Correo electrónico",
  crm: "Otro CRM",
  nada: "Nada centralizado",
  otro: "Otro",
};

const MODALIDAD_LABEL: Record<string, string> = {
  gestionado: "Servicio gestionado por Kontrolia",
  propia: "Instalación en infraestructura propia",
  indefinido: "Aún no lo sé",
};

const NECESIDAD_LABEL: Record<string, string> = {
  integracion: "Integración con otros sistemas",
  automatizacion: "Automatización de procesos",
  ia: "IA / agentes inteligentes",
  whatsapp: "WhatsApp",
};

async function llamarCRM(ruta: string, metodo: string, cuerpo?: unknown) {
  const cabeceras: Record<string, string> = {
    Authorization: `Bearer ${CLAVE}`,
    "Content-Type": "application/json",
    // Todo Vinqulia vive en el esquema `crm`, no en `public` (el que
    // PostgREST usa si no se le indica otro). Sin esto, /api/datos
    // reenvía la petición pero PostgREST busca las tablas en el esquema
    // equivocado y responde 404 (PGRST205).
    "Accept-Profile": "crm",
    "Content-Profile": "crm",
  };
  if (cuerpo !== undefined) cabeceras["Prefer"] = "return=representation";
  const respuesta = await fetch(`${BASE}/${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(15000),
  });
  const texto = await respuesta.text();
  let datos: unknown = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    // Respuesta no JSON: se deja null y se reporta abajo.
  }
  if (!respuesta.ok) {
    throw new Error(
      `El CRM respondió ${respuesta.status}: ${texto.slice(0, 300)}`,
    );
  }
  return datos;
}

const fila = (datos: unknown) =>
  (Array.isArray(datos) ? datos[0] : datos) as
    Record<string, unknown> | undefined;

/** Rango "11-50" -> 50 (companies.size es smallint). */
const tamanoDeEmpresa = (rango: string) =>
  ({
    "1-10": 10,
    "11-50": 50,
    "51-150": 150,
    "151-250": 250,
    "251+": 251,
  })[rango];

/**
 * La empresa con ese nombre exacto, o una nueva. El alta de un lead nuevo
 * (pasoEnterprise) siempre crea, porque cada prospecto es una conversación
 * distinta; aquí no: quien ya es cliente puede pedir varias mejoras y no
 * debe acabar repetido en el CRM.
 */
async function buscarOCrearEmpresa(nombre: string): Promise<number> {
  const encontradas = (await llamarCRM(
    `companies?name=eq.${encodeURIComponent(nombre)}&limit=1`,
    "GET",
  )) as Record<string, unknown>[] | null;
  const existente = Number(encontradas?.[0]?.id);
  if (existente) return existente;

  const creada = fila(await llamarCRM("companies", "POST", { name: nombre }));
  const id = Number(creada?.id);
  if (!id) throw new Error("No se pudo crear la empresa.");
  return id;
}

/** El contacto con ese correo dentro de la empresa, o uno nuevo. */
async function buscarOCrearContacto(
  nombre: string,
  email: string,
  companyId: number,
): Promise<number> {
  // Se busca en la vista `contacts_summary`: el correo vive en un jsonb y
  // solo ella expone `email_fts`, la columna con la que se puede filtrar.
  // Con comodines porque esa columna guarda el jsonb entero como texto
  // (`["ana@empresa.com"]`), no el correo suelto.
  const encontrados = (await llamarCRM(
    `contacts_summary?company_id=eq.${companyId}&email_fts=ilike.*${encodeURIComponent(email)}*&limit=1`,
    "GET",
  )) as Record<string, unknown>[] | null;
  const existente = Number(encontrados?.[0]?.id);
  if (existente) return existente;

  const { first_name, last_name } = separarNombre(nombre);
  const creado = fila(
    await llamarCRM("contacts", "POST", {
      first_name,
      last_name: last_name || undefined,
      email_jsonb: [{ email, type: "Work" }],
      company_id: companyId,
      ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
    }),
  );
  const id = Number(creado?.id);
  if (!id) throw new Error("No se pudo crear el contacto.");
  return id;
}

const separarNombre = (nombre: string) => {
  const partes = nombre.split(/\s+/).filter(Boolean);
  return {
    first_name: partes[0] ?? "",
    last_name: partes.slice(1).join(" "),
  };
};

export async function POST(request: Request) {
  const cuerpo = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!cuerpo) {
    return NextResponse.json(
      { ok: false, message: "Cuerpo inválido." },
      { status: 400 },
    );
  }

  // Honeypot: los bots rellenan el campo oculto "sitio_web".
  if (limpiar(cuerpo.sitio_web)) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  if (excedeElFreno(ipDe(request))) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.",
      },
      { status: 429 },
    );
  }

  if (!CLAVE) {
    return NextResponse.json(
      {
        ok: false,
        message: `El formulario aún no está conectado al CRM. Escríbenos a ${CONTACTO.correo} mientras lo activamos.`,
      },
      { status: 503 },
    );
  }

  const paso = String(cuerpo.paso ?? "");

  try {
    if (paso === "1") return await pasoUno(cuerpo);
    if (paso === "2") return await pasoDos(cuerpo);
    if (paso === "enterprise") return await pasoEnterprise(cuerpo);
    if (paso === "funcionalidad") return await pasoFuncionalidad(cuerpo);
    return NextResponse.json(
      { ok: false, message: "Paso desconocido." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[lead] Error al guardar en el CRM:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo guardar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.",
      },
      { status: 502 },
    );
  }
}

async function pasoUno(cuerpo: Record<string, unknown>) {
  const nombre = limpiar(cuerpo.nombre, 120);
  const empresa = limpiar(cuerpo.empresa, 120);
  const email = limpiar(cuerpo.email, 200);
  const telefono = limpiar(cuerpo.telefono, 50);

  if (!nombre || !empresa || !email) {
    return NextResponse.json(
      { ok: false, message: "Faltan datos obligatorios." },
      { status: 400 },
    );
  }

  const { first_name, last_name } = separarNombre(nombre);

  // 1) Empresa
  const empresaFila = fila(
    await llamarCRM("companies", "POST", { name: empresa }),
  );
  const companyId = Number(empresaFila?.id);
  if (!companyId) throw new Error("No se pudo crear la empresa.");

  // 2) Contacto
  const contactoFila = fila(
    await llamarCRM("contacts", "POST", {
      first_name,
      last_name: last_name || undefined,
      email_jsonb: email ? [{ email, type: "Work" }] : undefined,
      phone_jsonb: telefono ? [{ number: telefono, type: "Work" }] : undefined,
      company_id: companyId,
      ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
    }),
  );
  const contactId = Number(contactoFila?.id);
  if (!contactId) throw new Error("No se pudo crear el contacto.");

  // 3) Oportunidad que representa al lead
  const descripcionBase = [
    "Solicitud de demo personalizada",
    "Canal: formulario web",
    "Paso: 1 (datos básicos)",
    `Contacto: ${nombre}`,
    `Empresa: ${empresa}`,
    `Correo: ${email}`,
    ...(telefono ? [`WhatsApp/teléfono: ${telefono}`] : []),
  ].join("\n");

  const dealFila = fila(
    await llamarCRM("deals", "POST", {
      // El prefijo identifica el producto: esta organización de Kontrolia
      // puede recibir oportunidades de más de un producto/sitio.
      name: `VINQULIA - Demo personalizada — ${empresa}`,
      company_id: companyId,
      contact_ids: [contactId],
      stage: ETAPA,
      description: descripcionBase,
      // El formulario propio del CRM exige amount y expected_closing_date y
      // los precarga (0 y hoy); sin esto la oportunidad queda con esos
      // campos en null, algo que ninguna oportunidad creada desde el CRM
      // produce y que su pantalla de detalle no esperaba (ver DealShow.tsx).
      amount: 0,
      expected_closing_date: new Date().toISOString().split("T")[0],
      ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
    }),
  );
  const dealId = Number(dealFila?.id);
  if (!dealId) throw new Error("No se pudo crear la oportunidad.");

  return NextResponse.json({
    ok: true,
    leadId: dealId,
    companyId,
    contactId,
  });
}

async function pasoDos(cuerpo: Record<string, unknown>) {
  const leadId = Number(cuerpo.leadId);
  const companyId = Number(cuerpo.companyId ?? 0);
  if (!leadId) {
    return NextResponse.json(
      { ok: false, message: "Falta la referencia del lead." },
      { status: 400 },
    );
  }

  const nombre = limpiar(cuerpo.nombre, 120);
  const empresa = limpiar(cuerpo.empresa, 120);
  const email = limpiar(cuerpo.email, 200);
  const telefono = limpiar(cuerpo.telefono, 50);
  const empleados = limpiar(cuerpo.empleados, 50);
  const personasVentas = limpiar(cuerpo.personas_ventas, 50);
  const gestion = limpiar(cuerpo.gestion_actual, 50);
  const usaCrm = limpiar(cuerpo.usa_crm, 10);
  const crmCual = limpiar(cuerpo.crm_cual, 120);
  const problema = limpiar(cuerpo.problema, 1000);
  const modalidad = limpiar(cuerpo.modalidad, 30);
  const interes = limpiar(cuerpo.interes, 30);
  const necesidades = Array.isArray(cuerpo.necesidades)
    ? cuerpo.necesidades
        .map((n) => limpiar(n, 50))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  const lineas = [
    "Solicitud de demo personalizada",
    "Canal: formulario web",
    `Interés: ${interes || "Demo personalizada"}`,
    `Contacto: ${nombre || "—"}`,
    `Empresa: ${empresa || "—"}`,
    `Correo: ${email || "—"}`,
    ...(telefono ? [`WhatsApp/teléfono: ${telefono}`] : []),
    ...(empleados ? [`Empleados: ${empleados}`] : []),
    ...(personasVentas ? [`Personas en ventas: ${personasVentas}`] : []),
    ...(gestion
      ? [`Gestión actual: ${GESTION_LABEL[gestion] ?? gestion}`]
      : []),
    ...(usaCrm
      ? [
          `¿Usa otro CRM?: ${usaCrm === "si" ? "Sí" : "No"}${
            crmCual ? ` (${crmCual})` : ""
          }`,
        ]
      : []),
    ...(problema ? [`Problema principal: ${problema}`] : []),
    ...(necesidades.length
      ? [
          `Necesita: ${necesidades
            .map((n) => NECESIDAD_LABEL[n] ?? n)
            .join(", ")}`,
        ]
      : []),
    ...(modalidad
      ? [`Modalidad: ${MODALIDAD_LABEL[modalidad] ?? modalidad}`]
      : []),
  ].join("\n");

  // Actualiza la oportunidad con la descripción completa.
  await llamarCRM(`deals?id=eq.${leadId}`, "PATCH", {
    description: lineas,
  });

  // El tamaño de empresa sí es un campo del CRM (companies.size).
  const tamano = empleados ? tamanoDeEmpresa(empleados) : undefined;
  if (companyId && tamano) {
    await llamarCRM(`companies?id=eq.${companyId}`, "PATCH", { size: tamano });
  }

  return NextResponse.json({ ok: true });
}

/** Mañana a las 10:00, hora del centro de México, como ISO con desfase. */
const mananaALasDiez = () => {
  const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const fecha = manana.toISOString().split("T")[0];
  return `${fecha}T10:00:00-06:00`;
};

const pesos = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);

async function pasoEnterprise(cuerpo: Record<string, unknown>) {
  const nombre = limpiar(cuerpo.nombre, 120);
  const empresa = limpiar(cuerpo.empresa, 120);
  const email = limpiar(cuerpo.email, 200);
  const telefono = limpiar(cuerpo.telefono, 50);
  const sistemaActual = limpiar(cuerpo.sistema_actual, 120);
  const comentarios = limpiar(cuerpo.comentarios, 2000);
  const modalidad: Modalidad =
    cuerpo.modalidad === "onpremise" ? "onpremise" : "nube";
  const usuarios = Number(cuerpo.usuarios);

  if (!nombre || !empresa || !email || !Number.isFinite(usuarios)) {
    return NextResponse.json(
      { ok: false, message: "Faltan datos obligatorios." },
      { status: 400 },
    );
  }

  const estimacion = estimar(modalidad, usuarios);
  const { first_name, last_name } = separarNombre(nombre);

  const empresaFila = fila(
    await llamarCRM("companies", "POST", { name: empresa }),
  );
  const companyId = Number(empresaFila?.id);
  if (!companyId) throw new Error("No se pudo crear la empresa.");

  const contactoFila = fila(
    await llamarCRM("contacts", "POST", {
      first_name,
      last_name: last_name || undefined,
      email_jsonb: [{ email, type: "Work" }],
      phone_jsonb: telefono ? [{ number: telefono, type: "Work" }] : undefined,
      company_id: companyId,
      ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
    }),
  );
  const contactId = Number(contactoFila?.id);
  if (!contactId) throw new Error("No se pudo crear el contacto.");

  const descripcion = [
    "Solicitud de propuesta Enterprise",
    "Canal: vinqulia.com/enterprise",
    `Contacto: ${nombre}`,
    `Empresa: ${empresa}`,
    `Correo: ${email}`,
    ...(telefono ? [`WhatsApp/teléfono: ${telefono}`] : []),
    `Modalidad: ${MODALIDADES[modalidad].nombre}`,
    `Usuarios: ${estimacion.usuarios} (${estimacion.banda.etiqueta.toLowerCase()})`,
    ...(sistemaActual ? [`Sistema actual: ${sistemaActual}`] : []),
    "",
    "Estimación que vio en la página:",
    `  Licencia anual: ${pesos(estimacion.licenciaAnual)}`,
    `  Implementación: desde ${pesos(estimacion.implementacion)}`,
    `  Primer año: ${pesos(estimacion.totalPrimerAnio)}`,
    ...(comentarios ? ["", "Qué le trae aquí:", comentarios] : []),
  ].join("\n");

  const dealFila = fila(
    await llamarCRM("deals", "POST", {
      name: `VINQULIA - Enterprise — ${empresa}`,
      company_id: companyId,
      contact_ids: [contactId],
      stage: ETAPA,
      description: descripcion,
      // La estimación del primer año como importe: así el embudo ya dice
      // cuánto vale la conversación antes de tenerla.
      amount: estimacion.totalPrimerAnio,
      expected_closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
    }),
  );
  const dealId = Number(dealFila?.id);
  if (!dealId) throw new Error("No se pudo crear la oportunidad.");

  // La promesa de la página es «te llamamos en menos de un día hábil»: la
  // tarea es lo que la hace verdad. Si falla, el lead ya está guardado.
  await llamarCRM("tasks", "POST", {
    contact_id: contactId,
    text: `Llamar a ${nombre} (${empresa}): solicitud Enterprise, ${MODALIDADES[modalidad].nombre.toLowerCase()}, ${estimacion.usuarios} usuarios`,
    type: "call",
    due_date: mananaALasDiez(),
    ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
  }).catch((error: unknown) => {
    console.error("[lead] No se pudo crear la tarea de llamada:", error);
  });

  await crearCotizacionEnBorrador({
    dealId,
    companyId,
    contactId,
    estimacion,
  }).catch((error: unknown) => {
    console.error("[lead] No se pudo crear la cotización en borrador:", error);
  });

  return NextResponse.json({ ok: true, leadId: dealId, companyId, contactId });
}

/**
 * «Pide una funcionalidad» del centro de ayuda del CRM: un cliente que ya
 * usa Vinqulia pide una mejora o algo que no existe todavía.
 *
 * Acaba en un ticket, no en un correo: así entra en la misma cola que el
 * resto del soporte, con estado, responsable y prioridad, y no se pierde en
 * una bandeja. El cuerpo lleva el contexto que quien lo lea necesita para
 * entenderlo sin escribir de vuelta —quién lo pide, de qué organización, con
 * qué plan y cuánta gente— y dice en la primera línea que es una petición de
 * producto, no una incidencia.
 */
async function pasoFuncionalidad(cuerpo: Record<string, unknown>) {
  const nombre = limpiar(cuerpo.nombre, 120);
  const empresa = limpiar(cuerpo.empresa, 120) || "Sin organización";
  const email = limpiar(cuerpo.email, 200);
  const mensaje = limpiar(cuerpo.mensaje, 4000);
  const plan = limpiar(cuerpo.plan, 120);
  const organizacionId = limpiar(cuerpo.organizacion_id, 60);
  const usuarios = limpiar(cuerpo.usuarios, 20);

  if (!nombre || !email || !mensaje) {
    return NextResponse.json(
      { ok: false, message: "Faltan datos obligatorios." },
      { status: 400 },
    );
  }

  const companyId = await buscarOCrearEmpresa(empresa);
  const contactId = await buscarOCrearContacto(nombre, email, companyId);

  // La primera línea del mensaje, como asunto: es lo que se ve en la cola.
  const primeraLinea = mensaje.split("\n")[0].trim();
  const resumen =
    primeraLinea.length > 90 ? `${primeraLinea.slice(0, 87)}…` : primeraLinea;

  const descripcion = [
    "SOLICITUD DE MEJORA O NUEVA FUNCIONALIDAD — no es una incidencia:",
    "nada está roto, el cliente pide algo que el CRM todavía no hace.",
    "",
    "Canal: centro de ayuda del CRM → «Funcionalidades a tu medida»",
    `Quién lo pide: ${nombre} (${email})`,
    `Organización: ${empresa}`,
    ...(organizacionId ? [`Id de la organización: ${organizacionId}`] : []),
    ...(plan ? [`Plan: ${plan}`] : []),
    ...(usuarios ? [`Usuarios en su CRM: ${usuarios}`] : []),
    "",
    "Lo que pide, en sus palabras:",
    mensaje,
    "",
    "Siguiente paso sugerido: valorar si entra en el producto, si es un",
    "desarrollo a medida (presupuestable) o si ya se puede hacer con algo",
    "que existe, y contestarle por aquí.",
  ].join("\n");

  const ticket = fila(
    await llamarCRM("tickets", "POST", {
      subject: `[product] Mejora: ${resumen || empresa}`,
      description: descripcion,
      contact_id: contactId,
      company_id: companyId,
      source: "api",
      ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
    }),
  );
  const ticketId = Number(ticket?.id);
  if (!ticketId) throw new Error("No se pudo crear el ticket.");

  return NextResponse.json({ ok: true, ticketId, companyId, contactId });
}

/**
 * La cotización Enterprise, en borrador, con las cifras de la estimación.
 * Si en el CRM existe la plantilla de la modalidad (Ajustes →
 * Cotizaciones), toma de ella el título, las condiciones y la vigencia;
 * las líneas salen siempre de la estimación, que es lo que el prospecto vio.
 */
async function crearCotizacionEnBorrador({
  dealId,
  companyId,
  contactId,
  estimacion,
}: {
  dealId: number;
  companyId: number;
  contactId: number;
  estimacion: Estimacion;
}) {
  const configuracion = fila(
    await llamarCRM("configuration?select=config", "GET"),
  );
  const plantillas = ((
    configuracion?.config as { quoteTemplates?: unknown[] } | undefined
  )?.quoteTemplates ?? []) as {
    key: string;
    title?: string;
    notes?: string;
    valid_days?: number;
    contract_period?: string | null;
  }[];
  const plantilla = plantillas.find(
    (p) => p.key === PLANTILLA_DE_COTIZACION[estimacion.modalidad],
  );

  const vigenciaDias = plantilla?.valid_days ?? 30;
  const validaHasta = new Date(Date.now() + vigenciaDias * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const cotizacion = fila(
    await llamarCRM("quotes", "POST", {
      deal_id: dealId,
      company_id: companyId,
      contact_id: contactId,
      title:
        plantilla?.title ??
        `Vinqulia Enterprise · ${MODALIDADES[estimacion.modalidad].nombre}`,
      notes: plantilla?.notes ?? condicionesPorDefecto(estimacion.modalidad),
      contract_period: plantilla?.contract_period ?? "yearly",
      valid_until: validaHasta,
      currency: "MXN",
      ...(RESPONSABLE ? { sales_id: RESPONSABLE } : {}),
    }),
  );
  const quoteId = Number(cotizacion?.id);
  if (!quoteId) throw new Error("No se pudo crear la cotización.");

  const lineas = lineasDeCotizacion(estimacion);
  for (const [indice, linea] of lineas.entries()) {
    await llamarCRM("quote_items", "POST", {
      quote_id: quoteId,
      position: indice,
      ...linea,
      discount_pct: 0,
      tax_rate: 16,
    });
  }
}

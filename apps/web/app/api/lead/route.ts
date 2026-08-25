import { NextResponse } from "next/server";

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
  String(v ?? "").trim().slice(0, max);

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
    | Record<string, unknown>
    | undefined;

/** Rango "11-50" -> 50 (companies.size es smallint). */
const tamanoDeEmpresa = (rango: string) =>
  ({
    "1-10": 10,
    "11-50": 50,
    "51-150": 150,
    "151-250": 250,
    "251+": 251,
  })[rango];

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

  if (!CLAVE) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "El formulario aún no está conectado al CRM. Por favor, escríbenos por WhatsApp mientras lo activamos.",
      },
      { status: 503 },
    );
  }

  const paso = String(cuerpo.paso ?? "");

  try {
    if (paso === "1") return await pasoUno(cuerpo);
    if (paso === "2") return await pasoDos(cuerpo);
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
      name: `Demo personalizada — ${empresa}`,
      company_id: companyId,
      contact_ids: [contactId],
      stage: ETAPA,
      description: descripcionBase,
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

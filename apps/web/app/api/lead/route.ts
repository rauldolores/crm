import { NextResponse } from "next/server";

/**
 * Captura de leads comerciales del formulario de demo.
 *
 * El sitio es una página pública; este endpoint es el punto único por donde
 * entran los leads. Hoy: valida, normaliza, calcula señales de scoring y
 * reenvía a un webhook si está configurado. Si no hay webhook, lo deja
 * registrado en el log del servidor (modo "captura").
 *
 * Para conectar el embudo completo, define en el entorno de despliegue:
 *   LEAD_WEBHOOK_URL = https://tu-backend/leads   (recibe el JSON del lead)
 *
 * La estructura del payload y las señales están pensadas para que un sistema
 * de lead scoring (o el CRM) pueda consumirlas sin cambios en esta página.
 */

export const runtime = "nodejs";

const CAMPOS_OBLIGATORIOS = ["nombre", "empresa", "email"] as const;

type Lead = {
  nombre: string;
  empresa: string;
  email: string;
  telefono?: string;
  empleados?: string;
  personas_ventas?: string;
  gestion_actual?: string;
  usa_crm?: string;
  crm_cual?: string;
  problema?: string;
  necesidades?: string[];
  modalidad?: string;
  interes?: string;
  /** Señuelo anti-bots: si viene relleno, la petición se ignora. */
  sitio_web?: string;
};

const limpiar = (v: unknown) => String(v ?? "").trim().slice(0, 500);

export async function POST(request: Request) {
  const cuerpo = (await request.json().catch(() => null)) as Partial<Lead> | null;
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

  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (!limpiar(cuerpo[campo])) {
      return NextResponse.json(
        { ok: false, message: `Falta el campo ${campo}.` },
        { status: 400 },
      );
    }
  }

  const lead: Lead = {
    nombre: limpiar(cuerpo.nombre),
    empresa: limpiar(cuerpo.empresa),
    email: limpiar(cuerpo.email),
    telefono: limpiar(cuerpo.telefono) || undefined,
    empleados: limpiar(cuerpo.empleados) || undefined,
    personas_ventas: limpiar(cuerpo.personas_ventas) || undefined,
    gestion_actual: limpiar(cuerpo.gestion_actual) || undefined,
    usa_crm: limpiar(cuerpo.usa_crm) || undefined,
    crm_cual: limpiar(cuerpo.crm_cual) || undefined,
    problema: limpiar(cuerpo.problema) || undefined,
    necesidades: Array.isArray(cuerpo.necesidades)
      ? cuerpo.necesidades.filter(Boolean).slice(0, 10)
      : [],
    modalidad: limpiar(cuerpo.modalidad) || undefined,
    interes: limpiar(cuerpo.interes) || undefined,
  };

  const señales = construirSeñales(lead);

  const payload = {
    lead,
    señales,
    // Puntuación orientativa. Reemplazar por el sistema de scoring real cuando
    // exista; aquí solo prioriza qué leads atender primero.
    puntuacion: señales.filter((s) => s.valor).length,
    meta: {
      recibido_en: new Date().toISOString(),
      origen: request.headers.get("referer") ?? "directo",
      user_agent: request.headers.get("user-agent") ?? "",
    },
  };

  const destino = process.env.LEAD_WEBHOOK_URL;

  if (destino) {
    try {
      await fetch(destino, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      console.error("[lead] No se pudo reenviar el lead al webhook", error);
      return NextResponse.json(
        { ok: true, reenviado: false },
        { status: 200 },
      );
    }
    return NextResponse.json({ ok: true, reenviado: true });
  }

  // Modo captura: sin webhook configurado, el lead queda en el log del
  // servidor (conectable a cualquier sistema de seguimiento más adelante).
  console.log("[lead] Nuevo lead:", JSON.stringify(payload, null, 2));
  return NextResponse.json({ ok: true, modo: "captura" });
}

/**
 * Señales de calificación (ver brief de ventas):
 * - solicita demo, quiere migrar, tiene equipo comercial, usa otro CRM,
 *   necesita integración, necesita IA, instalación propia, varios usuarios,
 *   problemas de seguimiento, automatización.
 */
const construirSeñales = (lead: Lead) => {
  const señales: { clave: string; etiqueta: string; valor: boolean }[] = [];

  señales.push({
    clave: "solicita_demo",
    etiqueta: "Solicita una demo personalizada",
    valor: true,
  });

  const quiereMigrar =
    lead.interes === "migracion" ||
    lead.interes === "implementacion" ||
    /^s[ií]/i.test(lead.usa_crm ?? "");
  señales.push({
    clave: "quiere_migrar",
    etiqueta: "Quiere migrar (otro CRM o datos existentes)",
    valor: quiereMigrar,
  });

  const personasVentas = Number.parseInt(lead.personas_ventas ?? "0", 10) || 0;
  señales.push({
    clave: "tiene_equipo_comercial",
    etiqueta: "Tiene equipo comercial",
    valor: personasVentas >= 4,
  });

  señales.push({
    clave: "usa_crm_actual",
    etiqueta: "Utiliza actualmente otro CRM",
    valor: /^s[ií]/i.test(lead.usa_crm ?? ""),
  });

  señales.push({
    clave: "necesita_integracion",
    etiqueta: "Necesita integración con otros sistemas",
    valor: (lead.necesidades ?? []).includes("integracion"),
  });

  señales.push({
    clave: "necesita_ia",
    etiqueta: "Necesita automatización o IA",
    valor:
      (lead.necesidades ?? []).includes("ia") ||
      (lead.necesidades ?? []).includes("automatizacion"),
  });

  señales.push({
    clave: "instalacion_propia",
    etiqueta: "Quiere instalación en infraestructura propia",
    valor: lead.modalidad === "propia",
  });

  const empleados = Number.parseInt(lead.empleados ?? "0", 10) || 0;
  señales.push({
    clave: "varios_usuarios",
    etiqueta: "Varios usuarios",
    valor: empleados >= 51 || personasVentas >= 11,
  });

  señales.push({
    clave: "problemas_seguimiento",
    etiqueta: "Menciona problemas de seguimiento",
    valor: /seguimiento|estancad|olvid|recordar|enfr|escapa/i.test(
      lead.problema ?? "",
    ),
  });

  señales.push({
    clave: "automatizacion",
    etiqueta: "Menciona automatización",
    valor:
      (lead.necesidades ?? []).includes("automatizacion") ||
      /automatiz|repetitiv|manualmente/i.test(lead.problema ?? ""),
  });

  return señales;
};

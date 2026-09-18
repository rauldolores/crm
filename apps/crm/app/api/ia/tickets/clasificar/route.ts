import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { cuentaDeIaDeOrganizacion } from "@/lib/server/ia/configuracion";
import { generarConIa } from "@/lib/server/ia/proveedores";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Sugerencia de prioridad y categoría para un ticket a partir de su asunto
 * y descripción, usando las listas que la organización configuró en
 * Ajustes → Tickets. Devuelve valores de esas listas (nunca inventados) y
 * el porqué en una frase, para que quien captura decida.
 */

const MAX_TEXTO = 4000;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

interface Opcion {
  value: string;
  label: string;
}

const PRIORIDADES_DE_FABRICA: Opcion[] = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const instrucciones = (prioridades: Opcion[], categorias: Opcion[]) =>
  [
    "Eres el asistente de un equipo de soporte. Clasificas tickets de clientes.",
    "",
    "Prioridades posibles (valor = etiqueta), de menor a mayor urgencia:",
    ...prioridades.map((p) => `${p.value} = ${p.label}`),
    "",
    "Categorías posibles (valor = etiqueta):",
    ...(categorias.length
      ? categorias.map((c) => `${c.value} = ${c.label}`)
      : ["(ninguna: deja la categoría vacía)"]),
    "",
    "Devuelve SOLO un JSON válido con esta forma exacta:",
    '{"priority": "<valor de la lista>", "category": "<valor de la lista o cadena vacía>", "motivo": "<una frase en español de México, con tuteo>"}',
    "",
    "Criterio de prioridad: urgente si el cliente no puede operar o hay pérdida de dinero en curso; alta si algo importante no funciona pero hay alternativa; normal para dudas y peticiones habituales; baja para mejoras y consultas sin prisa. Usa SOLO valores de las listas.",
  ].join("\n");

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;
  const { organizacionId } = auth.sesion;

  const cuenta = await cuentaDeIaDeOrganizacion(organizacionId);
  if (!cuenta) {
    return esError(
      501,
      "No hay un proveedor de IA configurado. Configúralo en Ajustes → Inteligencia artificial.",
    );
  }

  const cuerpo = (await peticion.json().catch(() => null)) as {
    subject?: string;
    description?: string;
  } | null;
  const subject = (cuerpo?.subject ?? "").trim().slice(0, 300);
  const description = (cuerpo?.description ?? "").trim().slice(0, MAX_TEXTO);
  if (!subject && !description) {
    return esError(400, "Escribe el asunto o la descripción primero.");
  }

  const { data: configuracion } = await getServiceClient()
    .from("configuration")
    .select("config")
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const config = (configuracion?.config ?? {}) as {
    ticketPriorities?: Opcion[];
    ticketCategories?: Opcion[];
  };
  const prioridades = Array.isArray(config.ticketPriorities)
    ? config.ticketPriorities
    : PRIORIDADES_DE_FABRICA;
  const categorias = Array.isArray(config.ticketCategories)
    ? config.ticketCategories
    : [];

  const resultado = await generarConIa(
    cuenta,
    instrucciones(prioridades, categorias),
    `Asunto: ${subject}\n\nDescripción:\n${description}`,
  );
  if (!resultado.ok || !resultado.texto) {
    return esError(502, resultado.mensaje || "No se pudo clasificar.");
  }

  const sugerencia = extraerJson(resultado.texto);
  if (!sugerencia) {
    return esError(502, "La IA no devolvió una sugerencia que se pueda leer.");
  }
  // Solo valores de las listas: un valor inventado no existiría en Ajustes.
  const priority = prioridades.some((p) => p.value === sugerencia.priority)
    ? sugerencia.priority
    : null;
  const category = categorias.some((c) => c.value === sugerencia.category)
    ? sugerencia.category
    : null;
  return Response.json({ priority, category, motivo: sugerencia.motivo });
}

function extraerJson(
  texto: string,
): { priority: string; category: string; motivo: string } | null {
  const sinCerca = texto
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const inicio = sinCerca.indexOf("{");
  const fin = sinCerca.lastIndexOf("}");
  if (inicio === -1 || fin <= inicio) return null;
  try {
    const datos = JSON.parse(sinCerca.slice(inicio, fin + 1)) as Record<
      string,
      unknown
    >;
    return {
      priority: typeof datos.priority === "string" ? datos.priority : "",
      category: typeof datos.category === "string" ? datos.category : "",
      motivo: typeof datos.motivo === "string" ? datos.motivo : "",
    };
  } catch {
    return null;
  }
}

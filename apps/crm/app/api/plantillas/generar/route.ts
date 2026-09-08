import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { cuentaDeIaDeOrganizacion } from "@/lib/server/ia/configuracion";
import { generarConIa } from "@/lib/server/ia/proveedores";

/**
 * Genera el asunto y el cuerpo de una plantilla de correo a partir de una
 * descripción en lenguaje natural.
 *
 * El modelo recibe la lista EXACTA de campos de fusión disponibles en esta
 * organización y la instrucción de no inventar otros: un `{{contacto.movil}}`
 * inventado no se sustituiría al enviar y le llegaría al destinatario tal
 * cual, escrito entre llaves.
 *
 * Devuelve HTML, que es lo que edita la pantalla. Se sanea en el navegador
 * antes de pintarlo (ver la vista previa): lo que llega aquí es texto de un
 * tercero, por muy modelo de lenguaje que sea.
 */

const MAX_DESCRIPCION = 2000;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

const INSTRUCCIONES = `Eres un redactor de correos comerciales para un CRM. Escribes en español de México, con tuteo, en tono cercano y profesional, sin exagerar ni sonar a publicidad.

Devuelves SIEMPRE un JSON válido y nada más, con esta forma exacta:
{"asunto": "...", "html": "...", "ctaTexto": "...", "ctaUrl": "...", "colorPrincipal": "#2563eb", "pie": "..."}

IMPORTANTE — el diseño no lo pones tú: el CRM envuelve tu contenido en una
plantilla ya diseñada (tarjeta blanca centrada, cabecera con el logo del
cliente, franja de color, tipografía y espaciados cuidados, botón de verdad).
Tú aportas el CONTENIDO y las decisiones de diseño de los campos de abajo. Si
metieras tablas o estilos propios, romperías esa plantilla.

Reglas del campo "html" (el cuerpo):
- Solo estas etiquetas: <p>, <strong>, <em>, <ul>, <ol>, <li>, <a>, <h2>, <h3>, <blockquote>, <br>.
- NO uses <table>, <style>, <img>, atributos style ni clases.
- NO metas el logo: la plantilla lo coloca sola en la cabecera si el cliente subió uno.
- NO repitas dentro del cuerpo la llamada a la acción que ya pones en "ctaTexto": quedaría dos veces.
- Estructura recomendada: un <h2> que enganche, dos o tres párrafos CORTOS, y si aporta, una lista de 3 beneficios concretos. Un correo comercial se lee en diagonal.
- Cierra con una despedida breve.

Reglas de los demás campos:
- "ctaTexto": el texto del botón, 2 a 4 palabras, en imperativo ("Agenda tu demo", "Haz tu diagnóstico"). Cadena vacía si el correo no pide ninguna acción.
- "ctaUrl": a dónde lleva el botón. Si la acción es abrir algo que vive en un campo de fusión (por ejemplo un enlace de diagnóstico), pon AHÍ el campo entre dobles llaves. Cadena vacía si no hay botón.
- "colorPrincipal": color hexadecimal de 6 dígitos que pegue con el asunto del correo. Si te dan el logo del cliente, elige un color que combine con una marca sobria. Ante la duda: #2563eb.
- "pie": una línea corta de cierre para el pie (quién escribe, o una nota discreta). Cadena vacía si no aporta.

Reglas de los campos de fusión:
- Puedes usar SOLO los campos que se te indiquen, escritos tal cual entre dobles llaves.
- Está PROHIBIDO inventar campos que no estén en esa lista: no se sustituirían y el destinatario vería las llaves escritas.
- Saluda con el nombre del contacto si ese campo está disponible.`;

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
    descripcion?: string;
    logoUrl?: string;
    campos?: { clave: string; etiqueta: string }[];
  } | null;

  const descripcion = (cuerpo?.descripcion ?? "")
    .trim()
    .slice(0, MAX_DESCRIPCION);
  if (!descripcion) {
    return esError(400, "Describe qué quieres que diga el correo.");
  }

  const campos = Array.isArray(cuerpo?.campos)
    ? cuerpo.campos.slice(0, 100)
    : [];
  const listaDeCampos = campos.length
    ? campos.map((c) => `{{${c.clave}}} = ${c.etiqueta}`).join("\n")
    : "(esta organización no tiene campos disponibles: no uses ninguno)";

  const peticionAlModelo = [
    `Descripción del correo que hay que escribir:\n${descripcion}`,
    "",
    `Campos de fusión disponibles (los únicos que puedes usar):\n${listaDeCampos}`,
    cuerpo?.logoUrl ? `\nURL del logo: ${cuerpo.logoUrl}` : "",
  ].join("\n");

  const resultado = await generarConIa(cuenta, INSTRUCCIONES, peticionAlModelo);
  if (!resultado.ok || !resultado.texto) {
    return esError(
      502,
      resultado.mensaje || "No se pudo generar la plantilla.",
    );
  }

  const generado = extraerJson(resultado.texto);
  if (!generado) {
    return esError(
      502,
      "La IA no devolvió una plantilla que se pueda leer. Prueba a describirlo de otra forma.",
    );
  }

  return Response.json(generado);
}

/**
 * El JSON pedido, tolerando que el modelo lo envuelva en ```json … ``` o le
 * ponga una frase delante — pasa a menudo y no merece hacer fallar la
 * generación entera.
 */
interface PlantillaGenerada {
  asunto: string;
  html: string;
  ctaTexto?: string;
  ctaUrl?: string;
  colorPrincipal?: string;
  pie?: string;
}

function extraerJson(texto: string): PlantillaGenerada | null {
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
    if (typeof datos.asunto !== "string" || typeof datos.html !== "string") {
      return null;
    }
    // Los de diseño son opcionales: si el modelo se los salta, la plantilla
    // sigue siendo válida y toma los valores por defecto.
    const texto = (clave: string) =>
      typeof datos[clave] === "string" && datos[clave]
        ? (datos[clave] as string)
        : undefined;
    return {
      asunto: datos.asunto,
      html: datos.html,
      ctaTexto: texto("ctaTexto"),
      ctaUrl: texto("ctaUrl"),
      colorPrincipal: texto("colorPrincipal"),
      pie: texto("pie"),
    };
  } catch {
    return null;
  }
}

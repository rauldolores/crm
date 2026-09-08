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
{"asunto": "...", "html": "..."}

Reglas del HTML:
- Solo estas etiquetas: <p>, <strong>, <em>, <ul>, <ol>, <li>, <a>, <h2>, <br>, <img>.
- Nada de <script>, <style>, <table>, atributos de estilo ni clases: el CRM le da el formato al enviarlo.
- Párrafos cortos. Un correo comercial se lee en diagonal.
- Si te dan un logo, colócalo UNA vez al principio con <img src="LA_URL_DEL_LOGO">.

Reglas de los campos de fusión:
- Puedes usar SOLO los campos que se te indiquen, escritos tal cual entre dobles llaves.
- Está PROHIBIDO inventar campos que no estén en esa lista: no se sustituirían y el destinatario vería las llaves.
- Usa el saludo con el nombre del contacto si ese campo está disponible.`;

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
function extraerJson(texto: string): { asunto: string; html: string } | null {
  const sinCerca = texto
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const inicio = sinCerca.indexOf("{");
  const fin = sinCerca.lastIndexOf("}");
  if (inicio === -1 || fin <= inicio) return null;

  try {
    const datos = JSON.parse(sinCerca.slice(inicio, fin + 1)) as {
      asunto?: unknown;
      html?: unknown;
    };
    if (typeof datos.asunto !== "string" || typeof datos.html !== "string") {
      return null;
    }
    return { asunto: datos.asunto, html: datos.html };
  } catch {
    return null;
  }
}

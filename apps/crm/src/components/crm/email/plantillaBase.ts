/**
 * Envuelve el contenido de una plantilla en un correo con diseño.
 *
 * Por qué existe: lo que sale del editor es HTML semántico (`<p>`, `<h2>`,
 * `<ul>`), que en un cliente de correo se ve como un documento de texto sin
 * formato. Un correo presentable necesita otra cosa —tablas para el armazón
 * y estilos EN LÍNEA en cada etiqueta— porque Outlook de escritorio usa el
 * motor de Word y descarta las hojas de estilo, y Gmail recorta las etiquetas
 * `<style>`.
 *
 * Por qué el diseño NO vive en el editor: si el usuario editara las tablas y
 * los estilos, cualquier retoque los rompería, y el editor (TipTap con lo
 * básico) ni siquiera los conserva. Así que el editor guarda solo el
 * contenido, y el armazón se aplica aquí — al enviar y al pintar la vista
 * previa, con la misma función, para que lo que se ve sea lo que llega.
 */

export interface DisenoDeCorreo {
  /** Contenido del editor: HTML semántico. */
  contenidoHtml: string;
  logoUrl?: string | null;
  /** Color de los títulos, enlaces y el botón. */
  colorPrincipal?: string | null;
  /** Botón de llamada a la acción, si la plantilla lo lleva. */
  ctaTexto?: string | null;
  ctaUrl?: string | null;
  /** Aparece en el pie, para dar contexto de quién escribe. */
  piePersonalizado?: string | null;
}

export const COLOR_PRINCIPAL_POR_DEFECTO = "#2563eb";

/** Un color de verdad, para no meter cualquier cosa dentro de un `style`. */
const colorSeguro = (valor?: string | null): string =>
  valor && /^#[0-9a-fA-F]{6}$/.test(valor.trim())
    ? valor.trim()
    : COLOR_PRINCIPAL_POR_DEFECTO;

/**
 * Quita lo que nunca debe viajar en un correo. Los clientes de correo no
 * ejecutan scripts, así que esto no es la defensa contra XSS —esa es
 * DOMPurify en la vista previa, donde el HTML sí entra en el DOM de la
 * aplicación— pero un `<script>` colado en el cuerpo ensuciaría el mensaje.
 */
const limpiarContenido = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "");

/**
 * Estilos en línea para cada etiqueta que puede salir del editor. Se aplican
 * con una sustitución simple en vez de traer un «inliner» de CSS: son ocho
 * etiquetas y una dependencia menos que auditar.
 */
const estilosPorEtiqueta = (color: string): Record<string, string> => ({
  p: "margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#374151;",
  h1: `margin:0 0 16px 0;font-size:24px;line-height:1.3;color:${color};font-weight:700;`,
  h2: `margin:24px 0 12px 0;font-size:20px;line-height:1.3;color:${color};font-weight:600;`,
  h3: "margin:20px 0 8px 0;font-size:17px;line-height:1.4;color:#111827;font-weight:600;",
  ul: "margin:0 0 16px 0;padding-left:22px;font-size:16px;line-height:1.6;color:#374151;",
  ol: "margin:0 0 16px 0;padding-left:22px;font-size:16px;line-height:1.6;color:#374151;",
  li: "margin:0 0 6px 0;",
  blockquote: `margin:0 0 16px 0;padding:8px 0 8px 16px;border-left:3px solid ${color};color:#4b5563;font-style:italic;`,
  a: `color:${color};text-decoration:underline;`,
  img: "max-width:100%;height:auto;display:block;border:0;",
  strong: "font-weight:600;color:#111827;",
});

const aplicarEstilos = (html: string, color: string): string => {
  let resultado = html;
  for (const [etiqueta, estilo] of Object.entries(estilosPorEtiqueta(color))) {
    // Solo a las etiquetas que aún no traen su propio `style`, para no pisar
    // lo que el usuario haya puesto a mano.
    const patron = new RegExp(
      `<${etiqueta}(?![a-zA-Z-])((?:(?!style=)[^>])*)>`,
      "gi",
    );
    resultado = resultado.replace(
      patron,
      (_original, atributos) => `<${etiqueta}${atributos} style="${estilo}">`,
    );
  }
  return resultado;
};

const escaparAtributo = (valor: string): string =>
  valor.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const escaparTexto = (valor: string): string =>
  valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** El correo completo, listo para enviarse. */
export function envolverEnPlantilla({
  contenidoHtml,
  logoUrl,
  colorPrincipal,
  ctaTexto,
  ctaUrl,
  piePersonalizado,
}: DisenoDeCorreo): string {
  const color = colorSeguro(colorPrincipal);
  const contenido = aplicarEstilos(limpiarContenido(contenidoHtml), color);

  const cabecera = logoUrl
    ? `<tr><td align="center" style="padding:32px 40px 8px 40px;">
            <img src="${escaparAtributo(logoUrl)}" alt="" style="max-height:56px;max-width:220px;height:auto;display:block;border:0;">
          </td></tr>`
    : "";

  // El botón se arma con una tabla y no con un <a> suelto: es la única forma
  // de que Outlook le respete el fondo y el relleno.
  const boton =
    ctaTexto && ctaUrl
      ? `<tr><td align="center" style="padding:8px 40px 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center" bgcolor="${color}" style="border-radius:6px;">
                <a href="${escaparAtributo(ctaUrl)}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${escaparTexto(ctaTexto)}</a>
              </td></tr>
            </table>
          </td></tr>`
      : "";

  const pie = piePersonalizado
    ? `<tr><td align="center" style="padding:0 40px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.5;color:#9ca3af;">
            ${escaparTexto(piePersonalizado)}
          </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;">
        <tr><td style="height:4px;background-color:${color};font-size:0;line-height:0;">&nbsp;</td></tr>
        ${cabecera}
        <tr><td style="padding:24px 40px 8px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          ${contenido}
        </td></tr>
        ${boton}
        ${pie}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

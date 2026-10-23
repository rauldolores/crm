/**
 * Separa lo que escribió alguien de lo que citó del correo anterior: casi
 * toda respuesta arrastra el hilo entero debajo, y en la bandeja se lee
 * mejor plegado.
 */

// «El jue, 23 oct 2026 a las 10:02, Ana <a@x> escribió:», «On … wrote:»,
// las rayas de Outlook y la primera línea citada con «>».
const INICIO_DE_CITA =
  /^(>|-{2,}\s*(original message|mensaje original)|(el|on)\s.+(escribió|wrote):\s*$|de:\s.+|from:\s.+)/i;

export const separarCita = (
  texto: string,
): { propio: string; citado: string | null } => {
  const lineas = texto.split(/\r?\n/);
  const inicio = lineas.findIndex((linea) => INICIO_DE_CITA.test(linea.trim()));
  if (inicio === -1) return { propio: texto.trim(), citado: null };
  const propio = lineas.slice(0, inicio).join("\n").trim();
  // Si todo era cita, se muestra entero: mejor de más que una burbuja vacía.
  if (!propio) return { propio: texto.trim(), citado: null };
  return { propio, citado: lineas.slice(inicio).join("\n").trim() };
};

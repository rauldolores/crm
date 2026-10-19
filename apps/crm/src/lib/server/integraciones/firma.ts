import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Firma de los avisos de KontrolIA Auth:
 * `X-Kontrolia-Signature: t=<unix>,v1=<hex HMAC-SHA256(secreto, "<t>.<cuerpo>")>`.
 *
 * Se verifica contra el cuerpo CRUDO tal como llegó: KontrolIA Auth firma el
 * JSON como lo serializa Postgres (`jsonb::text`), y volver a serializarlo
 * aquí cambiaría espacios y orden, y ninguna firma cuadraría.
 *
 * La tolerancia (300 s) evita que alguien que capturó un aviso válido lo
 * reenvíe días después.
 */
export function firmaValida(
  cuerpo: string,
  encabezado: string | null | undefined,
  secreto: string,
  toleranciaSeg = 300,
  ahoraMs = Date.now(),
): boolean {
  if (!encabezado || !secreto) return false;

  const partes = new Map<string, string>();
  for (const parte of encabezado.split(",")) {
    const igual = parte.indexOf("=");
    if (igual > 0) {
      partes.set(parte.slice(0, igual).trim(), parte.slice(igual + 1).trim());
    }
  }

  const t = partes.get("t");
  const v1 = partes.get("v1");
  if (!t || !v1 || !/^\d+$/.test(t) || !/^[0-9a-f]+$/i.test(v1)) return false;
  if (Math.abs(ahoraMs / 1000 - Number(t)) > toleranciaSeg) return false;

  const esperado = createHmac("sha256", secreto)
    .update(`${t}.${cuerpo}`)
    .digest("hex");
  const recibido = v1.toLowerCase();
  if (recibido.length !== esperado.length) return false;
  return timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
}

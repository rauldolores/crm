import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Firma de los avisos de Resend (los firma con Svix).
 *
 * Cabeceras: `svix-id`, `svix-timestamp` (segundos unix) y `svix-signature`
 * («v1,<base64>», varias separadas por espacio cuando el secreto se acaba
 * de rotar). La firma es HMAC-SHA256 de «<id>.<timestamp>.<cuerpo>» con el
 * secreto «whsec_<base64>» decodificado.
 *
 * Con node:crypto y no con el paquete de Svix: son diez líneas, y un paquete
 * más es una dependencia más que auditar.
 */

/** Cuánto puede tardar un aviso en llegar antes de tomarlo por repetido. */
const TOLERANCIA_SEGUNDOS = 300;

export interface CabecerasDeFirma {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

export const firmaDeResendValida = (
  cuerpo: string,
  cabeceras: CabecerasDeFirma,
  secreto: string,
  ahora: Date = new Date(),
): boolean => {
  const { id, timestamp, signature } = cabeceras;
  if (!id || !timestamp || !signature || !secreto) return false;

  const segundos = Number(timestamp);
  if (
    !Number.isFinite(segundos) ||
    Math.abs(ahora.getTime() / 1000 - segundos) > TOLERANCIA_SEGUNDOS
  ) {
    return false;
  }

  const clave = Buffer.from(secreto.replace(/^whsec_/, ""), "base64");
  const esperada = createHmac("sha256", clave)
    .update(`${id}.${timestamp}.${cuerpo}`)
    .digest();

  return signature.split(" ").some((parte) => {
    const [version, valor] = parte.split(",");
    if (version !== "v1" || !valor) return false;
    const recibida = Buffer.from(valor, "base64");
    return (
      recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
    );
  });
};

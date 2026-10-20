import { createHash, timingSafeEqual } from "node:crypto";

import { procesarFacturacion } from "@/lib/server/facturacion/procesar";

/**
 * Proceso de cada hora del módulo de facturación: arma las facturas de los
 * contratos, timbra las aprobadas y pregunta a Faqturia por las que siguen
 * sin pagar (ver procesar.ts).
 *
 * La despierta la base (crm.despachar_facturacion, pg_cron cada hora). No
 * lleva sesión: la autentica un secreto compartido, FACTURACION_CRON_SECRET,
 * que debe valer lo mismo que `billing_cron_secret` en crm.internal_settings.
 * Sin secreto configurado no hace nada.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

/** Compara sin filtrar por el tiempo cuántos caracteres coinciden. */
const iguales = (a: string, b: string): boolean => {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
};

export async function POST(peticion: Request) {
  const secreto = process.env.FACTURACION_CRON_SECRET ?? "";
  if (!secreto) {
    return Response.json(
      {
        message:
          "El proceso de facturación no está configurado: falta FACTURACION_CRON_SECRET en el servidor.",
      },
      { status: 503 },
    );
  }
  const recibido = peticion.headers.get("x-vinqulia-facturacion") ?? "";
  if (!recibido || !iguales(recibido, secreto)) {
    return Response.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const organizaciones = await procesarFacturacion();
    return Response.json({ ok: true, organizaciones });
  } catch (error) {
    console.error("[facturación] proceso", error);
    return Response.json(
      { message: "No se pudo correr el proceso de facturación." },
      { status: 500 },
    );
  }
}

import { z } from "zod";

import {
  aceptarCotizacion,
  rechazarCotizacion,
} from "@/lib/server/cotizaciones/aceptar";

/**
 * Acciones desde el enlace público de una cotización: aceptar o rechazar.
 * Sin sesión, a propósito —quien recibe la cotización nunca ha entrado al
 * CRM—; el token de 64 hex es la única llave y solo abre esta cotización.
 */

const Cuerpo = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("aceptar"),
    nombre: z.string().trim().min(2).max(200),
    correo: z.string().trim().email().max(200),
  }),
  z.object({
    accion: z.literal("rechazar"),
    motivo: z.string().trim().max(1000).optional().default(""),
  }),
]);

type Contexto = { params: Promise<{ token: string }> };

export async function POST(peticion: Request, { params }: Contexto) {
  const { token } = await params;
  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }

  const resultado =
    cuerpo.data.accion === "aceptar"
      ? await aceptarCotizacion(token, {
          nombre: cuerpo.data.nombre,
          correo: cuerpo.data.correo,
        })
      : await rechazarCotizacion(token, cuerpo.data.motivo);

  if (!resultado.ok) {
    return Response.json(
      { message: resultado.mensaje },
      { status: resultado.status },
    );
  }
  return Response.json({ ok: true, status: resultado.cotizacion.status });
}

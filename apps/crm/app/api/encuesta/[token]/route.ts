import { z } from "zod";

import { registrarSatisfaccion } from "@/lib/server/tickets/encuesta";

/**
 * Respuesta a la encuesta de satisfacción de un ticket, desde su enlace
 * público. Sin sesión, a propósito: quien responde es el cliente, que nunca
 * ha entrado al CRM; el token solo abre esta encuesta.
 */

const Cuerpo = z.object({
  rating: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional().default(""),
});

type Contexto = { params: Promise<{ token: string }> };

export async function POST(peticion: Request, { params }: Contexto) {
  const { token } = await params;
  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }
  const resultado = await registrarSatisfaccion(
    token,
    cuerpo.data.rating,
    cuerpo.data.comentario,
  );
  if (!resultado.ok) {
    return Response.json(
      { message: resultado.mensaje },
      { status: resultado.status },
    );
  }
  return Response.json({ ok: true });
}

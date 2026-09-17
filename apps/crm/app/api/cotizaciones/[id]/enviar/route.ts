import { z } from "zod";

import { cotizacionPorId } from "@/lib/server/cotizaciones/cotizaciones";
import { enviarCotizacion } from "@/lib/server/cotizaciones/enviar";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";

/**
 * Envía una cotización por correo con su enlace público. Con sesión: solo
 * alguien de la organización dueña puede mandarla, y el origen de esta
 * misma petición es el que se usa para armar el enlace.
 */

const Cuerpo = z.object({
  para: z.string().email().optional(),
  templateId: z.number().int().positive().optional().nullable(),
  mensaje: z.string().max(2000).optional(),
});

type Contexto = { params: Promise<{ id: string }> };

export async function POST(peticion: Request, { params }: Contexto) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => ({})));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }

  const completa = await cotizacionPorId(auth.sesion.organizacionId, id);
  if (!completa) {
    return Response.json({ message: "No encontrada." }, { status: 404 });
  }

  const resultado = await enviarCotizacion(completa, {
    origen: new URL(peticion.url).origin,
    para: cuerpo.data.para,
    templateId: cuerpo.data.templateId ?? null,
    mensaje: cuerpo.data.mensaje,
  });
  if (!resultado.ok) {
    return Response.json(
      { message: resultado.mensaje },
      { status: resultado.status },
    );
  }
  return Response.json({
    ok: true,
    enlace: resultado.enlace,
    para: resultado.para,
  });
}

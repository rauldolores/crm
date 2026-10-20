import { z } from "zod";

import {
  aprobarFactura,
  descartarFactura,
  reintentarFactura,
} from "@/lib/server/facturacion/acciones";
import {
  responderError,
  sesionDeFacturacion,
} from "@/lib/server/facturacion/rutas";

/**
 * Lo que se hace con una factura de la bandeja «Por facturar»:
 *   - aprobar: revisada → se timbra en el mismo paso.
 *   - reintentar: una con error vuelve a intentarse.
 *   - descartar: no se va a timbrar (con motivo).
 * Solo administradores. La tenencia la comprueba cada acción (busca por
 * organización).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const Cuerpo = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("aprobar") }),
  z.object({ accion: z.literal("reintentar") }),
  z.object({
    accion: z.literal("descartar"),
    motivo: z.string().max(500),
  }),
]);

type Contexto = { params: Promise<{ id: string }> };

export async function POST(peticion: Request, { params }: Contexto) {
  const auth = await sesionDeFacturacion(peticion, { admin: true });
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const facturaId = Number(id);
  if (!Number.isInteger(facturaId) || facturaId <= 0) {
    return Response.json({ message: "Factura no válida." }, { status: 400 });
  }
  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => ({})));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }
  const org = auth.sesion.organizacionId;
  try {
    switch (cuerpo.data.accion) {
      case "aprobar": {
        const { factura, mensaje } = await aprobarFactura(
          org,
          facturaId,
          auth.sesion.usuarioId,
        );
        return Response.json({ factura, mensaje });
      }
      case "reintentar": {
        const { factura, mensaje } = await reintentarFactura(org, facturaId);
        return Response.json({ factura, mensaje });
      }
      case "descartar": {
        const factura = await descartarFactura(
          org,
          facturaId,
          cuerpo.data.motivo,
        );
        return Response.json({ factura, mensaje: null });
      }
    }
  } catch (error) {
    return responderError(error);
  }
}

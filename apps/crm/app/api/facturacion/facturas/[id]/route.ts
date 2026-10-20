import { z } from "zod";

import { renovarAcceso } from "@/lib/server/facturacion/acceso";
import {
  aprobarFactura,
  descartarFactura,
  registrarPago,
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
 *   - registrar_pago: una timbrada se pagó fuera de Faqturia; queda pagada
 *     y, si es de un contrato de KontrolIA Auth por transferencia, se pide
 *     en el mismo paso renovar su acceso.
 *   - renovar_acceso: «Reintentar» la renovación del acceso en KontrolIA
 *     Auth de una factura pagada (pendiente, con error u omitida).
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
  z.object({
    accion: z.literal("registrar_pago"),
    pagada_el: z.string().min(1).max(40),
    referencia: z.string().max(200).nullish(),
  }),
  z.object({ accion: z.literal("renovar_acceso") }),
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
      case "registrar_pago": {
        const factura = await registrarPago(org, facturaId, {
          pagadaEl: cuerpo.data.pagada_el,
          referencia: cuerpo.data.referencia,
        });
        if (factura.access_status !== "pending") {
          return Response.json({ factura, mensaje: null });
        }
        // El pago ya quedó; si la renovación falla aquí, la factura queda
        // «con error» y el proceso de cada hora la reintenta.
        const renovada = await renovarAcceso(org, facturaId).catch(
          (error: unknown) => {
            console.error("[facturación] acceso sin renovar", facturaId, error);
            return { factura, mensaje: null };
          },
        );
        return Response.json(renovada);
      }
      case "renovar_acceso": {
        const { factura, mensaje } = await renovarAcceso(org, facturaId, {
          manual: true,
        });
        return Response.json({ factura, mensaje });
      }
    }
  } catch (error) {
    return responderError(error);
  }
}

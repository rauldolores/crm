import { z } from "zod";

import { facturarCotizacion } from "@/lib/server/conectores/facturas";
import {
  responderError,
  sesionDeConectores,
} from "@/lib/server/conectores/rutas";

/**
 * Factura una cotización aceptada con el proveedor conectado. La tenencia
 * de la cotización la comprueba facturarCotizacion (busca por organización).
 */

const Cuerpo = z.object({
  quoteId: z.number().int().positive(),
  receptor: z.object({
    razonSocial: z.string().max(300),
    rfc: z.string().max(13),
    regimenFiscal: z.string().max(3),
    usoCfdi: z.string().max(4),
    codigoPostal: z.string().max(5),
    email: z.string().max(200).optional().nullable(),
  }),
  formaPago: z.string().max(2).optional(),
  metodoPago: z.string().max(3).optional(),
});

export async function POST(peticion: Request) {
  const auth = await sesionDeConectores(peticion, { admin: false });
  if (!auth.ok) return auth.response;
  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => ({})));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }
  try {
    const factura = await facturarCotizacion(
      auth.sesion.organizacionId,
      cuerpo.data.quoteId,
      cuerpo.data.receptor,
      {
        formaPago: cuerpo.data.formaPago,
        metodoPago: cuerpo.data.metodoPago,
      },
    );
    return Response.json({ factura }, { status: 201 });
  } catch (error) {
    return responderError(error);
  }
}

import { z } from "zod";

import { aprobarSiSePuede } from "@/lib/server/facturacion/acciones";
import {
  cambiarFacturacionDelContrato,
  facturarContratoAhora,
} from "@/lib/server/facturacion/contratos";
import {
  responderError,
  sesionDeFacturacion,
} from "@/lib/server/facturacion/rutas";

/**
 * Facturación de un contrato, desde la ficha del cliente:
 *   - PATCH {billing_enabled}: enciende o apaga «Facturar automáticamente».
 *     El puente /api/datos no deja cambiar ese campo: solo esta ruta, que
 *     exige administrador.
 *   - POST {accion: "facturar_ahora"}: arma la factura del periodo que sigue
 *     sin esperar la fecha y, si los datos fiscales están completos, la
 *     timbra en el mismo paso.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

type Contexto = { params: Promise<{ id: string }> };

const idDe = async ({ params }: Contexto) => {
  const { id } = await params;
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
};

const CuerpoDeCambio = z.object({ billing_enabled: z.boolean() });

export async function PATCH(peticion: Request, contexto: Contexto) {
  const auth = await sesionDeFacturacion(peticion, { admin: true });
  if (!auth.ok) return auth.response;
  const id = await idDe(contexto);
  const cuerpo = CuerpoDeCambio.safeParse(
    await peticion.json().catch(() => ({})),
  );
  if (!id || !cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }
  try {
    const contrato = await cambiarFacturacionDelContrato(
      auth.sesion.organizacionId,
      id,
      cuerpo.data.billing_enabled,
    );
    return Response.json({ contrato });
  } catch (error) {
    return responderError(error);
  }
}

const CuerpoDeAccion = z.object({ accion: z.literal("facturar_ahora") });

export async function POST(peticion: Request, contexto: Contexto) {
  const auth = await sesionDeFacturacion(peticion, { admin: true });
  if (!auth.ok) return auth.response;
  const id = await idDe(contexto);
  const cuerpo = CuerpoDeAccion.safeParse(
    await peticion.json().catch(() => ({})),
  );
  if (!id || !cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }
  const org = auth.sesion.organizacionId;
  try {
    const { factura: armada, creada } = await facturarContratoAhora(org, id);
    const { factura, mensaje } = await aprobarSiSePuede(
      org,
      armada,
      auth.sesion.usuarioId,
    );
    return Response.json({ factura, creada, mensaje });
  } catch (error) {
    return responderError(error);
  }
}

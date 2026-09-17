import { z } from "zod";

import {
  aceptarCotizacion,
  rechazarCotizacion,
} from "@/lib/server/cotizaciones/aceptar";
import { cotizacionPorId } from "@/lib/server/cotizaciones/cotizaciones";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Marcar una cotización como aceptada o rechazada desde el propio CRM,
 * cuando el cliente respondió por otro medio (una llamada, un correo). Queda
 * registrado quién del equipo lo marcó, y pasan los mismos efectos que si
 * el cliente hubiera pulsado «Aceptar» en su enlace.
 */

const Cuerpo = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("aceptar") }),
  z.object({
    accion: z.literal("rechazar"),
    motivo: z.string().trim().max(1000).optional().default(""),
  }),
]);

type Contexto = { params: Promise<{ id: string }> };

export async function POST(peticion: Request, { params }: Contexto) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }

  const { organizacionId, usuarioId } = auth.sesion;
  const completa = await cotizacionPorId(organizacionId, id);
  if (!completa) {
    return Response.json({ message: "No encontrada." }, { status: 404 });
  }

  const { data: ficha } = await getServiceClient()
    .from("sales")
    .select("first_name, last_name, email")
    .eq("organization_id", organizacionId)
    .eq("user_id", usuarioId)
    .maybeSingle();
  const quien = ficha
    ? `${ficha.first_name} ${ficha.last_name ?? ""}`.trim()
    : "Equipo";

  const token = completa.cotizacion.public_token;
  const resultado =
    cuerpo.data.accion === "aceptar"
      ? await aceptarCotizacion(token, {
          nombre: `${quien} (acordado por otro medio)`,
          correo: (ficha?.email as string | null) ?? "",
        })
      : await rechazarCotizacion(
          token,
          cuerpo.data.motivo || `Marcada como rechazada por ${quien}.`,
        );

  if (!resultado.ok) {
    return Response.json(
      { message: resultado.mensaje },
      { status: resultado.status },
    );
  }
  return Response.json({ ok: true, status: resultado.cotizacion.status });
}

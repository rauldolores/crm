import { z } from "zod";

import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";
import { hoyEnMexico, primerError } from "@/lib/soporteTiempos";

const peticionSchema = z.object({
  companyId: z.number().int().positive(),
  /** AAAA-MM; por omisión, el mes en curso en hora de México. */
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "El mes va como AAAA-MM.")
    .nullish(),
});

/**
 * Bolsa de soporte de una empresa en un mes (crm.soporte_resumen): minutos
 * incluidos, usados, de más y los que no consumen. La función corre con la
 * clave de servicio, que salta el RLS, así que la empresa se comprueba aquí
 * contra la organización de la sesión.
 */
export async function POST(peticion: Request) {
  const validacion = peticionSchema.safeParse(
    await peticion
      .clone()
      .json()
      .catch(() => null),
  );
  if (!validacion.success) {
    return Response.json(
      { message: primerError(validacion.error) },
      { status: 400 },
    );
  }
  const { companyId, mes } = validacion.data;

  const auth = await requireKontroliaPermission(peticion, [], {
    tabla: "companies",
    id: companyId,
  });
  if (!auth.ok) return auth.response;

  const { data, error } = await getServiceClient()
    .rpc("soporte_resumen", {
      p_company_id: companyId,
      p_mes: `${mes ?? hoyEnMexico().slice(0, 7)}-01`,
    })
    .maybeSingle();
  if (error || !data) {
    return Response.json(
      { message: "No se pudo calcular el resumen de soporte." },
      { status: 500 },
    );
  }
  return Response.json(data);
}

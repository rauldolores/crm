import { env } from "@/lib/env";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Sincroniza el directorio de la organización de KontrolIA Auth con la tabla
 * `sales` del CRM, para que "responsable de venta" pueda ofrecer también a
 * quienes pertenecen a la organización pero nunca han entrado al CRM (la
 * ficha de `sales` se crea al primer acceso, ver /api/crm/aprovisionar).
 *
 * Vive en el servidor por dos razones:
 * - El endpoint de miembros del auth-server no acepta llamadas del navegador
 *   (CORS); de servidor a servidor no hay esa barrera.
 * - Dar de alta las fichas exige escribir en `sales` con la clave de
 *   servicio, imponiendo la organización del token.
 *
 * Idempotente: los miembros que ya tienen ficha se ignoran.
 */
export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  // Instalación sin auth-server configurado: la función queda inerte en vez
  // de romper el selector, que seguirá ofreciendo las fichas locales.
  if (!env.kontroliaAuthServerUrl) {
    return Response.json({ total: 0, agregados: 0 });
  }

  const { organizacionId } = auth.sesion;
  const datos = (await peticion.json().catch(() => ({}))) as {
    buscar?: string;
  };

  // Mismo contrato que usa el SDK (@kontrolia/auth): GET con Bearer, y la
  // respuesta trae { members: [{ userId, email, name }], hasMore, total }.
  const parametros = new URLSearchParams({ organizationId: organizacionId });
  if (datos.buscar) parametros.set("search", datos.buscar);

  const respuesta = await fetch(
    `${env.kontroliaAuthServerUrl.replace(/\/$/, "")}/api/organization-members?${parametros}`,
    { headers: { Authorization: peticion.headers.get("authorization") ?? "" } },
  ).catch(() => null);

  if (!respuesta?.ok) {
    return Response.json(
      { message: "No se pudo consultar el directorio de la organización." },
      { status: 502 },
    );
  }

  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    members?: { userId: string; email: string; name: string | null }[];
  };
  const miembros = cuerpo.members ?? [];

  const supabase = getServiceClient();
  const { data: fichas } = await supabase
    .from("sales")
    .select("user_id")
    .eq("organization_id", organizacionId);

  const idsConFicha = new Set((fichas ?? []).map((f) => f.user_id));
  const sinFicha = miembros.filter(
    (miembro) =>
      miembro.userId && miembro.email && !idsConFicha.has(miembro.userId),
  );

  if (sinFicha.length === 0) {
    return Response.json({ total: miembros.length, agregados: 0 });
  }

  const { error } = await supabase.from("sales").upsert(
    sinFicha.map((miembro) => {
      // KontrolIA Auth guarda el nombre completo en un solo campo; el CRM lo
      // separa en dos. Se parte por el primer espacio, como en aprovisionar.
      const [primerNombre, ...resto] = (miembro.name ?? "").trim().split(/\s+/);
      return {
        organization_id: organizacionId,
        user_id: miembro.userId,
        email: miembro.email,
        first_name: primerNombre || "Pendiente",
        last_name: resto.join(" "),
        administrator: false,
      };
    }),
    { onConflict: "organization_id,user_id", ignoreDuplicates: true },
  );

  if (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }

  return Response.json({ total: miembros.length, agregados: sinFicha.length });
}

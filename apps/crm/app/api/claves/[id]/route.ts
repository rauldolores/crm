import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

type Contexto = { params: Promise<{ id: string }> };

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

async function autorizar(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return { ok: false as const, response: auth.response };

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return {
      ok: false as const,
      response: esError(
        403,
        "Solo un administrador puede modificar claves de API.",
      ),
    };
  }
  return { ok: true as const, organizacionId };
}

export async function PATCH(peticion: Request, { params }: Contexto) {
  const auth = await autorizar(peticion);
  if (!auth.ok) return auth.response;

  const cuerpo = await peticion.json().catch(() => null);
  if (typeof cuerpo?.active !== "boolean") {
    return esError(400, "Falta el campo active.");
  }

  const { id } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .update({ active: cuerpo.active })
    .eq("id", id)
    .eq("organization_id", auth.organizacionId)
    .select("id")
    .maybeSingle();

  if (error) return esError(500, error.message);
  if (!data) return esError(404, "No encontrada.");
  return Response.json({ ok: true });
}

export async function DELETE(peticion: Request, { params }: Contexto) {
  const auth = await autorizar(peticion);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizacionId)
    .select("id")
    .maybeSingle();

  if (error) return esError(500, error.message);
  if (!data) return esError(404, "No encontrada.");
  return Response.json({ ok: true });
}

import { FormularioPublico } from "@/components/crm/public/FormularioPublico";
import { getServiceClient } from "@/lib/server/supabase-service";

type Props = { params: Promise<{ clave: string }> };

/**
 * Página pública de un formulario de captación. Sin ra-core, sin sesión: la
 * visita un desconocido en la web del cliente, a veces dentro de un iframe.
 * Se resuelve server-side con la clave de servicio para no tener que llamar
 * a la ruta /api desde aquí — es la misma base de datos, un salto menos.
 */
export default async function PaginaDeFormulario({ params }: Props) {
  const { clave } = await params;
  const supabase = getServiceClient();

  const { data: formulario } = await supabase
    .from("public_forms")
    .select("organization_id, active")
    .eq("slug", clave)
    .maybeSingle();

  if (!formulario || !formulario.active) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-center text-muted-foreground">
          Este formulario no está disponible.
        </p>
      </div>
    );
  }

  const { data: fila } = await supabase
    .from("configuration")
    .select("config")
    .eq("organization_id", formulario.organization_id)
    .maybeSingle();

  const titulo =
    (fila?.config as { title?: string } | null)?.title?.trim() || "Vinqulia";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <FormularioPublico clave={clave} titulo={titulo} />
    </div>
  );
}

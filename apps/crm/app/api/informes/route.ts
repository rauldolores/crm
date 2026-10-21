import {
  COLUMNAS_DE_INFORMES,
  type DatosDeInformes,
} from "@/components/crm/providers/commons/datosDeInformes";
import { afiliadoDeLaSesion } from "@/lib/server/afiliadoDeLaSesion";
import { leerPorPaginas } from "@/lib/server/informes/leerPorPaginas";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Datos de la página de Informes: todas las filas de la organización, no
 * las primeras mil. Ver DatosDeInformes.
 *
 * Como el puente de datos (/api/datos), consulta con la clave de servicio e
 * impone aquí la organización de la sesión en cada tabla; y a un afiliado
 * vinculado solo le cuenta sus propias oportunidades (CON_SOLO_PROPIOS).
 */
export async function GET(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  const supabase = getServiceClient();
  const salesIdDelAfiliado = await afiliadoDeLaSesion(
    organizacionId,
    usuarioId,
  );

  const deLaOrganizacion = <T>(tabla: string, columnas: string) =>
    leerPorPaginas<T>((desde, hasta) => {
      let consulta = supabase
        .from(tabla)
        .select(columnas)
        .eq("organization_id", organizacionId);
      if (tabla === "deals" && salesIdDelAfiliado != null) {
        consulta = consulta.eq("sales_id", salesIdDelAfiliado);
      }
      return consulta.order("id").range(desde, hasta).returns<T[]>();
    });

  try {
    const [
      oportunidades,
      cotizaciones,
      tickets,
      reaperturas,
      tareas,
      notasDeContacto,
      notasDeOportunidad,
    ] = await Promise.all([
      deLaOrganizacion<DatosDeInformes["oportunidades"][number]>(
        "deals",
        COLUMNAS_DE_INFORMES.deals,
      ),
      deLaOrganizacion<DatosDeInformes["cotizaciones"][number]>("quotes", "*"),
      deLaOrganizacion<DatosDeInformes["tickets"][number]>("tickets", "*"),
      leerPorPaginas<DatosDeInformes["reaperturas"][number]>((desde, hasta) =>
        supabase
          .from("ticket_events")
          .select("*")
          .eq("organization_id", organizacionId)
          .eq("field", "status")
          .eq("old_value", "closed")
          .order("id")
          .range(desde, hasta),
      ),
      deLaOrganizacion<DatosDeInformes["tareas"][number]>(
        "tasks",
        COLUMNAS_DE_INFORMES.tasks,
      ),
      deLaOrganizacion<DatosDeInformes["notas"][number]>(
        "contact_notes",
        COLUMNAS_DE_INFORMES.notas,
      ),
      deLaOrganizacion<DatosDeInformes["notas"][number]>(
        "deal_notes",
        COLUMNAS_DE_INFORMES.notas,
      ),
    ]);

    const datos: DatosDeInformes = {
      oportunidades,
      cotizaciones,
      tickets,
      reaperturas,
      tareas,
      notas: [...notasDeContacto, ...notasDeOportunidad],
    };
    return Response.json(datos);
  } catch (error) {
    console.error("GET /api/informes", error);
    return Response.json(
      { message: "No se pudieron calcular los informes." },
      { status: 500 },
    );
  }
}

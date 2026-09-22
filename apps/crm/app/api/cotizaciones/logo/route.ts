import { esAdministradorDeOrganizacion } from "@/lib/server/apiKeys";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Sube el logo del emisor de cotizaciones y devuelve su dirección pública.
 *
 * Antes había que pegar una URL, lo que obligaba a tener el logo publicado
 * en algún sitio: quien no tiene página web no tenía de dónde sacarla. Aquí
 * se sube el archivo y el CRM lo guarda en su propio almacenamiento.
 *
 * PNG o JPG a propósito: son los que sabe pintar el generador de PDF
 * (@react-pdf/renderer). Un SVG o un WebP se verían en la página pública
 * pero dejarían el PDF sin logo, que es peor que no aceptarlos.
 */

const TIPOS = ["image/png", "image/jpeg"];
const MAX_BYTES = 2 * 1024 * 1024;
const BUCKET = process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET || "attachments";

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const { organizacionId, usuarioId } = auth.sesion;
  if (!(await esAdministradorDeOrganizacion(organizacionId, usuarioId))) {
    return esError(403, "Solo un administrador puede cambiar el logo.");
  }

  const formulario = await peticion.formData().catch(() => null);
  const archivo = formulario?.get("archivo");
  if (!(archivo instanceof File)) {
    return esError(400, "Elige un archivo de imagen.");
  }
  if (!TIPOS.includes(archivo.type)) {
    return esError(400, "El logo debe ser un PNG o un JPG.");
  }
  if (archivo.size > MAX_BYTES) {
    return esError(400, "El logo no puede pesar más de 2 MB.");
  }

  const extension = archivo.type === "image/png" ? "png" : "jpg";
  // El nombre lleva la organización y un aleatorio: así un logo nuevo nunca
  // se sirve cacheado en lugar del anterior, y nadie adivina el de otra.
  const ruta = `${organizacionId}/cotizaciones/logo-${crypto.randomUUID()}.${extension}`;

  const supabase = getServiceClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, await archivo.arrayBuffer(), {
      contentType: archivo.type,
      upsert: false,
    });
  if (error) {
    return esError(500, "No se pudo guardar el logo. Inténtalo de nuevo.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(ruta);

  return Response.json({ url: publicUrl });
}

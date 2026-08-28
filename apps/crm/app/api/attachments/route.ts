import { ATTACHMENTS_BUCKET } from "@/components/crm/providers/commons/attachments";
import { autenticarPuente } from "@/lib/server/autenticarPuente";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Sube un archivo adjunto (para contact_notes / deal_notes / ticket_notes) y
 * devuelve el objeto listo para incluir en la columna `attachments`.
 *
 * Fuera de /api/datos a propósito: subir un archivo no es una operación de
 * PostgREST (necesita bytes, no JSON), así que va en base64 en el cuerpo. El
 * puente genérico reenvía el cuerpo con `Request.text()`, que corrompería
 * bytes binarios; aquí se decodifica explícitamente con `Buffer.from`.
 *
 * Autenticación: la misma que /api/datos (sesión de KontrolIA Auth o clave
 * de API `vnq_...`), así que cualquier integración que ya puede crear una
 * nota puede además adjuntarle un archivo.
 */

const LIMITE_BYTES = 10 * 1024 * 1024; // 10 MB

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

export async function POST(peticion: Request) {
  const auth = await autenticarPuente(peticion);
  if (!auth.ok) return auth.response;

  const cuerpo = await peticion.json().catch(() => null);
  const filename =
    typeof cuerpo?.filename === "string" ? cuerpo.filename.trim() : "";
  const contentType =
    typeof cuerpo?.contentType === "string" ? cuerpo.contentType.trim() : "";
  const contentBase64 =
    typeof cuerpo?.contentBase64 === "string" ? cuerpo.contentBase64 : "";

  if (!filename || !contentType || !contentBase64) {
    return esError(
      400,
      "Faltan campos: filename, contentType y contentBase64 son obligatorios.",
    );
  }

  let contenido: Buffer;
  try {
    contenido = Buffer.from(contentBase64, "base64");
  } catch {
    return esError(400, "contentBase64 no es base64 válido.");
  }
  if (contenido.length === 0) {
    return esError(400, "El archivo está vacío.");
  }
  if (contenido.length > LIMITE_BYTES) {
    return esError(413, "El archivo supera el límite de 10 MB.");
  }

  const partes = filename.split(".");
  const extension = partes.length > 1 ? `.${partes.pop()}` : "";
  const ruta = `${Math.random()}${extension}`;

  const supabase = getServiceClient();
  const { error: errorDeSubida } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(ruta, contenido, { contentType });
  if (errorDeSubida) {
    return esError(
      500,
      `No se pudo subir el archivo: ${errorDeSubida.message}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(ruta);

  return Response.json({
    src: publicUrl,
    title: filename,
    path: ruta,
    type: contentType,
  });
}

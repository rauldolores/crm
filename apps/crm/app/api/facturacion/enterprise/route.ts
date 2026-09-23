import { env } from "@/lib/env";
import { requireKontroliaPermission } from "@/lib/server/requireKontroliaPermission";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Lo que un cliente le pide a Kontrolia desde dentro del CRM: el plan
 * Enterprise y las funcionalidades a medida.
 *
 * Las dos cosas acaban donde acaban las del sitio público: en el CRM
 * comercial de Kontrolia, a través de `/api/lead` de vinqulia.com. Antes
 * esto mandaba un correo a una bandeja, que es justo donde se pierden las
 * peticiones; ahora el plan Enterprise entra como oportunidad con su
 * estimación y su cotización en borrador —lo mismo que rellenar el
 * formulario de /enterprise— y la petición de funcionalidad entra como
 * ticket en la cola de soporte.
 *
 * Se reenvía al sitio en vez de escribir aquí directamente a propósito: la
 * organización comercial de Kontrolia es la del sitio, no la de quien pide.
 * Una instalación en servidores del cliente (on-premise) sigue mandando su
 * solicitud a Kontrolia, que es lo correcto, sin tener sus credenciales.
 */

const MAX_NOMBRE = 120;
const MAX_MENSAJE = 4000;
const TIEMPO_LIMITE_MS = 20_000;

const esError = (estado: number, mensaje: string) =>
  Response.json({ message: mensaje }, { status: estado });

interface CuerpoRecibido {
  tipo?: string;
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  mensaje?: string;
  modalidad?: string;
  usuarios?: number;
  plan?: string;
}

export async function POST(peticion: Request) {
  const auth = await requireKontroliaPermission(peticion, []);
  if (!auth.ok) return auth.response;

  const cuerpo = (await peticion
    .json()
    .catch(() => null)) as CuerpoRecibido | null;

  const nombre = (cuerpo?.nombre ?? "").trim().slice(0, MAX_NOMBRE);
  const mensaje = (cuerpo?.mensaje ?? "").trim().slice(0, MAX_MENSAJE);
  const empresa = (cuerpo?.empresa ?? "").trim().slice(0, MAX_NOMBRE);
  const telefono = (cuerpo?.telefono ?? "").trim().slice(0, 50);
  const esFuncionalidad = cuerpo?.tipo === "funcionalidad";

  if (!nombre) {
    return esError(400, "Falta tu nombre.");
  }
  if (esFuncionalidad && !mensaje) {
    return esError(400, "Cuéntanos qué necesitas.");
  }
  if (!esFuncionalidad && !empresa) {
    return esError(400, "Falta el nombre de tu empresa.");
  }

  const { organizacionId, usuarioId } = auth.sesion;

  // El correo de contacto sale de la ficha del comercial, no del cuerpo: es
  // el que Kontrolia ya tiene y evita que alguien escriba uno ajeno.
  const { data: comercial } = await getServiceClient()
    .from("sales")
    .select("email")
    .eq("user_id", usuarioId)
    .eq("organization_id", organizacionId)
    .maybeSingle();
  const email = (cuerpo?.email ?? "").trim() || (comercial?.email as string);

  if (!email) {
    return esError(400, "Falta un correo de contacto.");
  }

  const usuarios = Number(cuerpo?.usuarios);
  const carga = esFuncionalidad
    ? {
        paso: "funcionalidad",
        nombre,
        empresa,
        email,
        mensaje,
        plan: (cuerpo?.plan ?? "").trim().slice(0, 120),
        organizacion_id: organizacionId,
        usuarios: Number.isFinite(usuarios) ? String(usuarios) : "",
      }
    : {
        paso: "enterprise",
        nombre,
        empresa,
        email,
        telefono,
        modalidad: cuerpo?.modalidad === "onpremise" ? "onpremise" : "nube",
        usuarios: Number.isFinite(usuarios) && usuarios > 0 ? usuarios : 1,
        // El desplegable del sitio pregunta con qué gestionan hoy sus
        // ventas; quien pide esto desde dentro ya lo sabemos.
        sistema_actual: "Ya usa Vinqulia",
        comentarios: [
          mensaje,
          `Organización (id): ${organizacionId}`,
          (cuerpo?.plan ?? "").trim()
            ? `Plan actual: ${(cuerpo?.plan ?? "").trim()}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      };

  let respuesta: Response;
  try {
    respuesta = await fetch(`${env.sitioUrl}/api/lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Para que el freno por IP del formulario cuente a quien escribe y
        // no a este servidor, que es el mismo para todas las solicitudes.
        "x-forwarded-for":
          peticion.headers.get("x-forwarded-for") ??
          peticion.headers.get("x-real-ip") ??
          "",
      },
      body: JSON.stringify(carga),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    });
  } catch {
    return esError(
      502,
      "No pudimos enviar tu solicitud. Inténtalo de nuevo en un momento.",
    );
  }

  const datos = (await respuesta.json().catch(() => ({}))) as {
    ok?: boolean;
    message?: string;
  };
  if (!respuesta.ok || !datos.ok) {
    return Response.json(
      {
        message:
          datos.message ??
          "No pudimos enviar tu solicitud. Inténtalo de nuevo en un momento.",
      },
      { status: respuesta.status === 429 ? 429 : 502 },
    );
  }

  return Response.json({ ok: true });
}

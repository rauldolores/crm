import { getServiceClient } from "@/lib/server/supabase-service";
import { normalizarCorreo } from "@/lib/server/correo/comercial";

/**
 * Darse de baja del correo comercial de una organización. Pública: la abre
 * quien recibió el correo, sin sesión. El token (aleatorio, uno por correo
 * enviado) dice qué correo fue y a qué dirección salió.
 *
 * - GET pinta una confirmación con un botón. No da de baja por sí solo: los
 *   filtros de seguridad de muchas empresas abren todos los enlaces de un
 *   correo, y darían de baja a gente que no lo pidió.
 * - POST da de baja. Es lo que hace ese botón y lo que hacen Gmail o Yahoo
 *   con su propio «Cancelar suscripción» (cabecera List-Unsubscribe-Post,
 *   RFC 8058), sin abrir nada.
 *
 * La baja es por dirección y para toda la organización: el despachador ya no
 * le manda ningún correo comercial. Los transaccionales (cotizaciones,
 * tickets, renovaciones) siguen llegando.
 */

interface Contexto {
  params: Promise<{ token: string }>;
}

const ES_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapar = (texto: string) =>
  texto.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

const pagina = (titulo: string, cuerpo: string, estado = 200) =>
  new Response(
    `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapar(titulo)}</title>
</head>
<body style="margin:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;">
  <main style="max-width:440px;margin:64px auto;padding:32px;background:#fff;border-radius:12px;">
    <h1 style="margin:0 0 12px;font-size:20px;">${escapar(titulo)}</h1>
    ${cuerpo}
  </main>
</body></html>`,
    {
      status: estado,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );

const enlaceNoValido = () =>
  pagina(
    "Enlace no válido",
    `<p style="margin:0;color:#4b5563;">Este enlace de baja no existe o ya no es válido.</p>`,
    404,
  );

/** El correo al que pertenece el token, si existe y ya salió. */
async function correoDelToken(token: string) {
  if (!ES_UUID.test(token)) return null;
  const { data } = await getServiceClient()
    .from("email_outbox")
    .select("id, organization_id, sent_to")
    .eq("unsubscribe_token", token)
    .not("sent_to", "is", null)
    .maybeSingle();
  return data as {
    id: number;
    organization_id: string;
    sent_to: string;
  } | null;
}

async function yaDadoDeBaja(organizacionId: string, correo: string) {
  const { data } = await getServiceClient()
    .from("email_suppressions")
    .select("email")
    .eq("organization_id", organizacionId)
    .eq("email", correo)
    .maybeSingle();
  return Boolean(data);
}

const listo = (correo: string) =>
  pagina(
    "Listo, te diste de baja",
    `<p style="margin:0;color:#4b5563;">No volveremos a escribir a <strong>${escapar(correo)}</strong> con correos como este.</p>`,
  );

export async function GET(_peticion: Request, { params }: Contexto) {
  const { token } = await params;
  const correo = await correoDelToken(token);
  if (!correo) return enlaceNoValido();

  const direccion = normalizarCorreo(correo.sent_to);
  if (await yaDadoDeBaja(correo.organization_id, direccion)) {
    return listo(direccion);
  }

  return pagina(
    "¿Darte de baja?",
    `<p style="margin:0 0 20px;color:#4b5563;">Dejaremos de enviar correos como este a <strong>${escapar(direccion)}</strong>.</p>
    <form method="post">
      <button type="submit" style="padding:10px 20px;border:0;border-radius:6px;background:#111827;color:#fff;font-size:15px;cursor:pointer;">Darme de baja</button>
    </form>`,
  );
}

export async function POST(_peticion: Request, { params }: Contexto) {
  const { token } = await params;
  const correo = await correoDelToken(token);
  if (!correo) return enlaceNoValido();

  const direccion = normalizarCorreo(correo.sent_to);
  // Repetir la baja no hace nada: la dirección ya está.
  const { error } = await getServiceClient().from("email_suppressions").upsert(
    {
      organization_id: correo.organization_id,
      email: direccion,
      reason: "unsubscribe",
      outbox_id: correo.id,
    },
    { onConflict: "organization_id,email", ignoreDuplicates: true },
  );
  if (error) {
    console.error("baja: no se pudo guardar", {
      outboxId: correo.id,
      error: error.message,
    });
    return pagina(
      "No se pudo completar",
      `<p style="margin:0;color:#4b5563;">Algo falló al darte de baja. Inténtalo de nuevo en unos minutos.</p>`,
      500,
    );
  }

  return listo(direccion);
}

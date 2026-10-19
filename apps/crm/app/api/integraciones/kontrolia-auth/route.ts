import { autenticarPuente } from "@/lib/server/autenticarPuente";
import {
  aplicarKontroliaAuth,
  registrarAviso,
  ultimaFotoAplicada,
} from "@/lib/server/integraciones/aplicarKontroliaAuth";
import { firmaValida } from "@/lib/server/integraciones/firma";
import { AvisoKontroliaAuth } from "@/lib/server/integraciones/kontroliaAuth";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Receptor de los «avisos de plataforma» de KontrolIA Auth.
 *
 * Cada vez que cambia un cliente de KONTROLIA (su organización, sus
 * usuarios, una suscripción, una renovación o un extra), KontrolIA Auth hace
 * POST aquí con la foto completa del cliente. Se guarda como empresa,
 * contactos, contratos (uno por producto), compras (renovaciones pagadas) e
 * historial del contrato. Ver kontroliaAuth.ts y la página
 * doc/…/developers/integracion-kontrolia-auth.mdx.
 *
 * Dos llaves, las dos obligatorias:
 *   - `Authorization: Bearer vnq_…`: la clave de API de Vinqulia dice EN QUÉ
 *     organización del CRM se guarda (la de KONTROLIA).
 *   - `X-Kontrolia-Signature`: la firma con el secreto del aviso
 *     (KONTROLIA_AUTH_WEBHOOK_SECRET) prueba que lo mandó KontrolIA Auth.
 *     Sin secreto configurado no se acepta nada: nunca avisos sin firmar.
 *
 * Cualquier respuesta distinta de 2xx hace que KontrolIA Auth reintente
 * (1, 3, 9, 27… minutos), así que un fallo al guardar responde 500.
 */

export const runtime = "nodejs";

const esError = (estado: number, mensaje: string, extra?: object) =>
  Response.json({ ok: false, message: mensaje, ...extra }, { status: estado });

export async function POST(peticion: Request) {
  const secreto = process.env.KONTROLIA_AUTH_WEBHOOK_SECRET ?? "";
  if (!secreto) {
    return esError(
      503,
      "La integración con KontrolIA Auth no está configurada: falta KONTROLIA_AUTH_WEBHOOK_SECRET en el servidor. Copia ahí el secreto del aviso de plataforma.",
    );
  }

  // El cuerpo CRUDO primero: la firma se calcula sobre el texto exacto que
  // llegó, no sobre un JSON vuelto a serializar.
  const cuerpo = await peticion.text();
  if (
    !firmaValida(cuerpo, peticion.headers.get("x-kontrolia-signature"), secreto)
  ) {
    return esError(401, "Firma del aviso inválida o vencida.");
  }

  const auth = await autenticarPuente(peticion);
  if (!auth.ok) return auth.response;
  if (!auth.viaClaveDeApi) {
    return esError(
      401,
      "Este receptor solo acepta una clave de API de Vinqulia (Authorization: Bearer vnq_…).",
    );
  }
  const org = auth.organizacionId;

  let json: unknown;
  try {
    json = JSON.parse(cuerpo);
  } catch {
    return esError(400, "El cuerpo no es JSON válido.");
  }
  const validado = AvisoKontroliaAuth.safeParse(json);
  if (!validado.success) {
    return esError(400, "El aviso no trae la foto del cliente esperada.", {
      errores: validado.error.issues.slice(0, 20).map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      })),
    });
  }
  const aviso = validado.data;
  const foto = aviso.snapshot;

  const eventoId =
    aviso.id || peticion.headers.get("x-kontrolia-event-id") || "";
  if (!eventoId) {
    return esError(400, "Falta el id del evento.");
  }
  const tipo = aviso.type ?? peticion.headers.get("x-kontrolia-event") ?? null;

  const db = getServiceClient();
  const renglon = {
    organization_id: org,
    event_id: eventoId,
    type: tipo,
    external_organization_id: foto.organization.id,
    snapshot_generated_at: foto.generated_at,
  };

  try {
    // Una foto más vieja que la última aplicada no se aplica: llegó tarde
    // (un reintento) y pisaría datos más nuevos. La misma foto sí se
    // vuelve a aplicar: es idempotente.
    const ultima = await ultimaFotoAplicada(db, org, foto.organization.id);
    if (ultima && Date.parse(ultima) > Date.parse(foto.generated_at)) {
      await registrarAviso(db, {
        ...renglon,
        status: "ok",
        error: `Foto de ${foto.generated_at} ignorada: ya se aplicó una de ${ultima}.`,
      });
      return Response.json({
        ok: true,
        ignored: true,
        reason: "older_snapshot",
      });
    }

    const resultado = await aplicarKontroliaAuth(db, org, foto);
    await registrarAviso(db, { ...renglon, status: "ok", error: null });
    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("Aviso de KontrolIA Auth no aplicado", eventoId, mensaje);
    await registrarAviso(db, { ...renglon, status: "error", error: mensaje });
    return esError(
      500,
      "No se pudo aplicar el aviso; KontrolIA Auth lo reintentará.",
    );
  }
}

import { z } from "zod";

import {
  AjustesRecibidos,
  normalizarAjustes,
  PRODUCTO_GENERAL,
} from "@/lib/server/facturacion/ajustes";
import {
  responderError,
  sesionDeFacturacion,
} from "@/lib/server/facturacion/rutas";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Ajustes → Facturación: claves del SAT, concepto, IVA, método y forma de
 * pago, días de anticipación y modo (revisar o timbrar sola), uno general
 * y, si se quiere, uno por producto. También el secreto del aviso de
 * Faqturia, que se escribe aquí y nunca vuelve al navegador.
 *
 * Leer: cualquiera con sesión. Cambiar: solo administradores (es dinero).
 */

const productoDeContrato = (nombre: string, slug: string) =>
  nombre.split(" · ")[0]?.trim() || slug;

export async function GET(peticion: Request) {
  const auth = await sesionDeFacturacion(peticion, { admin: false });
  if (!auth.ok) return auth.response;
  const org = auth.sesion.organizacionId;
  try {
    const db = getServiceClient();
    const [filas, contratos, conector] = await Promise.all([
      db.from("billing_settings").select("*").eq("organization_id", org),
      db
        .from("contracts")
        .select("application_slug, name")
        .eq("organization_id", org)
        .not("application_slug", "is", null)
        .limit(2000),
      db
        .from("connectors")
        .select("provider, status, webhook_secret")
        .eq("organization_id", org)
        .eq("family", "invoicing")
        .maybeSingle(),
    ]);
    if (filas.error) throw new Error(filas.error.message);

    const productos = new Map<string, string>();
    for (const c of (contratos.data ?? []) as {
      application_slug: string;
      name: string;
    }[]) {
      if (!productos.has(c.application_slug)) {
        productos.set(
          c.application_slug,
          productoDeContrato(c.name, c.application_slug),
        );
      }
    }

    const origen = new URL(peticion.url).origin;
    return Response.json({
      ajustes: (filas.data ?? []).map((fila) => normalizarAjustes(fila)),
      productos: [...productos].map(([slug, nombre]) => ({ slug, nombre })),
      conector: conector.data
        ? {
            proveedor: conector.data.provider as string,
            estado: conector.data.status as string,
            aviso_configurado: Boolean(conector.data.webhook_secret),
          }
        : null,
      url_del_aviso: `${origen}/api/integraciones/faqturia`,
    });
  } catch (error) {
    return responderError(error);
  }
}

const Cuerpo = z.object({
  ajustes: AjustesRecibidos.optional(),
  // null = quitar el secreto; texto = reemplazarlo.
  secreto_del_aviso: z.string().trim().max(500).nullable().optional(),
});

export async function PUT(peticion: Request) {
  const auth = await sesionDeFacturacion(peticion, { admin: true });
  if (!auth.ok) return auth.response;
  const org = auth.sesion.organizacionId;
  const cuerpo = Cuerpo.safeParse(await peticion.json().catch(() => ({})));
  if (!cuerpo.success) {
    return Response.json(
      {
        message:
          cuerpo.error.issues[0]?.message &&
          !cuerpo.error.issues[0].message.startsWith("Invalid")
            ? cuerpo.error.issues[0].message
            : "Revisa los datos: alguno no es válido.",
      },
      { status: 400 },
    );
  }
  try {
    const db = getServiceClient();
    let guardados = null;
    if (cuerpo.data.ajustes) {
      const { data, error } = await db
        .from("billing_settings")
        .upsert(
          {
            ...cuerpo.data.ajustes,
            organization_id: org,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,product_key" },
        )
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      guardados = normalizarAjustes(data);
    }
    if (cuerpo.data.secreto_del_aviso !== undefined) {
      const { data, error } = await db
        .from("connectors")
        .update({ webhook_secret: cuerpo.data.secreto_del_aviso || null })
        .eq("organization_id", org)
        .eq("family", "invoicing")
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        return Response.json(
          {
            message:
              "Primero conecta Faqturia en Ajustes → Conectores; el secreto del aviso va con ese conector.",
          },
          { status: 409 },
        );
      }
    }
    return Response.json({ ok: true, ajustes: guardados });
  } catch (error) {
    return responderError(error);
  }
}

/** Quita los ajustes propios de un producto: vuelve a usar los generales. */
export async function DELETE(peticion: Request) {
  const auth = await sesionDeFacturacion(peticion, { admin: true });
  if (!auth.ok) return auth.response;
  const producto = new URL(peticion.url).searchParams.get("producto") ?? "";
  if (!producto || producto === PRODUCTO_GENERAL) {
    return Response.json(
      { message: "Los ajustes generales no se quitan, solo se cambian." },
      { status: 400 },
    );
  }
  try {
    const { error } = await getServiceClient()
      .from("billing_settings")
      .delete()
      .eq("organization_id", auth.sesion.organizacionId)
      .eq("product_key", producto);
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}

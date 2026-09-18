import { z } from "zod";

import { esFamilia } from "@/lib/conectores/catalogo";
import { conectar, desconectar } from "@/lib/server/conectores/almacen";
import { sincronizarProductos } from "@/lib/server/conectores/productos";
import {
  responderError,
  sesionDeConectores,
} from "@/lib/server/conectores/rutas";

/**
 * Conectar (PUT) o desconectar (DELETE) el proveedor de una familia. Solo
 * administradores. PUT prueba la credencial antes de guardar y, si es el
 * catálogo de productos, lo sincroniza en el acto para que la persona vea
 * sus productos sin un paso más.
 */

const Alta = z.object({
  provider: z.string().min(1).max(40),
  settings: z.record(z.string(), z.string().max(300)).default({}),
  secret: z.string().max(500).optional().nullable(),
});

type Contexto = { params: Promise<{ familia: string }> };

export async function PUT(peticion: Request, { params }: Contexto) {
  const auth = await sesionDeConectores(peticion, { admin: true });
  if (!auth.ok) return auth.response;
  const { familia } = await params;
  if (!esFamilia(familia)) {
    return Response.json({ message: "Familia desconocida." }, { status: 404 });
  }
  const cuerpo = Alta.safeParse(await peticion.json().catch(() => ({})));
  if (!cuerpo.success) {
    return Response.json({ message: "Datos no válidos." }, { status: 400 });
  }
  try {
    const { guardado, detalle } = await conectar(
      auth.sesion.organizacionId,
      familia,
      {
        provider: cuerpo.data.provider,
        settings: cuerpo.data.settings,
        secret: cuerpo.data.secret ?? null,
      },
    );
    let sincronizacion: { total: number; activos: number } | null = null;
    if (familia === "products") {
      sincronizacion = await sincronizarProductos(auth.sesion.organizacionId);
    }
    return Response.json({ conector: guardado, detalle, sincronizacion });
  } catch (error) {
    return responderError(error);
  }
}

export async function DELETE(peticion: Request, { params }: Contexto) {
  const auth = await sesionDeConectores(peticion, { admin: true });
  if (!auth.ok) return auth.response;
  const { familia } = await params;
  if (!esFamilia(familia)) {
    return Response.json({ message: "Familia desconocida." }, { status: 404 });
  }
  try {
    await desconectar(auth.sesion.organizacionId, familia);
    return Response.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}

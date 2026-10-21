import type { FamiliaDeConector } from "@/lib/conectores/catalogo";

import { getServiceClient } from "../supabase-service";

/**
 * El módulo de una familia se enciende al conectar su proveedor y se apaga al
 * desconectarlo.
 *
 * El registro de módulos lo prometía desde el principio («se activa solo al
 * conectarlo y se apaga al desconectarlo», ver modules/registry.ts) pero
 * nadie lo implementó: el interruptor era manual y nada lo ataba al conector.
 * Se podía encender Facturación sin proveedor enlazado, y entonces «Emitir
 * factura» aparecía en la cotización para fallar al pulsarlo con un 404 de
 * «No hay un proveedor de facturación conectado». Un botón que promete algo
 * que no puede cumplir.
 *
 * Vive aquí y no en la ruta a propósito: `conectar()` y `desconectar()` son el
 * único sitio por el que se pasa, así que atarlo ahí vale para la ruta de hoy
 * y para cualquier otra que venga.
 *
 * Nunca lanza: si la configuración no se puede escribir, el conector igual
 * quedó guardado, y dejar la conexión a medias por no poder mover un
 * interruptor sería peor. Queda en el registro del servidor.
 */
export async function ajustarModuloDeFamilia(
  organizacionId: string,
  familia: FamiliaDeConector,
  activo: boolean,
): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { data: fila } = await supabase
      .from("configuration")
      .select("config")
      .eq("organization_id", organizacionId)
      .maybeSingle();

    const config = (fila?.config ?? {}) as Record<string, unknown>;
    const modules = (config.modules ?? {}) as Record<
      string,
      Record<string, unknown>
    >;

    // La clave del módulo y la de la familia coinciden ("products",
    // "invoicing"); si algún día dejan de coincidir, aquí es donde se nota.
    if ((modules[familia]?.active ?? false) === activo) return;

    const { error } = await supabase
      .from("configuration")
      .update({
        config: {
          ...config,
          modules: {
            ...modules,
            [familia]: { ...(modules[familia] ?? {}), active: activo },
          },
        },
      })
      .eq("organization_id", organizacionId);
    if (error) {
      console.error("[conectores] no se pudo ajustar el módulo", error);
    }
  } catch (e) {
    console.error("[conectores] no se pudo ajustar el módulo", e);
  }
}

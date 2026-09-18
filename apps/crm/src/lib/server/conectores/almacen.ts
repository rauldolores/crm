import {
  campoSecreto,
  proveedorPorClave,
  type FamiliaDeConector,
} from "@/lib/conectores/catalogo";

import { getServiceClient } from "../supabase-service";
import { construirConector, proveedorValidoPara } from "./registro";
import { ErrorDeConector, type Conector } from "./tipos";

/**
 * Los conectores guardados de una organización: leerlos sin el secreto
 * (para la pantalla), construir uno con el secreto (para usarlo en el
 * servidor), guardar uno nuevo tras probarlo, y desconectar.
 */

export interface ConectorGuardado {
  id: number;
  family: FamiliaDeConector;
  provider: string;
  settings: Record<string, string>;
  status: "connected" | "error";
  last_error: string | null;
  last_checked_at: string | null;
  last_synced_at: string | null;
}

interface FilaDeConector extends ConectorGuardado {
  secret: string;
}

const COLUMNAS_VISIBLES =
  "id, family, provider, settings, status, last_error, last_checked_at, last_synced_at";

export const conectoresDe = async (
  organizacionId: string,
): Promise<ConectorGuardado[]> => {
  const { data, error } = await getServiceClient()
    .from("connectors")
    .select(COLUMNAS_VISIBLES)
    .eq("organization_id", organizacionId)
    .order("family");
  if (error) throw new Error(error.message);
  return (data ?? []) as ConectorGuardado[];
};

const filaDe = async (
  organizacionId: string,
  familia: FamiliaDeConector,
): Promise<FilaDeConector | null> => {
  const { data, error } = await getServiceClient()
    .from("connectors")
    .select(`${COLUMNAS_VISIBLES}, secret`)
    .eq("organization_id", organizacionId)
    .eq("family", familia)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as FilaDeConector | null) ?? null;
};

/** El conector activo de esa familia, listo para usar; null si no hay. */
export const conectorActivo = async (
  organizacionId: string,
  familia: FamiliaDeConector,
): Promise<{ conector: Conector; guardado: ConectorGuardado } | null> => {
  const fila = await filaDe(organizacionId, familia);
  if (!fila) return null;
  const { secret, ...guardado } = fila;
  return {
    conector: construirConector(fila.provider, {
      settings: fila.settings,
      secret,
    }),
    guardado,
  };
};

/**
 * Lo que llega de la pantalla: proveedor, ajustes y, si la escribieron, la
 * credencial. Sin credencial nueva se conserva la que ya había — el campo
 * siempre vuelve vacío al navegador.
 */
export interface AltaDeConector {
  provider: string;
  settings: Record<string, string>;
  secret: string | null;
}

const limpiarAjustes = (
  proveedor: string,
  ajustes: Record<string, unknown>,
): Record<string, string> => {
  const definicion = proveedorPorClave(proveedor);
  if (!definicion) return {};
  const limpios: Record<string, string> = {};
  for (const campo of definicion.fields) {
    if (campo.type === "secret") continue;
    const valor = ajustes[campo.key];
    const texto =
      typeof valor === "string" ? valor.trim().slice(0, 300) : "";
    if (texto) limpios[campo.key] = texto;
    else if (campo.defaultValue) limpios[campo.key] = campo.defaultValue;
    else if (campo.required) {
      throw new ErrorDeConector(`Falta «${campo.label}».`, 400);
    }
  }
  return limpios;
};

/**
 * Prueba la conexión con lo recibido y, si responde, la guarda. Si no
 * responde, no guarda nada: una credencial que no funciona no sirve de nada
 * guardada, y la persona ve el motivo en el momento.
 */
export const conectar = async (
  organizacionId: string,
  familia: FamiliaDeConector,
  alta: AltaDeConector,
): Promise<{ guardado: ConectorGuardado; detalle: string }> => {
  if (!proveedorValidoPara(familia, alta.provider)) {
    throw new ErrorDeConector("Ese proveedor no sirve para esta familia.", 400);
  }
  const definicion = proveedorPorClave(alta.provider)!;
  const settings = limpiarAjustes(alta.provider, alta.settings);

  const anterior = await filaDe(organizacionId, familia);
  const secreto =
    (alta.secret ?? "").trim() ||
    (anterior?.provider === alta.provider ? anterior.secret : "");
  if (!secreto) {
    const campo = campoSecreto(definicion);
    throw new ErrorDeConector(
      `Falta «${campo?.label ?? "la credencial"}».`,
      400,
    );
  }

  const conector = construirConector(alta.provider, { settings, secret: secreto });
  const prueba = await conector.probar();
  if (!prueba.ok) {
    throw new ErrorDeConector(prueba.mensaje, 422);
  }

  const ahora = new Date().toISOString();
  const { data, error } = await getServiceClient()
    .from("connectors")
    .upsert(
      {
        organization_id: organizacionId,
        family: familia,
        provider: alta.provider,
        settings,
        secret: secreto,
        status: "connected",
        last_error: null,
        last_checked_at: ahora,
        updated_at: ahora,
      },
      { onConflict: "organization_id,family" },
    )
    .select(COLUMNAS_VISIBLES)
    .single();
  if (error) throw new Error(error.message);
  return { guardado: data as ConectorGuardado, detalle: prueba.detalle };
};

export const desconectar = async (
  organizacionId: string,
  familia: FamiliaDeConector,
): Promise<void> => {
  const { error } = await getServiceClient()
    .from("connectors")
    .delete()
    .eq("organization_id", organizacionId)
    .eq("family", familia);
  if (error) throw new Error(error.message);
};

/** Deja constancia de que la última llamada falló (o de que ya funciona). */
export const anotarEstado = async (
  conectorId: number,
  fallo: string | null,
): Promise<void> => {
  await getServiceClient()
    .from("connectors")
    .update({
      status: fallo ? "error" : "connected",
      last_error: fallo,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", conectorId);
};

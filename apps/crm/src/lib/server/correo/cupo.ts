import { getServiceClient } from "../supabase-service";
import {
  AJUSTES_DE_ENVIO_POR_DEFECTO,
  limiteDeHoy,
  type AjustesDeEnvio,
} from "./comercial";

const UN_DIA = 24 * 60 * 60 * 1000;

export interface EstadoDelCupo {
  ajustes: AjustesDeEnvio;
  /** Cuántos correos comerciales pueden salir en estas 24 horas. */
  limite: number;
  /** Cuántos salieron en las últimas 24 horas. */
  enviados: number;
}

/**
 * El cupo de correo comercial de una organización en las 24 horas que acaban
 * `ahora`. Lo usan el despachador (para no pasarse) y Ajustes → Correo
 * saliente (para enseñarlo), así que cuentan lo mismo.
 */
export async function estadoDelCupo(
  organizacionId: string,
  ahora: Date,
): Promise<EstadoDelCupo> {
  const supabase = getServiceClient();
  const comerciales = () =>
    supabase
      .from("email_outbox")
      .select("sent_at", { count: "exact" })
      .eq("organization_id", organizacionId)
      .not("sent_at", "is", null)
      .is("quote_id", null)
      .is("ticket_id", null)
      .is("contract_id", null);

  const [{ data: guardados }, { data: primero }, { count: enviados }] =
    await Promise.all([
      supabase
        .from("email_settings")
        .select("daily_limit, warmup")
        .eq("organization_id", organizacionId)
        .maybeSingle(),
      comerciales().order("sent_at").limit(1),
      comerciales()
        .gte("sent_at", new Date(ahora.getTime() - UN_DIA).toISOString())
        .limit(1),
    ]);

  const ajustes: AjustesDeEnvio = guardados
    ? {
        limiteDiario: guardados.daily_limit as number,
        calentamiento: guardados.warmup as boolean,
      }
    : AJUSTES_DE_ENVIO_POR_DEFECTO;

  return {
    ajustes,
    limite: limiteDeHoy(
      ajustes,
      primero?.[0]?.sent_at ? new Date(primero[0].sent_at as string) : null,
      ahora,
    ),
    enviados: enviados ?? 0,
  };
}

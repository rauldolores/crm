import { ORIGEN_KONTROLIA_AUTH, llaveDeContrato } from "../integraciones/kontroliaAuth";
import { ajustesDelProducto } from "./ajustes";
import {
  COLUMNAS_DE_CONTRATO,
  COLUMNAS_DE_EMPRESA,
  conectorDeFacturacion,
  exigir,
  guardarFacturaPlaneada,
  leerAjustes,
  puedeTimbrarSola,
  type Db,
  type FacturaDeBandeja,
} from "./guardar";
import { facturaDeCobro, type AvisoDeCobro } from "./tarjeta";
import type { ContratoAFacturar, EmpresaFiscal } from "./tipos";

/**
 * Un cobro con tarjeta que KontrolIA Auth confirmó (`payment.succeeded`) se
 * convierte en una factura ya pagada. SIEMPRE se registra —aunque el
 * contrato no tenga encendida la facturación automática— para que ningún
 * cobro se quede sin CFDI sin que nadie lo vea: entra a revisión. Solo se
 * timbra sola si el contrato la tiene encendida y su producto está en
 * «timbrar sola».
 */

export type ResultadoDeCobro =
  | { registrada: true; factura: FacturaDeBandeja; creada: boolean }
  | { registrada: false; motivo: "zero_amount" };

export const registrarCobroConTarjeta = async (
  db: Db,
  org: string,
  aviso: AvisoDeCobro,
): Promise<ResultadoDeCobro> => {
  const aplicacion = aviso.application?.slug ?? null;

  const contrato = aplicacion
    ? (exigir(
        await db
          .from("contracts")
          .select(COLUMNAS_DE_CONTRATO)
          .eq("organization_id", org)
          .eq("source", ORIGEN_KONTROLIA_AUTH)
          .eq("external_id", llaveDeContrato(aviso.organization_id, aplicacion))
          .maybeSingle(),
        "Buscar el contrato del cobro",
      ) as ContratoAFacturar | null)
    : null;

  const empresa = (exigir(
    contrato
      ? await db
          .from("companies")
          .select(COLUMNAS_DE_EMPRESA)
          .eq("organization_id", org)
          .eq("id", contrato.company_id)
          .maybeSingle()
      : await db
          .from("companies")
          .select(COLUMNAS_DE_EMPRESA)
          .eq("organization_id", org)
          .eq("source", ORIGEN_KONTROLIA_AUTH)
          .eq("external_id", aviso.organization_id)
          .maybeSingle(),
    "Buscar la empresa del cobro",
  ) ?? null) as EmpresaFiscal | null;

  const ajustes = ajustesDelProducto(await leerAjustes(db, org), aplicacion);
  const plan = facturaDeCobro(aviso, {
    ajustes,
    contrato,
    companyId: empresa?.id ?? null,
  });
  if (!plan) return { registrada: false, motivo: "zero_amount" };

  const { factura, creada } = await guardarFacturaPlaneada(db, org, plan, {
    empresa,
    timbrarSola: puedeTimbrarSola(ajustes, contrato),
    conector: await conectorDeFacturacion(db, org),
  });
  return { registrada: true, factura, creada };
};

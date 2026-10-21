import { validateToken } from "@/lib/server/mcp/auth";
import {
  listaDeOrigenes,
  responderConsumo,
  responderPreflight,
} from "@/lib/server/soporte/consumo";
import { getServiceClient } from "@/lib/server/supabase-service";

/**
 * Consumo de horas de soporte del cliente, con su token de KontrolIA Auth:
 * GET /api/soporte/consumo?aplicacion=aduaniax&mes=AAAA-MM. Ver consumo.ts.
 *
 * Variables de entorno:
 *   SOPORTE_ORGANIZACION_CRM_ID   organización de KONTROLIA en el CRM.
 *   SOPORTE_ORIGENES_PERMITIDOS   orígenes del navegador separados por coma
 *                                 (https://app.aduaniax.com, …).
 */

const origenes = () => listaDeOrigenes(process.env.SOPORTE_ORIGENES_PERMITIDOS);

export async function GET(peticion: Request) {
  return responderConsumo(peticion, {
    verificarToken: validateToken,
    db: getServiceClient(),
    organizacionCrm: process.env.SOPORTE_ORGANIZACION_CRM_ID,
    origenesPermitidos: origenes(),
  });
}

export function OPTIONS(peticion: Request) {
  return responderPreflight(peticion, origenes());
}

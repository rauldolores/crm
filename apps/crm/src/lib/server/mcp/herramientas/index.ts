import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registrarActividad } from "./actividad";
import { registrarAutomatizaciones } from "./automatizaciones";
import { registrarCatalogos } from "./catalogos";
import { registrarContactos } from "./contactos";
import { registrarCorreo } from "./correo";
import { registrarEmpresas } from "./empresas";
import { registrarOportunidades } from "./oportunidades";
import { registrarSoporte } from "./soporte";
import type { ContextoDeHerramienta } from "./nucleo";

/**
 * Herramientas acotadas del MCP: una por tarea concreta, frente a las
 * genéricas (`get_schema`, `query`, `mutate`), que se quedan para lo que no
 * esté cubierto aquí.
 *
 * El motivo es la velocidad. Con las genéricas, responder «¿qué contactos
 * tengo?» exige pedir antes el esquema completo —30 tablas, 304 columnas,
 * unos 4.000 tokens— y solo entonces consultar: dos viajes y mucho contexto.
 * Estas resuelven la misma pregunta en uno y sin esquema.
 *
 * El equilibrio importa: las definiciones de las herramientas se cargan en
 * CADA petición, mientras que el esquema solo se paga cuando el agente lo
 * pide. Una herramienta por tabla y verbo (30 × 5 = 150) pesaría más que el
 * esquema que se quería evitar. Por eso se agrupa por TAREA y las
 * descripciones son cortas.
 */
export function registrarHerramientas(
  server: McpServer,
  ctx: ContextoDeHerramienta,
): void {
  registrarCatalogos(server, ctx);
  registrarContactos(server, ctx);
  registrarEmpresas(server, ctx);
  registrarOportunidades(server, ctx);
  registrarActividad(server, ctx);
  registrarSoporte(server, ctx);
  registrarCorreo(server, ctx);
  registrarAutomatizaciones(server, ctx);
}

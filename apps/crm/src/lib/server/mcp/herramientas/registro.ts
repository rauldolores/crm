import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { ContextoDeHerramienta } from "./nucleo";

/**
 * Firma común de los módulos de herramientas. Cada área del CRM registra las
 * suyas y no sabe nada de las demás: añadir un área es añadir un archivo y
 * una línea en `registrarHerramientas`.
 */
export type RegistradorDeHerramientas = (
  server: McpServer,
  ctx: ContextoDeHerramienta,
) => void;

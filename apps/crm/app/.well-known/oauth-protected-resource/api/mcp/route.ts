import { protectedResourceMetadata } from "@/lib/server/mcp/auth";
import { CORS_HEADERS } from "@/lib/server/mcp/cors";

/**
 * Mismo documento que /api/mcp/oauth-protected-resource, en la ruta
 * estándar de la RFC 9728 (inserta el segmento well-known ANTES del path
 * del recurso: /.well-known/oauth-protected-resource + /api/mcp).
 *
 * Hace falta porque no todos los clientes MCP arrancan con una petición
 * real a /api/mcp para leer el WWW-Authenticate del 401 — algunos (p. ej.
 * @ai-sdk/mcp, que usa Nodia Agents) van directo a adivinar esta ruta
 * estándar antes de intentar nada más. Sin ella, esa búsqueda da 404, el
 * cliente lo traga en silencio y termina asumiendo que el propio CRM es el
 * servidor de autorización — que es justo el bug que reportó Nodia Agents.
 */
export const runtime = "nodejs";

export function GET(peticion: Request) {
  return Response.json(protectedResourceMetadata(peticion), {
    headers: CORS_HEADERS,
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

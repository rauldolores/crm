import { protectedResourceMetadata } from "@/lib/server/mcp/auth";
import { CORS_HEADERS } from "@/lib/server/mcp/cors";

/**
 * Fallback "raíz" de la RFC 9728 (sin el path del recurso): algunos
 * clientes MCP prueban esta ruta cuando la que trae el path falla. Ver
 * app/.well-known/oauth-protected-resource/api/mcp/route.ts para el porqué.
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

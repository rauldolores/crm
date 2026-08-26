import { kontroliaAuthConfig } from "@/lib/kontrolia-auth/config";
import { getBaseUrl } from "@/lib/server/mcp/auth";
import { CORS_HEADERS } from "@/lib/server/mcp/cors";

/**
 * Metadata RFC 9728 (OAuth 2.0 Protected Resource Metadata) que le dice a un
 * cliente MCP dónde autenticarse. No hace falta servir por separado el
 * documento RFC 8414 (.well-known/oauth-authorization-server): KontrolIA
 * Auth ya lo expone en su propio proyecto de Supabase.
 */
export const runtime = "nodejs";

export function GET(peticion: Request) {
  const baseUrl = getBaseUrl(peticion);
  return Response.json(
    {
      resource: `${baseUrl}/api/mcp`,
      authorization_servers: [`${kontroliaAuthConfig.supabaseUrl}/auth/v1`],
      bearer_methods_supported: ["header"],
    },
    { headers: CORS_HEADERS },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

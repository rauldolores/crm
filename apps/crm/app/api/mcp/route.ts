import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import {
  getBaseUrl,
  getResourceMetadataUrl,
  validateToken,
} from "@/lib/server/mcp/auth";
import { decodeJwt } from "jose";

import { exigirCupoDeUsuario } from "@/lib/server/exigirCupoDeUsuario";
import { CORS_HEADERS, withCors } from "@/lib/server/mcp/cors";
import { createMcpServer } from "@/lib/server/mcp/mcpServer";

/**
 * Servidor MCP para que un asistente de IA (Claude, ChatGPT, ...) consulte y
 * modifique los datos del CRM por instrucciones en lenguaje natural.
 *
 * Corre como ruta normal de Next.js, no como función Edge de Supabase: así
 * puede sostener una conexión Postgres cruda con `SET LOCAL
 * request.jwt.claims` para que RLS se aplique con el token del que llama
 * (necesario para las tools `query`/`mutate`, que ejecutan SQL arbitrario),
 * y conoce su propio dominio directo del Request — a diferencia del gateway
 * de Supabase Edge Functions, Vercel no pisa el host real.
 *
 * Sin estado: cada petición HTTP crea un McpServer y un transporte nuevos, y
 * los desecha al terminar — Vercel no garantiza que dos peticiones caigan en
 * la misma instancia.
 */
export const runtime = "nodejs";

const organizacionDelToken = (token: string): string | null => {
  try {
    const claims = decodeJwt(token) as { organization_id?: string };
    return claims.organization_id ?? null;
  } catch {
    return null;
  }
};

async function manejar(peticion: Request): Promise<Response> {
  const authInfo = await validateToken(peticion);
  if (!authInfo) {
    const metadataUrl = getResourceMetadataUrl(peticion);
    return withCors(
      new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}"`,
        },
      }),
    );
  }

  // Cupo de usuarios del plan: quien no tiene ficha ni cupo tampoco entra
  // por aquí (ver exigirCupoDeUsuario).
  const organizacionId = organizacionDelToken(authInfo.token);
  if (organizacionId) {
    const sinCupo = await exigirCupoDeUsuario(organizacionId, authInfo.userId);
    if (sinCupo) return withCors(sinCupo);
  }

  const server = createMcpServer(authInfo, getBaseUrl(peticion));
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless
  });

  await server.connect(transport);

  // Clean up server + transport when the connection closes.
  // Do NOT close in a finally block — the SSE response body is a
  // ReadableStream that must remain open until the client consumes it.
  transport.onclose = () => {
    server.close().catch(() => {});
  };

  try {
    const respuesta = await transport.handleRequest(peticion);
    return withCors(respuesta);
  } catch (error) {
    console.error("MCP request error:", error);
    await transport.close();
    await server.close();
    return withCors(new Response("Internal Server Error", { status: 500 }));
  }
}

export const GET = manejar;
export const POST = manejar;
export const DELETE = manejar;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

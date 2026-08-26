import { createRemoteJWKSet, jwtVerify } from "jose";

import { kontroliaAuthConfig } from "@/lib/kontrolia-auth/config";

/**
 * Verificación de bearer token para el servidor MCP.
 *
 * Verifica contra el JWKS de KontrolIA Auth (no el del proyecto de Supabase
 * del CRM): el token que manda un cliente MCP lo emite KontrolIA Auth, y en
 * una instalación autoalojada esos dos proyectos de Supabase normalmente son
 * distintos. Verificar contra el proyecto equivocado haría fallar la
 * autenticación siempre, salvo en esta instalación donde ambos coinciden.
 */

const JWT_ISSUER = `${kontroliaAuthConfig.supabaseUrl}/auth/v1`;
const JWKS = createRemoteJWKSet(
  new URL(`${kontroliaAuthConfig.supabaseUrl}/auth/v1/.well-known/jwks.json`),
);

export interface AuthInfo {
  token: string;
  userId: string;
  role?: string;
  clientId?: string;
}

export async function validateToken(req: Request): Promise<AuthInfo | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const [bearer, token] = authHeader.split(" ");
  if (bearer !== "Bearer" || !token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: JWT_ISSUER });
    if (!payload.sub) return null;

    return {
      token,
      userId: payload.sub,
      role: payload.role as string | undefined,
      clientId: payload.client_id as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Next.js en Vercel entrega el host real por el que llegó la petición (a
 * diferencia del gateway de Supabase Edge Functions, que lo pisa) — no hace
 * falta ninguna cabecera especial ni variable de entorno para esto.
 */
export function getBaseUrl(req: Request): string {
  return new URL(req.url).origin;
}

export function getResourceMetadataUrl(req: Request): string {
  return `${getBaseUrl(req)}/api/mcp/oauth-protected-resource`;
}
